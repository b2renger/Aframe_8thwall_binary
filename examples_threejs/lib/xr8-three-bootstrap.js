/**
 * xr8-three-bootstrap.js
 *
 * Shared bootstrap for raw Three.js r178 + XR8 image tracking.
 * Replaces 8frame / A-Frame with direct Three.js scene management
 * while keeping the 8th Wall engine for AR camera and image detection.
 *
 * Usage:
 *   import { startXR8, applyTargetPose } from './lib/xr8-three-bootstrap.js';
 *   const { scene, camera, renderer, clock } = await startXR8({ ... });
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Loading overlay
// ---------------------------------------------------------------------------

function createLoadingOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'xr8-loading';
  overlay.innerHTML = `
    <style>
      #xr8-loading {
        position: fixed; inset: 0; z-index: 9999;
        background: #000; color: #fff;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      }
      #xr8-loading .spinner {
        width: 40px; height: 40px; margin-bottom: 16px;
        border: 3px solid rgba(255,255,255,0.2);
        border-top-color: #fff; border-radius: 50%;
        animation: xr8spin 0.8s linear infinite;
      }
      @keyframes xr8spin { to { transform: rotate(360deg); } }
    </style>
    <div class="spinner"></div>
    <div>Loading AR&hellip;</div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function removeLoadingOverlay() {
  const el = document.getElementById('xr8-loading');
  if (el) el.remove();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Apply an XR8 image-target pose to a Three.js Object3D.
 * detail = { position: {x,y,z}, rotation: {w,x,y,z}, scale: number }
 */
export function applyTargetPose(obj, detail) {
  const { position, rotation, scale } = detail;
  obj.position.set(position.x, position.y, position.z);
  obj.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
  obj.scale.set(scale, scale, scale);
}

// ---------------------------------------------------------------------------
// startXR8
// ---------------------------------------------------------------------------

/**
 * Initialize XR8 + Three.js and start the AR camera.
 *
 * @param {Object}            config
 * @param {HTMLCanvasElement}  config.canvas          – Target <canvas>
 * @param {Array}              config.imageTargets     – imageTargetData array for XR8
 * @param {boolean}           [config.disableWorldTracking=true]
 * @param {Function}          [config.onImageFound]    – (detail) => void
 * @param {Function}          [config.onImageUpdated]  – (detail) => void
 * @param {Function}          [config.onImageLost]     – (detail) => void
 * @param {Function}          [config.onRenderLoop]    – ({scene,camera,renderer,clock}, delta) => void
 * @returns {Promise<{scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, clock: THREE.Clock}>}
 */
export async function startXR8(config) {
  const {
    canvas,
    imageTargets = [],
    disableWorldTracking = true,
    onImageFound,
    onImageUpdated,
    onImageLost,
    onRenderLoop,
  } = config;

  // Show loading overlay
  const loadingOverlay = createLoadingOverlay();

  // Shared state populated in onStart
  const state = {
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(60, 1, 0.01, 1000),
    renderer: null,
    clock: new THREE.Clock(),
  };

  // ------ Three.js pipeline module ------
  const threejsModule = {
    name: 'custom-threejs',

    onStart: ({ canvas: c, canvasWidth, canvasHeight, GLctx }) => {
      // Create renderer sharing XR8's GL context
      state.renderer = new THREE.WebGLRenderer({
        canvas: c,
        context: GLctx,
        alpha: true,
      });
      state.renderer.autoClear = false;
      // Use window dimensions for fullscreen; pass false to not touch CSS
      // (CSS handles the canvas sizing via position:fixed + 100%)
      state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      state.renderer.setSize(window.innerWidth, window.innerHeight, false);

      // Camera aspect
      state.camera.aspect = canvasWidth / canvasHeight;
      state.camera.updateProjectionMatrix();

      // Default lighting
      state.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const dir = new THREE.DirectionalLight(0xffffff, 0.8);
      dir.position.set(1, 2, 2);
      state.scene.add(dir);

      removeLoadingOverlay();
    },

    onUpdate: ({ processCpuResult }) => {
      // XR8 provides the camera projection matrix from intrinsics
      const realitySource =
        processCpuResult && processCpuResult.reality;
      if (realitySource) {
        const { rotation, position, intrinsics } = realitySource;

        // Apply camera pose from XR8
        if (rotation) {
          state.camera.quaternion.set(
            rotation.x, rotation.y, rotation.z, rotation.w
          );
        }
        if (position) {
          state.camera.position.set(position.x, position.y, position.z);
        }
        // Apply intrinsic projection matrix if available
        if (intrinsics) {
          state.camera.projectionMatrix.fromArray(intrinsics);
          state.camera.projectionMatrixInverse
            .copy(state.camera.projectionMatrix)
            .invert();
        }
      }

      // Per-frame user callback
      if (onRenderLoop) {
        const delta = state.clock.getDelta();
        onRenderLoop(state, delta);
      }
    },

    onCanvasSizeChange: ({ canvasWidth, canvasHeight }) => {
      if (!state.renderer) return;
      state.renderer.setSize(canvasWidth, canvasHeight, false);
      state.camera.aspect = canvasWidth / canvasHeight;
      state.camera.updateProjectionMatrix();
    },

    onRender: () => {
      // Clear only depth so the camera feed (drawn by GlTextureRenderer) stays
      state.renderer.clearDepth();
      state.renderer.render(state.scene, state.camera);
    },

    onException: (error) => {
      removeLoadingOverlay();
      console.error('[XR8] Exception:', error);
    },
  };

  // ------ Image target event listeners ------
  if (onImageFound) {
    document.addEventListener('xrimagefound', (e) => onImageFound(e.detail));
  }
  if (onImageUpdated) {
    document.addEventListener('xrimageupdated', (e) => onImageUpdated(e.detail));
  }
  if (onImageLost) {
    document.addEventListener('xrimagelost', (e) => onImageLost(e.detail));
  }

  // ------ Wait for XR8 engine ------
  await new Promise((resolve) => {
    if (window.XR8) return resolve();
    window.addEventListener('xrloaded', resolve);
  });

  // ------ Configure & run ------
  // Camera feed renderer (must be added first so it draws the background)
  XR8.addCameraPipelineModule(XR8.GlTextureRenderer.pipelineModule());

  // Our Three.js module
  XR8.addCameraPipelineModule(threejsModule);

  // XR tracking controller
  XR8.addCameraPipelineModule(XR8.XrController.pipelineModule());

  // Configure image targets
  XR8.XrController.configure({
    disableWorldTracking,
    imageTargetData: imageTargets,
  });

  // Start
  XR8.run({ canvas });

  return state;
}
