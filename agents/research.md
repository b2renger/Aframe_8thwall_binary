# A-Frame + 8th Wall Binary: Comprehensive Research

This document covers the technical foundations for building WebAR experiences with A-Frame and the 8th Wall distributed engine binary, specifically for image tracking workflows.

---

## 1. Architecture Overview

### What is 8frame?
8frame is 8th Wall's fork of A-Frame 1.3.0, optimized for compatibility with the 8th Wall XR engine. It is loaded from:
```
https://cdn.8thwall.com/web/aframe/8frame-1.3.0.min.js
```
It provides the same API as standard A-Frame (Entity-Component-System architecture, built on THREE.js) but includes patches for 8th Wall's rendering pipeline.

### The 8th Wall Distributed Engine Binary
Instead of using 8th Wall's cloud platform, this project uses the self-hosted engine binary:
- **xr.js** (~1.3 MB) — Core XR controller, camera pipeline, image target detection
- **xr-slam.js** (~5.4 MB) — SLAM (Simultaneous Localization and Mapping) module for spatial tracking
- **xr-face.js** (~7.4 MB) — Face detection and mesh tracking module
- **resources/** — Media workers, ML models (TensorFlow Lite), and branding assets

The engine is loaded asynchronously with SLAM pre-loading:
```html
<script async src="./engine/xr.js" data-preload-chunks="slam"></script>
```

### XRExtras Library
Loaded from CDN, provides UI components:
```
https://cdn.8thwall.com/web/xrextras/xrextras.js
```
Components:
- `xrextras-loading` — Loading screen while engine initializes
- `xrextras-almost-there` — Prompt for unsupported browsers
- `xrextras-runtime-error` — Error display overlay
- `xrextras-gesture-detector` — Touch gesture recognition (pinch, rotate)
- `xrextras-named-image-target` — Wrapper that shows/hides children based on image detection

---

## 2. Image Tracking Workflow

### Configuration
Image targets are configured after the XR engine loads using `XR8.XrController.configure()`:

```javascript
const onxrloaded = () => {
  XR8.XrController.configure({
    imageTargetData: [{
      "name": "my-poster",           // Unique identifier for this target
      "type": "PLANAR",              // PLANAR (flat) or CYLINDRICAL or CONICAL
      "imagePath": "./assets/image.jpg",
      "properties": {
        "left": 0, "top": 0,
        "width": 480, "height": 640,
        "originalWidth": 480, "originalHeight": 640,
        "isRotated": false
      }
    }]
  });
};
// Wait for engine to be ready
window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded);
```

### Scene Configuration
```html
<a-scene
  xrextras-gesture-detector
  xrextras-almost-there
  xrextras-loading
  xrextras-runtime-error
  xrweb="disableWorldTracking: true">
```
- `xrweb="disableWorldTracking: true"` — Disables full world tracking to save battery when only image tracking is needed.

---

## 3. `xrextras-named-image-target` Component

This is the key component for placing AR content on a tracked image:

```html
<xrextras-named-image-target name="my-poster">
  <!-- Child entities appear when image is detected -->
  <a-box color="red" position="0 0.5 0"></a-box>
</xrextras-named-image-target>
```

**Behavior:**
- Listens for `xrimagefound`, `xrimageupdated`, and `xrimagelost` events
- Automatically shows/hides all child entities based on detection state
- Synchronizes position, rotation, and scale from the tracked image's pose
- The `name` attribute must match the `name` in `imageTargetData`

**Coordinate System:**
- Origin (0, 0, 0) = center of the tracked image
- Y-axis = perpendicular to the image surface (pointing "up" / away from the image)
- X-axis = horizontal across the image
- Z-axis = vertical along the image
- 1 unit ~ the physical width of the image target

---

## 4. 8th Wall Events API

Events are dispatched on the `<a-scene>` element:

### `xrimagefound`
Fired when an image target is first detected.
```javascript
scene.addEventListener('xrimagefound', (event) => {
  console.log('Found:', event.detail.name);
  // event.detail: { name, position, rotation, scale }
});
```

### `xrimageupdated`
Fired continuously while tracking the image target (every frame).
```javascript
scene.addEventListener('xrimageupdated', (event) => {
  // Update content position/orientation
});
```

### `xrimagelost`
Fired when the image target leaves the camera view.
```javascript
scene.addEventListener('xrimagelost', (event) => {
  console.log('Lost:', event.detail.name);
});
```

### `xrimagescanning`
Fired during active scanning (before any target is found).

---

## 5. A-Frame Primitives and Entities

### Core Primitives
| Primitive | Description | Key Attributes |
|-----------|-------------|----------------|
| `<a-box>` | Cube/cuboid | width, height, depth |
| `<a-sphere>` | Sphere | radius |
| `<a-cylinder>` | Cylinder | radius, height |
| `<a-cone>` | Cone | radius-bottom, radius-top, height |
| `<a-torus>` | Torus (donut) | radius, radius-tubular |
| `<a-ring>` | Flat ring | radius-inner, radius-outer |
| `<a-plane>` | Flat rectangle | width, height |
| `<a-image>` | Plane with image texture | src, width, height |
| `<a-text>` | 3D text | value, color, align, width |

### Common Attributes
- `position="x y z"` — Position in 3D space
- `rotation="x y z"` — Rotation in degrees
- `scale="x y z"` — Scale multiplier
- `color="#hex"` — Material color
- `opacity="0-1"` — Transparency

### Animation Component
Built-in animation support:
```html
<a-box animation="property: rotation;
                  to: 0 360 0;
                  loop: true;
                  dur: 3000;
                  easing: linear"></a-box>
```
- `property` — The attribute to animate
- `to` / `from` — Target / start values
- `dur` — Duration in milliseconds
- `loop` — `true` for infinite, or a number
- `dir` — `alternate` for ping-pong animation
- `easing` — Easing function (linear, easeInQuad, easeOutElastic, etc.)

---

## 6. Text Rendering and MSDF Fonts

### Default Text (SDF)
A-Frame's built-in `<a-text>` uses the Roboto font rendered with Signed Distance Fields:
```html
<a-text value="Hello World" color="white" align="center" position="0 1 0"></a-text>
```

### MSDF Custom Fonts
Multi-channel Signed Distance Field fonts provide sharper rendering. Over 2000 Google Fonts are pre-converted at:
```
https://raw.githubusercontent.com/etiennepinchon/aframe-fonts/master/fonts/[folder]/[File].json
```

**Usage (must use `shader: msdf`):**
```html
<a-entity text="value: Custom Font;
                shader: msdf;
                font: https://raw.githubusercontent.com/etiennepinchon/aframe-fonts/master/fonts/creepster/Creepster-Regular.json;
                color: #FF0055;
                align: center;
                width: 4"
          position="0 1 0"></a-entity>
```

**Important notes:**
- `shader: msdf` is REQUIRED for MSDF fonts
- The `.png` atlas file is auto-loaded alongside the `.json` definition
- Use `a-entity` with the `text` component (not `a-text` primitive) for MSDF shader support
- `width` controls the text block width / apparent size

### Font Generation Tools
- **MSDF Font Generator**: https://msdf-font-generator.leomouraire.com/ — Upload any font, customize size (128-1024px), select characters, exports MSDF files
- **MSDF BMFont**: https://msdf-bmfont.donmccurdy.com/ — Alternative tool for generating MSDF bitmap font data
- **Pre-converted fonts**: https://github.com/etiennepinchon/aframe-fonts — 2000+ Google Fonts ready to use

---

## 7. Asset Management

### The `<a-assets>` System
A-Frame provides a centralized asset preloading system:
```html
<a-scene>
  <a-assets>
    <img id="my-image" src="image.jpg" crossorigin="anonymous">
    <video id="my-video" src="video.mp4" autoplay loop muted playsinline>
    <audio id="my-audio" src="audio.mp3">
    <a-asset-item id="my-model" src="model.glb"></a-asset-item>
  </a-assets>
  <!-- Reference assets by #id -->
  <a-image src="#my-image"></a-image>
</a-scene>
```

**Key points:**
- Assets are preloaded before the scene renders
- Reference by `#id` in component attributes
- `crossorigin="anonymous"` needed for CORS
- `a-asset-item` for non-media assets (3D models, etc.)
- Videos need `autoplay`, `loop`, `muted`, `playsinline` for mobile autoplay
- Default timeout: 3 seconds (configurable with `timeout` attribute)

---

## 8. 3D Models (GLB/glTF)

### Loading Models
```html
<a-assets>
  <a-asset-item id="model" src="model.glb"></a-asset-item>
</a-assets>
<a-entity gltf-model="#model" position="0 0 0" scale="0.5 0.5 0.5"></a-entity>
```

### Animation Playback with aframe-extras
The `animation-mixer` component from aframe-extras plays embedded GLB animations:
```html
<script src="https://cdn.jsdelivr.net/gh/c-frame/aframe-extras@7.6.1/dist/aframe-extras.min.js"></script>
```

```html
<a-entity gltf-model="#model"
          animation-mixer="clip: *; loop: repeat">
</a-entity>
```

**Parameters:**
- `clip: *` — Play all animations (or specify a clip name)
- `loop: repeat` — Loop continuously (`once`, `repeat`, `pingpong`)
- `duration` — Override animation duration
- `clampWhenFinished` — Hold last frame when done
- `crossFadeDuration` — Blend between animations

---

## 9. Video and Chromakey Shader

### The Problem
Browser video codecs don't consistently support alpha channels:
- Safari supports HEVC with alpha
- Chrome supports VP9 with alpha
- No single codec works across all browsers

### The Solution: Chromakey Shader
A custom GLSL shader that makes a specific color (green/blue screen) transparent:

```javascript
AFRAME.registerShader('chromakey', {
  schema: {
    src: {type: 'map'},
    color: {default: {x: 0.0, y: 1.0, z: 0.0}, type: 'vec3', is: 'uniform'},
    transparent: {default: true, is: 'uniform'}
  },
  init: function (data) {
    var videoTexture = new THREE.VideoTexture(data.src);
    videoTexture.minFilter = THREE.LinearFilter;
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        color: {type: 'c', value: data.color},
        myTexture: {type: 't', value: videoTexture}
      },
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      transparent: true
    });
  },
  vertexShader: [
    'varying vec2 vUv;',
    'void main(void) {',
    '  vUv = uv;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}'
  ].join('\n'),
  fragmentShader: [
    'uniform sampler2D myTexture;',
    'uniform vec3 color;',
    'varying vec2 vUv;',
    'void main(void) {',
    '  vec3 tColor = texture2D(myTexture, vUv).rgb;',
    '  float a = (length(tColor - color) - 0.5) * 7.0;',
    '  gl_FragColor = vec4(tColor, a);',
    '}'
  ].join('\n')
});
```

**How the fragment shader works:**
1. `texture2D(myTexture, vUv).rgb` — Sample video pixel color
2. `length(tColor - color)` — Euclidean distance from the chroma key color
3. `(distance - 0.5) * 7.0` — Map to alpha: near chroma = transparent, far = opaque
4. The `0.5` offset and `7.0` multiplier control the edge hardness

**Usage:**
```html
<a-assets>
  <video id="vid" src="greenscreen.mp4" autoplay loop muted playsinline></video>
</a-assets>
<a-entity geometry="primitive: plane; width: 2; height: 1.5"
          material="shader: chromakey; src: #vid; color: 0 1 0; transparent: true">
</a-entity>
```
- `color: 0 1 0` = green (RGB normalized 0-1). Use `0 0 1` for blue screen.

---

## 10. Audio in WebAR

### Browser Autoplay Policy
Browsers block audio autoplay without user interaction. In AR, the `xrimagefound` event may not count as a "user gesture" on all browsers. Strategies:
- Start audio on first user tap, then control with image events
- Use `muted` attribute and unmute programmatically after interaction

### Custom Audio Component
```javascript
AFRAME.registerComponent('image-target-audio', {
  schema: {
    src: {type: 'string'},
    target: {type: 'string', default: 'my-poster'}
  },
  init: function () {
    this.audio = new Audio(this.data.src);
    this.audio.loop = true;
    this.onImageFound = (e) => {
      if (e.detail.name === this.data.target) {
        this.audio.play().catch(err => console.warn('Audio play blocked:', err));
      }
    };
    this.onImageLost = (e) => {
      if (e.detail.name === this.data.target) this.audio.pause();
    };
    this.el.sceneEl.addEventListener('xrimagefound', this.onImageFound);
    this.el.sceneEl.addEventListener('xrimagelost', this.onImageLost);
  },
  remove: function () {
    this.audio.pause();
    this.el.sceneEl.removeEventListener('xrimagefound', this.onImageFound);
    this.el.sceneEl.removeEventListener('xrimagelost', this.onImageLost);
  }
});
```

**Key considerations:**
- Events fire on `<a-scene>`, not on the image target entity
- Filter by `event.detail.name` to respond only to the correct target
- `.play()` returns a Promise — always catch errors
- Clean up listeners in `remove()` to prevent memory leaks

---

## 11. p5.js Integration

### Approach: Canvas as Texture
p5.js renders to an HTML canvas. We capture that canvas and use it as a THREE.js texture on a plane in the A-Frame scene.

### p5.js Instance Mode
Instance mode avoids global namespace pollution:
```javascript
new p5(function(p) {
  p.setup = function() {
    p.createCanvas(256, 256);
  };
  p.draw = function() {
    p.background(0);
    p.fill(255);
    p.ellipse(p.width/2, p.height/2, 100);
  };
});
```

### Custom A-Frame Component
```javascript
AFRAME.registerComponent('p5-texture', {
  schema: {
    width: {type: 'int', default: 256},
    height: {type: 'int', default: 256}
  },
  init: function () {
    var self = this;
    var container = document.createElement('div');
    container.style.display = 'none';
    document.body.appendChild(container);

    this.p5Instance = new p5(function(p) {
      p.setup = function() {
        var c = p.createCanvas(self.data.width, self.data.height);
        c.parent(container);
        self.p5Canvas = c.elt;
      };
      p.draw = function() {
        // Your sketch here
      };
    });
  },
  tick: function () {
    if (!this.p5Canvas) return;
    if (!this.texture) {
      this.texture = new THREE.CanvasTexture(this.p5Canvas);
      this.el.getObject3D('mesh').material.map = this.texture;
      this.el.getObject3D('mesh').material.needsUpdate = true;
    }
    this.texture.needsUpdate = true;
  },
  remove: function () {
    if (this.p5Instance) this.p5Instance.remove();
  }
});
```

**Performance notes:**
- Canvas size directly impacts performance — 256x256 is good for mobile
- `needsUpdate = true` every frame uploads pixels to GPU
- Use `material="shader: flat"` to avoid lighting affecting the texture
- p5.js v1.x recommended (v2.x has breaking changes to instance mode)

**CDN:**
```
https://cdn.jsdelivr.net/npm/p5@1.9.4/lib/p5.min.js
```

---

## 12. Gaussian Splatting with Spark.js

### What is 3D Gaussian Splatting?
A novel 3D representation where scenes are composed of millions of tiny oriented Gaussian-shaped blobs ("splats"), each with position, rotation, scale, color, and opacity. Produces photorealistic reconstructions from photographs.

### Spark.js
Spark is a dynamic 3DGS renderer for THREE.js and WebGL2. It runs in any browser and supports WebXR.

**Key features:**
- Native support for `.sog`, `.splat`, `.ply`, `.spz`, `.ksplat` file formats
- Integrates with THREE.js scene graph — SplatMesh extends THREE.Object3D
- Automatic SparkRenderer management
- GPU-accelerated depth sorting

**CDN:**
```
https://cdn.jsdelivr.net/npm/@sparkjsdev/spark
```

**NPM:**
```
npm install @sparkjsdev/spark
```

### .sog Format (Spatially Ordered Gaussians)
Open-sourced by PlayCanvas. Achieves 15-20x compression compared to raw PLY:
- Uses WebP images to store Gaussian attributes
- A 4M Gaussian scene: ~1GB (PLY) to ~42MB (SOG)
- Fast browser decoding via WebP

### A-Frame Integration
Since A-Frame is built on THREE.js, Spark integrates through a custom component:

```javascript
AFRAME.registerComponent('spark-splat', {
  schema: {
    src: {type: 'string'}
  },
  init: async function () {
    const { SplatMesh } = await import(
      'https://cdn.jsdelivr.net/npm/@sparkjsdev/spark/+esm'
    );
    this.splat = new SplatMesh({ url: this.data.src });
    this.el.object3D.add(this.splat);
  },
  remove: function () {
    if (this.splat) {
      this.el.object3D.remove(this.splat);
      this.splat.dispose();
    }
  }
});
```

**Usage:**
```html
<a-entity spark-splat="src: ./assets/scene.sog"
          position="0 0.5 0"
          scale="0.3 0.3 0.3"></a-entity>
```

**Notes:**
- Scale is critical — splat scenes are often real-world scale and need significant scaling down
- Spark auto-creates a SparkRenderer if one doesn't exist in the scene
- The dynamic import (`import()`) is needed because spark.js is an ES module
- Performance varies by device — mobile may need smaller splat files

### Creating .sog Files
- **Luma AI**: Capture with phone, export as .ply, convert to .sog
- **Polycam**: 3D scanning app with Gaussian splat export
- **PlayCanvas**: Built-in .sog export from their editor
- **COLMAP + 3DGS**: Academic pipeline for custom captures

---

## 13. Creating Custom Image Targets

### Image Requirements
- **High contrast**: Strong edges and varied textures work best
- **Unique features**: Non-repetitive patterns with many distinct visual elements
- **Good resolution**: 640x480 or larger recommended
- **Avoid**: Text-heavy images, repetitive patterns, low-contrast scenes, symmetric designs

### Configuration
Update the `imageTargetData` in your HTML:
```javascript
XR8.XrController.configure({
  imageTargetData: [{
    "name": "my-custom-target",
    "type": "PLANAR",
    "imagePath": "./assets/my-image.jpg",
    "properties": {
      "left": 0, "top": 0,
      "width": YOUR_WIDTH, "height": YOUR_HEIGHT,
      "originalWidth": YOUR_WIDTH, "originalHeight": YOUR_HEIGHT,
      "isRotated": false
    }
  }]
});
```

### Multiple Image Targets
You can track multiple images simultaneously by adding more objects to the array and creating separate `<xrextras-named-image-target>` elements for each.

---

## 14. External Resources

### Libraries & CDNs
| Library | CDN URL | Purpose |
|---------|---------|---------|
| 8frame 1.3.0 | `https://cdn.8thwall.com/web/aframe/8frame-1.3.0.min.js` | A-Frame fork for 8th Wall |
| XRExtras | `https://cdn.8thwall.com/web/xrextras/xrextras.js` | UI components (loading, errors, gestures) |
| aframe-extras | `https://cdn.jsdelivr.net/gh/c-frame/aframe-extras@7.6.1/dist/aframe-extras.min.js` | animation-mixer for GLB animations |
| p5.js | `https://cdn.jsdelivr.net/npm/p5@1.9.4/lib/p5.min.js` | Creative coding canvas library |
| Spark.js | `https://cdn.jsdelivr.net/npm/@sparkjsdev/spark` | 3D Gaussian Splatting renderer |

### Documentation
- [A-Frame Documentation](https://aframe.io/docs/)
- [8th Wall Documentation](https://www.8thwall.com/docs/)
- [Spark.js Documentation](https://sparkjs.dev/docs/overview/)
- [aframe-extras (c-frame)](https://github.com/c-frame/aframe-extras)
- [MSDF Fonts for A-Frame](https://github.com/etiennepinchon/aframe-fonts)
- [PlayCanvas SOG Format](https://developer.playcanvas.com/user-manual/gaussian-splatting/formats/sog/)

### Tools
- [MSDF Font Generator](https://msdf-font-generator.leomouraire.com/)
- [MSDF BMFont](https://msdf-bmfont.donmccurdy.com/)
- [Shutter Encoder](https://www.shutterencoder.com/) (video conversion for chromakey)
