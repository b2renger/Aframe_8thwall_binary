/**
 * xr8-three-bootstrap.js: the shared plumbing behind every image-target Three.js example.
 * You normally DON'T need to edit this file. Copy an example HTML file and change that instead.
 * Plain-words explanation: README > "How the raw Three.js versions work".
 *
 * How it works:
 *   - The 8th Wall engine (XR8) draws the camera video on <canvas id="xr-canvas">.
 *   - This file adds a second, transparent canvas on top, where Three.js draws your 3D.
 *   - Every frame, XR8 tells us where the phone is ("pose" = position + rotation) and how
 *     its camera lens sees ("intrinsics"). We copy both into the Three.js camera so your 3D
 *     lines up with the video. A "pipeline module" is just an object of functions
 *     (onStart, onUpdate, onRender...) that XR8 calls at those moments.
 *
 * Usage (see any example HTML file):
 *   const { scene } = await startXR8({
 *     canvas,                        // the <canvas id="xr-canvas"> element
 *     imageTargets: [...],           // the printed images to look for (README > Changing the image target)
 *     onImageFound(detail) {},       // image first seen. detail = { name, position, rotation, scale }
 *     onImageUpdated(detail) {},     // image still seen (every frame): move your content to it
 *     onImageLost(detail) {},        // image gone. detail.name says which one
 *     onRenderLoop(state, delta) {}, // every frame: animate here. delta = seconds since last frame
 *   });
 *   scene.add(myGroup);
 *   // startXR8 also returns camera, renderer, clock and sun (the shadow light) if you need them.
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

/**
 * Show a readable error on screen (on a phone you can't see the console).
 * A-Frame examples get this from xrextras-runtime-error; raw Three.js has to do it itself.
 */
function showErrorOverlay(title, detail) {
  removeLoadingOverlay();
  if (document.getElementById('xr8-error')) return;
  const box = document.createElement('div');
  box.id = 'xr8-error';
  box.style.cssText =
    'position:fixed; inset:0; z-index:9999; background:#000; color:#fff; padding:24px;' +
    'display:flex; flex-direction:column; justify-content:center; gap:12px;' +
    'font-family:-apple-system, BlinkMacSystemFont, sans-serif; text-align:center;';
  const h = document.createElement('div');
  h.style.cssText = 'font-size:20px; font-weight:600;';
  h.textContent = title;
  const p = document.createElement('div');
  p.style.cssText = 'font-size:14px; opacity:0.75; word-break:break-word;';
  p.textContent = detail;
  const hint = document.createElement('div');
  hint.style.cssText = 'font-size:13px; opacity:0.5;';
  hint.textContent = 'Tip: add ?debug to the URL to open an on-phone console.';
  box.append(h, p, hint);
  document.body.appendChild(box);
}

// If an example fails BEFORE it calls startXR8() (for example a wrong file
// name in loader.loadAsync('../assets/my-model.glb')), the page would stay
// blank. Show the problem on screen instead.
let arStarted = false; // set by startXR8(): from then on XR8 reports its own errors
function showEarlyError(reason) {
  if (arStarted) return;
  let msg = 'Unknown error';
  if (reason && reason.message) msg = reason.message;
  else if (reason && reason.target && reason.target.src) msg = 'Could not load ' + reason.target.src; // a missing image
  else if (reason) msg = String(reason);
  showErrorOverlay('The example could not start',
    msg + ' (check the file names and paths in this example: upper/lower case matters)');
}
window.addEventListener('error', (e) => showEarlyError(e.error || e.message));
window.addEventListener('unhandledrejection', (e) => showEarlyError(e.reason));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Apply an XR8 image-target pose to a Three.js Object3D.
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

  arStarted = true; // errors are now handled by onException / onCameraStatusChange below
  createLoadingOverlay();

  const state = {
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(
      60, window.innerWidth / window.innerHeight, 0.01, 1000
    ),
    renderer: null,
    clock: new THREE.Clock(),
    sun: null,
  };

  // Track active image targets for found/lost detection
  const activeTargets = new Set();
  const _vec3 = new THREE.Vector3();
  const _quat = new THREE.Quaternion();

  // ------ Three.js pipeline module ------
  const threejsModule = {
    name: 'custom-threejs',

    onStart: () => {
      // Separate canvas for Three.js — avoids GL context conflicts with XR8
      const threeCanvas = document.createElement('canvas');
      threeCanvas.id = 'three-canvas';
      threeCanvas.style.cssText =
        'position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1;';
      document.body.appendChild(threeCanvas);

      state.renderer = new THREE.WebGLRenderer({
        canvas: threeCanvas,
        alpha: true,
        antialias: true,
      });
      state.renderer.setClearColor(0x000000, 0);
      // Resolution of the 3D layer. 1 = fast but slightly blurry on sharp phone screens.
      // For crisper 3D and text, change the 1 to 2 (uses more battery and can be slower).
      state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
      state.renderer.setSize(window.innerWidth, window.innerHeight, false);

      // Enable shadows
      state.renderer.shadowMap.enabled = true;
      state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Natural lighting: soft ambient + directional sun with shadows
      const hemi = new THREE.HemisphereLight(0xddeeff, 0x332211, 0.6);
      state.scene.add(hemi);

      // Shadow light lives at scene level (always visible, never toggled
      // by group.visible) so shadows survive lost/re-found cycles.
      state.sun = new THREE.DirectionalLight(0xfff5e0, 1.0);
      state.sun.position.set(2, 4, 2);
      state.sun.castShadow = true;
      state.sun.shadow.mapSize.set(1024, 1024);
      state.sun.shadow.camera.near = 0.01;
      state.sun.shadow.camera.far = 50;
      state.sun.shadow.camera.left = -5;
      state.sun.shadow.camera.right = 5;
      state.sun.shadow.camera.top = 5;
      state.sun.shadow.camera.bottom = -5;
      state.sun.shadow.bias = -0.005;
      state.scene.add(state.sun);
      state.scene.add(state.sun.target);

      removeLoadingOverlay();
    },

    onUpdate: ({ processCpuResult }) => {
      if (!processCpuResult) return;

      const realitySource = processCpuResult.reality;
      if (realitySource) {
        const { rotation, position, intrinsics } = realitySource;

        if (rotation) {
          state.camera.quaternion.set(
            rotation.x, rotation.y, rotation.z, rotation.w
          );
        }
        if (position) {
          state.camera.position.set(position.x, position.y, position.z);
        }
        // Only apply intrinsics when all values are finite
        if (intrinsics && !intrinsics.some(v => !Number.isFinite(v))) {
          state.camera.projectionMatrix.fromArray(intrinsics);
          state.camera.projectionMatrixInverse
            .copy(state.camera.projectionMatrix)
            .invert();
        }

        // --- Image targets from detectedImages (per-frame, continuous) ---
        const detected = realitySource.detectedImages;
        if (detected) {
          const currentNames = new Set();

          for (const img of detected) {
            currentNames.add(img.name);
            if (!activeTargets.has(img.name)) {
              // Newly found
              activeTargets.add(img.name);
              if (onImageFound) onImageFound(img);
            } else {
              // Still tracking
              if (onImageUpdated) onImageUpdated(img);
            }
          }

          // Check for lost targets
          for (const name of activeTargets) {
            if (!currentNames.has(name)) {
              activeTargets.delete(name);
              if (onImageLost) onImageLost({ name });
            }
          }

          // Move scene-level shadow light to follow first tracked target
          if (state.sun && detected.length > 0) {
            const img = detected[0];
            const p = img.position;
            const q = _quat.set(img.rotation.x, img.rotation.y, img.rotation.z, img.rotation.w);
            const offset = _vec3.set(1, 3, 1).applyQuaternion(q).multiplyScalar(img.scale);
            state.sun.position.set(p.x + offset.x, p.y + offset.y, p.z + offset.z);
            state.sun.target.position.set(p.x, p.y, p.z);
            state.sun.target.updateMatrixWorld();
          }
        }
      }

      if (onRenderLoop) {
        const delta = state.clock.getDelta();
        onRenderLoop(state, delta);
      }
    },

    onCanvasSizeChange: () => {
      if (!state.renderer) return;
      state.renderer.setSize(window.innerWidth, window.innerHeight, false);
      state.camera.aspect = window.innerWidth / window.innerHeight;
      state.camera.updateProjectionMatrix();
    },

    onRender: () => {
      state.renderer.render(state.scene, state.camera);
    },

    onCameraStatusChange: ({ status }) => {
      if (status === 'failed') {
        showErrorOverlay(
          'Camera unavailable',
          'Allow camera access and make sure the page is served over HTTPS.'
        );
      }
    },

    onException: (error) => {
      console.error('[XR8] Exception:', error);
      showErrorOverlay('Something went wrong', String(error && error.message || error));
    },
  };

  // ------ Image target pipeline module (listener fallback) ------
  const imageTargetModule = {
    name: 'image-target-events',
    listeners: [
      {
        event: 'reality.imagefound',
        process: ({ detail }) => {
          if (detail && !activeTargets.has(detail.name)) {
            activeTargets.add(detail.name);
            if (onImageFound) onImageFound(detail);
          }
        },
      },
      {
        event: 'reality.imageupdated',
        process: ({ detail }) => {
          if (detail && onImageUpdated) onImageUpdated(detail);
        },
      },
      {
        event: 'reality.imagelost',
        process: ({ detail }) => {
          // The per-frame check in onUpdate may already have reported this loss
          if (detail && activeTargets.delete(detail.name)) {
            if (onImageLost) onImageLost(detail);
          }
        },
      },
    ],
  };

  // ------ Wait for XR8 engine ------
  await new Promise((resolve) => {
    if (window.XR8) return resolve();
    window.addEventListener('xrloaded', resolve);
  });

  // ------ Configure & run ------
  XR8.addCameraPipelineModule(XR8.GlTextureRenderer.pipelineModule());
  XR8.addCameraPipelineModule(threejsModule);
  XR8.addCameraPipelineModule(imageTargetModule);
  XR8.addCameraPipelineModule(XR8.XrController.pipelineModule());

  XR8.XrController.configure({
    disableWorldTracking,
    imageTargetData: imageTargets,
  });

  // Size the XR8 canvas before run() so intrinsics use the correct aspect ratio
  const dpr = Math.min(window.devicePixelRatio, 1);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);

  // ANY: image targets also work with a laptop webcam (handy for testing).
  // With the default (mobile only) XR8 silently refuses to start on a desktop.
  XR8.run({ canvas, allowedDevices: XR8.XrConfig.device().ANY });

  return state;
}
