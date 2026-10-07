/**
 * tap-to-place.js — shared A-Frame components for the world-effect examples.
 * Load it after 8frame:  <script src="lib/tap-to-place.js"></script>
 *
 *   <a-entity tap-to-place> … </a-entity>
 *       Hidden until the first tap, then placed on the ground (y = 0) under the
 *       finger, turned to face the camera. Emits "tap-placed" on the scene
 *       (listen for it to start a sound or a video, see 06_audio.html).
 *       Later taps are ignored (reload the page to place it again).
 *
 *   <a-entity tap-to-cycle> <a-entity>…</a-entity> <a-entity>…</a-entity> </a-entity>
 *       Each tap places the next child (in the order they are written), until all
 *       children are placed; after that, taps do nothing.
 *
 *   Good to know: the tap REPLACES the position (and the turn) of the placed entity
 *   (the tap-to-place entity, or each child of tap-to-cycle), so position="0 1 0"
 *   written on it is ignored. To lift or shift content, put the position on the
 *   elements inside it (as the examples do). scale="2 2 2" on it does work.
 *   Keep these entities directly inside <a-scene>, not inside another moved entity.
 *
 * Taps are read from the 'click' event: unlike 'touchstart', it counts as a user
 * gesture, so audio/video started in reaction to the tap is allowed to play.
 */

// Wrapped in (function () { ... })() so the helper functions below stay private
// and can't clash with a function of the same name in your own page.
(function () {

// On iPhone, the AR engine replaces the real tap by its own "click" event whose
// screen position is (0, 0). So we remember where the finger really was (these
// listeners run first, in the "capture" phase) and use that position instead.
let lastTouch = null;
function rememberTouch(e) {
  const t = e.changedTouches && e.changedTouches[0];
  if (t) lastTouch = { x: t.clientX, y: t.clientY };
}
window.addEventListener('touchstart', rememberTouch, true);
window.addEventListener('touchend', rememberTouch, true);

function tapPosition(evt) {
  if (evt.clientX === 0 && evt.clientY === 0 && lastTouch) return lastTouch;
  return { x: evt.clientX, y: evt.clientY };
}

/**
 * Screen tap -> point on the ground plane y = 0 under the finger.
 * Falls back to 2 units in front of the camera if the tap points at the sky
 * (or the ground point is more than 30 units away).
 */
function groundPointFromTap(evt, canvas, camera) {
  const rect = canvas.getBoundingClientRect();
  const tap = tapPosition(evt);
  const x = ((tap.x - rect.left) / rect.width) * 2 - 1;
  const y = -((tap.y - rect.top) / rect.height) * 2 + 1;

  // sceneEl.camera sits inside the <a-camera> entity: use its WORLD transform
  camera.updateMatrixWorld();
  const camPos = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
  // The AR engine rewrites projectionMatrix every frame, so invert it here
  const invProj = new THREE.Matrix4().copy(camera.projectionMatrix).invert();
  const dir = new THREE.Vector3(x, y, 0.5)
    .applyMatrix4(invProj)
    .applyMatrix4(camera.matrixWorld)
    .sub(camPos)
    .normalize();

  let pos = null;
  if (dir.y < -1e-3) {
    const t = -camPos.y / dir.y;
    if (t < 30) pos = camPos.clone().addScaledVector(dir, t);
  }
  if (!pos) {
    const forward = new THREE.Vector3(0, 0, -1).transformDirection(camera.matrixWorld);
    pos = camPos.clone().addScaledVector(forward, 2);
    pos.y = 0;
  }
  const rotationY = Math.atan2(camPos.x - pos.x, camPos.z - pos.z);
  return { pos, rotationY };
}

function onCanvasClick(sceneEl, handler) {
  const attach = () => sceneEl.canvas.addEventListener('click', handler);
  if (sceneEl.canvas) attach();
  else sceneEl.addEventListener('render-target-loaded', attach, { once: true });
}

AFRAME.registerComponent('tap-to-place', {
  init: function () {
    this.placed = false;
    this.el.setAttribute('visible', false);

    this.onTap = (e) => {
      if (this.placed) return;
      const sceneEl = this.el.sceneEl;
      const { pos, rotationY } = groundPointFromTap(e, sceneEl.canvas, sceneEl.camera);
      this.el.object3D.position.copy(pos);
      this.el.object3D.rotation.y = rotationY;
      this.el.setAttribute('visible', true);
      this.placed = true;
      sceneEl.emit('tap-placed');
    };
    onCanvasClick(this.el.sceneEl, this.onTap);
  },
  remove: function () {
    if (this.el.sceneEl.canvas) this.el.sceneEl.canvas.removeEventListener('click', this.onTap);
  }
});

AFRAME.registerComponent('tap-to-cycle', {
  init: function () {
    this.items = Array.from(this.el.children).filter((c) => c.tagName.startsWith('A-'));
    this.index = 0;
    this.items.forEach((item) => item.setAttribute('visible', false));

    this.onTap = (e) => {
      if (this.index >= this.items.length) return;
      const item = this.items[this.index];
      const sceneEl = this.el.sceneEl;
      const { pos, rotationY } = groundPointFromTap(e, sceneEl.canvas, sceneEl.camera);
      item.object3D.position.copy(pos);
      item.object3D.rotation.y = rotationY;
      item.setAttribute('visible', true);
      this.index++;
      sceneEl.emit('tap-placed');
    };
    onCanvasClick(this.el.sceneEl, this.onTap);
  },
  remove: function () {
    if (this.el.sceneEl.canvas) this.el.sceneEl.canvas.removeEventListener('click', this.onTap);
  }
});

})();
