# Implementation Plan: A-Frame + 8th Wall AR Examples

## Context

Project provides 9 self-contained AR examples in 4 modes: Image Target and World Effect, each in A-Frame (8frame) and raw Three.js. Image target examples anchor content to a tracked image. World effect examples use tap-to-place on detected surfaces with world tracking enabled.

---

## File Structure

```
Aframe_8thwall_binary/
├── index.html                          (navigation — 4 sections, 36 cards)
├── README.md
├── engine/                             (8th Wall XR engine binary)
├── assets/                             (shared assets)
├── agents/
│   ├── research.md
│   └── plan.md                         (this file)
├── image_target_8thFrame/              (A-Frame + image tracking)
│   ├── 01_primitives.html ... 09_multi_targets.html
├── image_target_Threejs/               (Three.js r178 + image tracking)
│   ├── lib/xr8-three-bootstrap.js
│   ├── 01_primitives.html ... 09_multi_targets.html
├── world_8thFrame/                     (A-Frame + world tracking, tap-to-place)
│   ├── 01_primitives.html ... 09_multi_targets.html
└── world_Threejs/                      (Three.js r178 + world tracking, tap-to-place)
    ├── lib/xr8-three-world-bootstrap.js
    ├── 01_primitives.html ... 09_multi_targets.html
```

---

## Shared HTML Template

Every example follows the same base structure from `index.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>[EXAMPLE TITLE]</title>
  <script src="https://cdn.8thwall.com/web/aframe/8frame-1.3.0.min.js"></script>
  <script src="https://cdn.8thwall.com/web/xrextras/xrextras.js"></script>
  <!-- [per-example extra libraries] -->
  <script async src="../engine/xr.js" data-preload-chunks="slam"></script>
  <script>
    const onxrloaded = () => {
      XR8.XrController.configure({
        imageTargetData:[{
          "name": "my-poster", "type": "PLANAR",
          "imagePath": "../assets/1000055040bw-resize-640x480.jpg",
          "properties": { "left":0,"top":0,"width":480,"height":640,
                          "originalWidth":480,"originalHeight":640,"isRotated":false }
        }]
      });
    };
    window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded);
  </script>
  <!-- [per-example custom components/shaders] -->
</head>
<body>
  <a-scene xrextras-gesture-detector xrextras-almost-there
           xrextras-loading xrextras-runtime-error
           xrweb="disableWorldTracking: true">
    <a-camera position="0 4 10"></a-camera>
    <xrextras-named-image-target name="my-poster">
      <!-- [AR content] -->
    </xrextras-named-image-target>
  </a-scene>
</body>
</html>
```

---

## Example Details

### 01 — 3D Primitives (`01_primitives.html`)

**Extra libs:** none
**Content:**
- 6 primitives: `a-box`, `a-sphere`, `a-cylinder`, `a-cone`, `a-torus`, `a-ring`
- Arranged in 2 rows with different colors
- Each has a different animation (rotation, position bounce, scale pulse)
- Semi-transparent ground `a-plane` beneath
- Title `a-text` above

---

### 02 — Text & MSDF Fonts (`02_text_msdf.html`)

**Extra libs:** none (fonts loaded via URL in `font` attribute)
**Content:**
- Default `a-text` with built-in Roboto
- 3 MSDF fonts via `a-entity text="shader: msdf; font: [URL]"`:
  - Creepster: `https://raw.githubusercontent.com/etiennepinchon/aframe-fonts/master/fonts/creepster/Creepster-Regular.json`
  - Berkshire Swash: `.../berkshireswash/BerkshireSwash-Regular.json`
  - Crimson Text: `.../crimsontext/CrimsonText-Regular.json`
- Size comparison (different `width` values)

---

### 03 — Images (`03_images.html`)

**Extra libs:** none
**Content:**
- `<a-assets>` with `<img>` elements + `crossorigin="anonymous"`
- Method 1: `a-image` primitive
- Method 2: `a-plane` with `src`
- Method 3: `a-plane` with `material="src: #id; repeat: 2 2"`
- Comments instructing user to provide their own images in `assets/`

---

### 04 — 3D Models (`04_3d_models.html`)

**Extra libs:**
```html
<script src="https://cdn.jsdelivr.net/gh/c-frame/aframe-extras@7.6.1/dist/aframe-extras.min.js"></script>
```
**Content:**
- `a-asset-item` preloading a GLB
- `gltf-model="#model"` + `animation-mixer="clip: *; loop: repeat"`
- User provides `assets/sample.glb`

---

### 05 — Video Chromakey (`05_video_chroma.html`)

**Extra libs:** none (inline shader)
**Custom shader:** `AFRAME.registerShader('chromakey', {...})`
- Vertex: UV pass-through + MVP transform
- Fragment: `float a = (length(tColor - color) - 0.5) * 7.0;`
- Schema: `src` (map), `color` (vec3, default `0 1 0`), `transparent` (bool)

**Content:**
- `<video>` in `a-assets` with `autoplay loop muted playsinline`
- `a-entity` with `geometry="primitive: plane"` + `material="shader: chromakey; src: #vid; color: 0 1 0"`
- User provides `assets/greenscreen.mp4`

---

### 06 — Audio (`06_audio.html`)

**Extra libs:** none
**Custom component:** `AFRAME.registerComponent('image-target-audio', {...})`
- Listens `xrimagefound` / `xrimagelost` on `this.el.sceneEl`
- Filters by `event.detail.name`
- `new Audio(src)` with `.play()` / `.pause()`
- Cleanup in `remove()`

**Content:**
- Audio component on an entity
- Visual speaker indicator with animated rings
- User provides `assets/sample-audio.mp3`

---

### 07 — p5.js Sketch (`07_p5js.html`)

**Extra libs:**
```html
<script src="https://cdn.jsdelivr.net/npm/p5@1.9.4/lib/p5.min.js"></script>
```
**Custom component:** `AFRAME.registerComponent('p5-texture', {...})`
- Hidden container + `new p5(function(p){...})` instance mode
- Built-in example sketch: animated colorful circles
- `tick()`: `THREE.CanvasTexture` + `needsUpdate = true`

**Content:**
- `a-plane` with `p5-texture="width: 256; height: 256"` + `material="shader: flat"`

---

### 08 — Gaussian Splat (`08_gaussian_splat.html`)

**Extra libs:** spark.js via dynamic ES module import
**Custom component:** `AFRAME.registerComponent('spark-splat', {...})`
- `init`: `await import('https://cdn.jsdelivr.net/npm/@sparkjsdev/spark/+esm')`
- Creates `SplatMesh({ url: src })`, adds to `this.el.object3D`
- Cleanup: `remove()` + `dispose()`

**Content:**
- `a-entity spark-splat="src: ../assets/sample.sog"`
- User provides `assets/sample.sog` (or `.splat`/`.ply`)

---

### 09 — Multi Image Targets (`09_multi_targets.html`)

**Extra libs:** none
**Key difference from other examples:** The `imageTargetData` array contains **multiple** targets, and the scene has **multiple** `<xrextras-named-image-target>` elements — one per target.

**Configuration:**
```javascript
XR8.XrController.configure({
  imageTargetData: [
    {
      "name": "poster-a",
      "type": "PLANAR",
      "imagePath": "../assets/1000055040bw-resize-640x480.jpg",
      "properties": { "left":0,"top":0,"width":480,"height":640,
                      "originalWidth":480,"originalHeight":640,"isRotated":false }
    },
    {
      "name": "poster-b",
      "type": "PLANAR",
      "imagePath": "../assets/target-b.jpg",
      "properties": { "left":0,"top":0,"width":480,"height":640,
                      "originalWidth":480,"originalHeight":640,"isRotated":false }
    }
  ]
});
```

**Scene content:**
```html
<xrextras-named-image-target name="poster-a">
  <a-box color="#FF0055" position="0 0.5 0"></a-box>
  <a-text value="Target A" color="white" align="center" position="0 1.5 0"></a-text>
</xrextras-named-image-target>

<xrextras-named-image-target name="poster-b">
  <a-sphere color="#00AAFF" position="0 0.5 0" radius="0.4"></a-sphere>
  <a-text value="Target B" color="white" align="center" position="0 1.5 0"></a-text>
</xrextras-named-image-target>
```

**What this demonstrates:**
- Multiple entries in `imageTargetData` array
- Separate `<xrextras-named-image-target>` for each target (different `name`)
- Different AR content per target (both can be visible simultaneously)
- User provides a second image target `assets/target-b.jpg`
- Comments explain how to adjust `width`/`height` properties per image

---

## README.md Structure

```markdown
# A-Frame + 8th Wall Binary: Image Tracking Examples

## Overview
## Prerequisites
## Project Structure
## Quick Start
## Examples
  ### 01 — 3D Primitives
  ### 02 — Text & MSDF Fonts
  ### 03 — Images
  ### 04 — 3D Models
  ### 05 — Video Chromakey
  ### 06 — Audio
  ### 07 — p5.js Sketch
  ### 08 — Gaussian Splat
  ### 09 — Multi Image Targets
## Creating Custom Image Targets
## CDN Libraries Used
## Resources
## Troubleshooting
```

---

## Implementation Order

1. ~~`agents/research.md`~~ (DONE)
2. `examples/01_primitives.html` — simplest, validates template
3. `examples/02_text_msdf.html`
4. `examples/03_images.html`
5. `examples/06_audio.html`
6. `examples/04_3d_models.html`
7. `examples/05_video_chroma.html`
8. `examples/07_p5js.html`
9. `examples/08_gaussian_splat.html`
10. `examples/09_multi_targets.html`
11. `README.md`

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Examples in `examples/` subfolder | Keeps root clean, relative paths `../engine/` and `../assets/` |
| CDN from `cdn.8thwall.com` | Matches existing working `index.html` |
| spark.js for Gaussian splats | Supports `.sog` natively via THREE.js integration |
| p5.js v1.9.4 | v2.x has breaking changes to instance mode |
| All code inline per file | Each example is fully self-contained |
| Placeholder-only assets | Users provide their own GLB/MP4/MP3/SOG/JPG files |

---

## Raw Three.js Examples (`examples_threejs/`)

### Why a second set of examples?

8frame 1.3.0 bundles Three.js r137. Modern libraries like spark.js (Gaussian Splatting) require Three.js r178+. Attempts to work around this failed:

- **Polyfills (Matrix2, Data3DTexture, etc.)** — fix JS API renames but cannot patch shader compilation differences
- **Dual Three.js instances** — loading r178 alongside r137 causes `material.onBuild is not a function` because the r137 renderer cannot draw materials created by r178
- **A-Frame 1.7.0** — bundles r173, still too old for spark.js (needs r178)

The solution: raw Three.js r178 + XR8 camera pipeline hooks, no A-Frame/8frame.

### Architecture

```
examples_threejs/
├── lib/
│   └── xr8-three-bootstrap.js   ← shared XR8 + Three.js setup (ES module)
├── 01_primitives.html
├── 02_text_msdf.html
├── 03_images.html
├── 04_3d_models.html
├── 05_video_chroma.html
├── 06_audio.html
├── 07_p5js.html
├── 08_gaussian_splat.html        ← spark.js works natively here
└── 09_multi_targets.html
```

### Shared bootstrap: `lib/xr8-three-bootstrap.js`

ES module that every example imports. Key responsibilities:

1. Creates `THREE.WebGLRenderer` sharing XR8's GL context (`{ canvas, context: GLctx, alpha: true }`)
2. Registers XR8 camera pipeline modules in order:
   - `XR8.GlTextureRenderer.pipelineModule()` — draws camera feed as background
   - Custom "threejs" module — applies camera pose/projection from XR8, renders scene
   - `XR8.XrController.pipelineModule()` — tracking controller
3. Listens for `xrimagefound`/`xrimageupdated`/`xrimagelost` DOM events
4. Shows/removes CSS loading overlay
5. Adds default ambient + directional lights

**Exported API:**
```js
export async function startXR8({ canvas, imageTargets, disableWorldTracking,
  onImageFound, onImageUpdated, onImageLost, onRenderLoop })
  → { scene, camera, renderer, clock }

export function applyTargetPose(obj, detail)
```

### Import map (in each HTML `<head>`)

```html
<script type="importmap">
{ "imports": {
    "three": "https://esm.sh/three@0.178.0",
    "three/addons/": "https://esm.sh/three@0.178.0/examples/jsm/"
} }
</script>
```

### CDN libraries

| Library | URL | Used in |
|---------|-----|---------|
| Three.js r178 | `esm.sh/three@0.178.0` | All examples |
| troika-three-text | `esm.sh/troika-three-text@0.52.4?external=three` | 02 (text) |
| spark.js | `esm.sh/@sparkjsdev/spark@0.1.10?external=three` | 08 (splats) |
| p5.js 1.9.4 | `cdn.jsdelivr.net/npm/p5@1.9.4/lib/p5.min.js` | 07 (p5) |
| GLTFLoader | `esm.sh/three@0.178.0/examples/jsm/loaders/GLTFLoader.js` | 04 (models) |

### Key differences from A-Frame examples

| Concern | A-Frame (`examples/`) | Raw Three.js (`examples_threejs/`) |
|---------|----------------------|-----------------------------------|
| Scene setup | `<a-scene>` auto-creates renderer | Manual `THREE.Scene`, `THREE.WebGLRenderer` |
| Camera feed | `xrweb` component | `XR8.GlTextureRenderer.pipelineModule()` |
| Image tracking | `xrextras-named-image-target` show/hide | DOM events → manual `group.visible` toggle |
| Lighting | A-Frame default lights | Explicit `AmbientLight` + `DirectionalLight` |
| Animation | Declarative `animation="..."` | Render loop with `performance.now()` |
| Text | `<a-text>` / MSDF shader | `troika-three-text` or `CanvasTexture` sprites |
| GLTF | `gltf-model` + `animation-mixer` | `GLTFLoader` + `THREE.AnimationMixer` |
| Video | `<video>` in `<a-assets>` | `THREE.VideoTexture` + `ShaderMaterial` |
