/**
 * xr8-three-world-bootstrap.js
 *
 * Shared bootstrap for raw Three.js r178 + XR8 world tracking (tap-to-place).
 * You normally DON'T need to edit this file (copy an example HTML file and change
 * that instead). The one value you may want to change is CAMERA_ORIGIN (the scale).
 *
 * Architecture:
 *   - XR8 renders camera feed on the original <canvas>
 *   - Three.js renders 3D on a separate transparent canvas on top
 *   - XR8 pipeline provides camera pose each frame (world tracking enabled)
 *
 * How the examples use it:
 *   const { scene } = await startXR8World({
 *     canvas: document.getElementById('xr-canvas'),
 *     // Runs on EVERY tap. position = point on the floor (y = 0) under the
 *     // finger (or 2 units in front if you tap the sky); rotationY = turn that
 *     // makes the content face you.
 *     onTapPlace: (position, state, rotationY) => { ... },
 *     // Optional. Runs every frame: put animations here.
 *     // delta = seconds since the previous frame.
 *     onRenderLoop: (state, delta) => { ... },
 *   });
 *   scene.add(myGroup);
 * `state` is the same object in both: { scene, camera, renderer, clock, sun }.
 *
 * Units: Y is up, the floor is y = 0, and the phone starts at (0, 4, 10).
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

// If an example fails BEFORE it calls startXR8World() (for example a wrong file
// name in loader.loadAsync('../assets/my-model.glb')), the page would stay
// blank. Show the problem on screen instead.
let arStarted = false; // set by startXR8World(): from then on XR8 reports its own errors
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

const CAMERA_ORIGIN = { x: 0, y: 4, z: 10 };

const _raycaster = new THREE.Raycaster();
const _ndc = new THREE.Vector2();
const _ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // y = 0
const _hit = new THREE.Vector3();

/**
 * Turn a tap on the screen into a point on the ground (y = 0) under the finger,
 * plus a Y rotation that makes placed content face the camera.
 * If the tap points at the sky (no ground hit), falls back to 2 units in front.
 */
export function groundPointFromTap(event, canvas, camera) {
  const rect = canvas.getBoundingClientRect();
  _ndc.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  camera.updateMatrixWorld();
  _raycaster.setFromCamera(_ndc, camera);

  const position = new THREE.Vector3();
  const hit = _raycaster.ray.intersectPlane(_ground, _hit);
  if (hit && hit.distanceTo(camera.position) < 30) {
    position.copy(hit);
  } else {
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    position.copy(camera.position).add(dir.multiplyScalar(2));
    position.y = 0;
  }
  const rotationY = Math.atan2(
    camera.position.x - position.x,
    camera.position.z - position.z
  );
  return { position, rotationY };
}

// ---------------------------------------------------------------------------
// startXR8World
// ---------------------------------------------------------------------------

export async function startXR8World(config) {
  const {
    canvas,
    onTapPlace,
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

      // Natural lighting
      const hemi = new THREE.HemisphereLight(0xddeeff, 0x332211, 0.6);
      state.scene.add(hemi);

      // The shadow-casting light every example uses. Change its position,
      // intensity or shadow area here. Shadows are only drawn in a 10 x 10 area
      // around sun.target, so each tap moves the sun (see Tap-to-place below).
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

      // Camera start position. Its height sets the scale of the scene: the
      // ground is y=0 and the phone starts CAMERA_ORIGIN.y units above it, so
      // 4 units ≈ the phone's height. Bigger height number => content looks SMALLER.
      // Same values as <a-camera position="0 4 10"> in the A-Frame versions.
      state.camera.position.set(CAMERA_ORIGIN.x, CAMERA_ORIGIN.y, CAMERA_ORIGIN.z);
      XR8.XrController.updateCameraProjectionMatrix({
        origin: state.camera.position,
        facing: state.camera.quaternion,
      });

      // --- Tap-to-place ---
      // 'click' (not 'touchstart') because only click/touchend count as a user
      // gesture: audio.play() inside onTapPlace would be blocked otherwise.
      canvas.addEventListener('click', (e) => {
        if (!onTapPlace) return;
        const { position, rotationY } = groundPointFromTap(e, canvas, state.camera);
        // Shadows are only drawn in a 10 x 10 area around the sun's target,
        // so move the sun to the tapped spot: placed content then gets its shadows.
        state.sun.target.position.copy(position);
        state.sun.position.set(position.x + 2, position.y + 4, position.z + 2);
        onTapPlace(position, state, rotationY);
      });

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
      const msg = String(error && error.message || error);
      showErrorOverlay(
        /session manager/i.test(msg) ? 'AR could not start' : 'Something went wrong',
        /session manager/i.test(msg)
          ? 'World tracking needs a phone or tablet (it does not run on a desktop webcam).'
          : msg
      );
    },
  };

  // ------ Wait for XR8 engine ------
  await new Promise((resolve) => {
    if (window.XR8) return resolve();
    window.addEventListener('xrloaded', resolve);
  });

  // ------ Configure & run (world tracking enabled, no image targets) ------
  XR8.addCameraPipelineModule(XR8.GlTextureRenderer.pipelineModule());
  XR8.addCameraPipelineModule(threejsModule);
  XR8.addCameraPipelineModule(XR8.XrController.pipelineModule());

  XR8.XrController.configure({
    disableWorldTracking: false,
  });

  // Size the XR8 canvas before run()
  const dpr = Math.min(window.devicePixelRatio, 1);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);

  // Default allowedDevices (mobile): on a desktop XR8 throws "No valid session
  // manager", which onException turns into a readable message.
  XR8.run({ canvas });

  return state;
}
