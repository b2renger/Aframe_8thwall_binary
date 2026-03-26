# A-Frame + 8th Wall — WebAR Image Tracking Examples

## What is this project?

This project lets you create **Augmented Reality (AR) experiences that run directly in a phone's web browser** — no app to download, no app store involved. You print an image (or display it on a screen), point your phone's camera at it, and 3D content appears on top of it in real time.

Think of it like an interactive poster: a printed image becomes a trigger that makes 3D objects, videos, sounds, or animations appear through the phone screen.

### What tools does this project use, and why?

| Tool | What it is | Why we use it |
|------|-----------|---------------|
| **A-Frame (8frame 1.3.0)** | An open-source framework for building 3D scenes in a web page, using simple HTML tags. You write `<a-box color="red">` and a red cube appears. No 3D software needed. | It makes 3D accessible to people who know basic HTML. You describe your scene like you write a web page. |
| **8th Wall Engine** (from Niantic) | An AR engine that uses the phone camera to detect images and track their position in real time. It is the part that recognizes your printed poster and knows where to place the 3D content. | It runs directly in the browser (WebAR). Other AR tools require building a native app. This one works with just a URL. |
| **XRExtras** | A helper library from 8th Wall that provides a loading screen, error messages, and gesture detection out of the box. | Without it, you would have to code your own loading spinner, camera permission prompts, etc. It handles all of that. |

### How does it work in practice?

1. You open a URL on your phone (the page must be served over **HTTPS** — the camera will not work on plain HTTP)
2. The page asks for camera permission — you accept
3. You point the camera at the printed image target
4. The AR engine recognizes the image and places 3D content on top of it
5. You move the phone around and the 3D content stays anchored to the image

---

## Table of Contents

- [What is this project?](#what-is-this-project)
- [Examples Overview](#examples-overview)
- [Assets — What you need to print and prepare](#assets--what-you-need-to-print-and-prepare)
- [Getting Started](#getting-started)
  - [Step 1: Fork the repository (make your own copy)](#step-1-fork-the-repository-make-your-own-copy)
  - [Step 2: Choose your working environment](#step-2-choose-your-working-environment)
    - [Option A: Firebase Studio (easiest, works in the browser)](#option-a-firebase-studio-easiest-works-in-the-browser)
    - [Option B: VS Code on your computer with Live Server](#option-b-vs-code-on-your-computer-with-live-server)
  - [Step 3: Test on your phone](#step-3-test-on-your-phone)
  - [Step 4: Publish to GitHub Pages (make it public)](#step-4-publish-to-github-pages-make-it-public)
- [Raw Three.js Examples](#raw-threejs-examples)
- [How to Modify the Examples](#how-to-modify-the-examples)
  - [Understanding the HTML structure](#understanding-the-html-structure)
  - [Changing the image target](#changing-the-image-target)
  - [Changing the 3D content](#changing-the-3d-content)
  - [Adding your own assets](#adding-your-own-assets)
- [Mobile Debugging — How to see errors on your phone](#mobile-debugging--how-to-see-errors-on-your-phone)
  - [Android + Chrome (USB)](#android--chrome-usb)
  - [iOS + Safari (USB + Mac)](#ios--safari-usb--mac)
  - [iOS + Chrome](#ios--chrome)
  - [Any phone, any browser, no cable (eruda)](#any-phone-any-browser-no-cable-eruda)
- [Project Structure](#project-structure)
- [License and Credits](#license-and-credits)

---

## Examples Overview

Each example is a single HTML file that demonstrates one technique. They go from simple to advanced. You can open them, read the code, modify it, and see the result on your phone.

| # | Example | What you will see | What it teaches you | What you need |
|---|---------|-------------------|---------------------|---------------|
| 01 | [Primitives](examples/01_primitives.html) | Six colored 3D shapes (cube, sphere, cylinder, cone, torus, ring) floating above the image, each with a different animation | How to place basic 3D shapes, set colors, positions, and add simple animations using HTML attributes | Just print the image target |
| 02 | [Text MSDF](examples/02_text_msdf.html) | Text rendered in 4 different fonts floating in AR | How to display text in AR with custom fonts (Roboto, Creepster, Berkshire Swash, Crimson Text) | Just print the image target |
| 03 | [Images](examples/03_images.html) | A 2D image displayed on a floating plane above the target, shown with 3 different methods | How to show flat images in AR: as an `a-image`, as a textured plane, and as a tiled/repeated texture | Print the image target + the file `export1.png` is included |
| 04 | [3D Models](examples/04_3d_models.html) | A plant and an animated character appear above the image | How to load 3D model files (`.glb` format, exported from Blender or similar) and play their built-in animations | Print the image target. Models `plant_modelling.glb` and `satanim3.glb` are included |
| 05 | [Video Chroma](examples/05_video_chroma.html) | A video plays on a floating screen with its green background removed (transparent), like a green screen effect | How to play a video in AR with chromakey (green screen removal) using a custom shader | Print the image target. Video files `mask_*.mp4` are included |
| 06 | [Audio](examples/06_audio.html) | A speaker icon appears and music starts playing when the image is detected; stops when you look away | How to trigger sound when the phone sees the image and stop it when the image is lost | Print the image target. Audio file `bass-loops-077...mp3` is included |
| 07 | [p5.js](examples/07_p5js.html) | A colorful animated pattern (generated live by code) is displayed as a texture on a 3D plane | How to use p5.js (a creative coding library popular in design schools) to generate visuals and map them onto a 3D surface in AR | Just print the image target |
| 08 | [Gaussian Splat](examples/08_gaussian_splat.html) | A photorealistic 3D scan (point cloud) appears above the image | How to display Gaussian Splat captures (a new 3D scanning technique) in AR | Print the image target. The file `splat_30000.sog` (19 MB) is included |
| 09 | [Multi Targets](examples/09_multi_targets.html) | Four different images are each recognized and display different colored shapes and labels | How to track multiple images at the same time, each triggering its own AR content | Print all 4 image targets (see below) |

---

## Raw Three.js Examples

The `examples_threejs/` folder contains the **same 9 examples rewritten with raw Three.js r178** and XR8 camera pipeline hooks — no A-Frame, no 8frame.

### Why a second set?

The A-Frame examples use 8frame 1.3.0 which bundles Three.js r137. Modern libraries like [Spark.js](https://sparkjs.dev/) (Gaussian Splatting) require Three.js r178+. We tried several workarounds:

- Polyfilling missing Three.js APIs — fixes JS renames but cannot patch shader compilation
- Loading two Three.js versions side by side — the r137 renderer crashes on r178 materials (`material.onBuild is not a function`)
- Switching to standard A-Frame 1.7.0 — bundles r173, still too old

The solution: bypass A-Frame entirely and use Three.js r178 directly with XR8's pipeline API.

### Architecture

All examples share a common bootstrap module (`examples_threejs/lib/xr8-three-bootstrap.js`) that handles:
- Three.js renderer setup (sharing XR8's GL context)
- Camera feed background via `XR8.GlTextureRenderer`
- Image target events (`xrimagefound`, `xrimageupdated`, `xrimagelost`)
- Loading overlay and default lighting

Each example is an ES module that imports `three` from [esm.sh](https://esm.sh) via an import map:

```html
<script type="importmap">
{ "imports": { "three": "https://esm.sh/three@0.178.0" } }
</script>
```

### Three.js examples list

| # | Example | Key library | Difference from A-Frame version |
|---|---------|-------------|-------------------------------|
| 01 | [Primitives](examples_threejs/01_primitives.html) | Three.js core | Manual geometry/material, render-loop animations |
| 02 | [Text & Fonts](examples_threejs/02_text_msdf.html) | [troika-three-text](https://github.com/protectwise/troika/tree/main/packages/troika-three-text) | SDF text from .woff2 fonts (no MSDF JSON atlas needed) |
| 03 | [Images](examples_threejs/03_images.html) | Three.js TextureLoader | PlaneGeometry + MeshBasicMaterial |
| 04 | [3D Models](examples_threejs/04_3d_models.html) | GLTFLoader + AnimationMixer | Standard Three.js pattern (replaces aframe-extras) |
| 05 | [Video Chroma](examples_threejs/05_video_chroma.html) | VideoTexture + ShaderMaterial | Same GLSL shader, direct ShaderMaterial instead of registerShader |
| 06 | [Audio](examples_threejs/06_audio.html) | Web Audio API | Same `new Audio()`, tracking callbacks from bootstrap |
| 07 | [p5.js](examples_threejs/07_p5js.html) | p5.js + CanvasTexture | Identical p5 sketch, texture update in render loop |
| 08 | [**Gaussian Splat**](examples_threejs/08_gaussian_splat.html) | **Spark.js (SplatMesh)** | **Works natively** — loads `.sog` files directly, no polyfills |
| 09 | [Multi Targets](examples_threejs/09_multi_targets.html) | Map-based group routing | One THREE.Group per target, callbacks route by name |

---

## Assets — What you need to print and prepare

### Image targets (print these)

These are the images the phone camera will recognize. **You must print them on paper** (A4 works well) or display them on another screen (tablet, second monitor). The AR will not work without them.

| Image file | Dimensions | Used in | What it looks like |
|-----------|------------|---------|-------------------|
| `assets/Target_1000055040bw-resize-640x480.jpg` | 480 x 640 px | Examples 01 to 08 | Black and white geometric pattern |
| `assets/Target_cat_640.jpg` | 480 x 640 px | Example 09 | Photo of a cat |
| `assets/Target_snowflakes_640.jpg` | 478 x 640 px | Example 09 | Snowflake design |
| `assets/Target_dragongly_640_640.jpg` | 640 x 640 px | Example 09 | Photo of a dragonfly |

> **Tip:** For best results, print images at a decent size (at least 10 cm wide) with good contrast. Avoid glossy paper that creates reflections. Make sure the image is flat and well-lit.

### 3D Models

| File | Size | Description |
|------|------|-------------|
| `assets/plant_modelling.glb` | 259 KB | A static plant. GLB is a standard 3D file format you can export from Blender, Sketchfab, etc. |
| `assets/satanim3.glb` | 1.4 MB | An animated character with built-in skeletal animation |

### Audio

| File | Size | Description |
|------|------|-------------|
| `assets/bass-loops-077-with-drums-long-loop-120-bpm.mp3` | 189 KB | A looping bass music track (MP3 format — lighter, use this one) |
| `assets/bass-loops-077-with-drums-long-loop-120-bpm.wav` | 2.1 MB | Same track in WAV format (heavier, better quality) |

### Video

| File | Size | Description |
|------|------|-------------|
| `assets/mask_green_sil.mp4` | 603 KB | A silhouette filmed on a green background — the green is removed in AR |
| `assets/mask_green_back.mp4` | 818 KB | Same subject, green background variant |
| `assets/mask_blue_back.mp4` / `mask_blue_sil.mp4` | ~550 KB each | Blue background variants |
| `assets/mask_red_back.mp4` / `mask_red_sil.mp4` | ~550 KB each | Red background variants |
| `assets/mask_white_back.mp4` | 460 KB | White background variant |
| `assets/mask.mp4` | 2.8 MB | Full background version |
| `assets/video.mp4` | 370 KB | Generic video |

### Other

| File | Size | Description |
|------|------|-------------|
| `assets/export1.png` | 27 KB | A sample image used in Example 03 |
| `assets/splat_30000.sog` | 19 MB | A 3D Gaussian Splat capture (30,000 points). This is a new photogrammetry format for photorealistic 3D scans |

---

## Getting Started

### Step 1: Fork the repository (make your own copy)

A "fork" creates your own copy of this project on your GitHub account. You can then modify it freely without affecting the original.

1. **Create a GitHub account** if you don't have one: go to [github.com](https://github.com) and sign up (it's free)
2. Go to the original repository page on GitHub
3. Click the **Fork** button in the top-right corner
4. GitHub creates a copy under your account. You now have your own version at `https://github.com/<your-username>/Aframe_8thwall_binary`

### Step 2: Choose your working environment

You have two options :
- **Option A (Firebase Studio)** is the easiest — everything runs in the browser, no software to install. 
- **Option B (VS Code)** gives you more control and works offline.

---

#### Option A: Firebase Studio (easiest, works in the browser)

Firebase Studio (formerly called Project IDX) is a free online code editor from Google. It runs VS Code in your browser with a built-in web server and preview — no installation needed.

1. Open [Firebase Studio](https://idx.google.com/) in your browser
2. Click **Import a repo**
3. Paste the URL of **your fork**: `https://github.com/<your-username>/Aframe_8thwall_binary`
4. Click **Import**
5. Wait for the environment to load (this takes 1-2 minutes the first time). Firebase Studio will automatically install Node.js and Python based on the included configuration file (`.idx/dev.nix`)
6. Once loaded, you will see VS Code in your browser with the project files on the left
7. A **web preview** panel should appear automatically. If it doesn't, look for the "Preview" button in the bottom toolbar, or press `Ctrl+Shift+P` and type "IDX: Show Web Preview"
8. In the preview panel, you should see the landing page with 9 cards — one per example
9. Click on any example card to open it. **Note:** The preview runs inside the Firebase Studio frame, so camera access may not work directly in the preview. To test on your phone, see Step 3 below.

**To edit an example:**
- Open any file in `examples/` from the file tree on the left (for example, `examples/01_primitives.html`)
- Make a copy of this file and change its name.
- Make a change (for example, change `color="#FF0055"` to `color="blue"`)
- Save the file (`Ctrl+S`)
- Refresh the preview panel to see the change

If you want your experience to work when you load the page you need to rename the modified example to "index.html" this file is the one that load automatically (rename the file with the cards and all the examples into something like 'landingpage.html').

**To push your changes back to GitHub:**
- Click the Source Control icon in the left sidebar (the branch icon)
- You will see your changed files listed
- Type a short message describing what you changed (for example: "Changed cube color to blue")
- Add the files you changed 
- Click **Commit & Push** 

---

#### Option B: VS Code on your computer with Live Server

This option requires installing software on your machine, but gives you full control and works offline.

**1. Install the required software:**

- **VS Code**: Download from [code.visualstudio.com](https://code.visualstudio.com/) and install it
- **Git**: Download from [git-scm.com](https://git-scm.com/) and install it (keep all default options during installation)

**2. Clone (download) your fork:**

Open a terminal (on Windows: press `Win+R`, type `cmd`, press Enter) and run:

```bash
git clone https://github.com/<your-username>/Aframe_8thwall_binary.git
```

Replace `<your-username>` with your actual GitHub username. This downloads all the files to a folder called `Aframe_8thwall_binary` on your computer.

**3. Open the project in VS Code:**

```bash
cd Aframe_8thwall_binary
code .
```

Or: open VS Code, then go to **File > Open Folder** and select the `Aframe_8thwall_binary` folder.

**4. Install the Live Server extension:**

Live Server is a VS Code extension that runs a local web server so you can preview your pages in a browser.

1. In VS Code, click the **Extensions** icon in the left sidebar (or press `Ctrl+Shift+X`)
2. In the search bar, type **Live Server**
3. Find **Live Server** by **Ritwick Dey** (it should be the first result, with millions of downloads)
4. Click **Install**

**5. Set up HTTPS (required for camera access on phones):**

AR needs camera access, and browsers only allow camera access on secure (HTTPS) pages. Live Server runs on HTTP by default. You need to create a security certificate and configure Live Server to use it.


Open **Git Bash** (installed with Git for Windows, or the default terminal on macOS/Linux), navigate to your project folder, and run:

```bash
cd /path/to/Aframe_8thwall_binary

# Generate a self-signed certificate (valid for 365 days)
MSYS_NO_PATHCONV=1 openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
```

> **Windows note:** The `MSYS_NO_PATHCONV=1` prefix is required on Windows. Without it, Git Bash converts `/CN=localhost` into a Windows-style path (e.g., `C:/msys64/CN=localhost`) and the command silently fails. On macOS/Linux it is harmless and can be omitted.

**6. Configure Live Server to use HTTPS:**

1. In VS Code, press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type **Preferences: Open Settings (JSON)** and select it
3. Add the following lines inside the curly braces `{}` (if there are already settings, add a comma after the last one and paste these below):

```json
"liveServer.settings.https": {
    "enable": true,
    "cert": "./cert.pem",
    "key": "./key.pem",
    "passphrase": ""
},
"liveServer.settings.host": "0.0.0.0",
"liveServer.settings.port": 5501
```

> `"host": "0.0.0.0"` means the server is accessible from other devices on your Wi-Fi network (your phone). `"port": 5501` is the port number you will use in the URL.

> **Important:** The `./cert.pem` and `./key.pem` paths are **relative to the workspace folder you open in VS Code**. You must open the `Aframe_8thwall_binary` folder directly (File > Open Folder) — not a parent folder — so that Live Server can find the certificate files at the root. If Live Server fails to start, this is the most common cause.

**7. Start Live Server:**

1. In VS Code, right-click on `index.html` in the file explorer
2. Click **Open with Live Server**
3. Your default browser should open with the page. You may see a security warning because the certificate is self-signed — click **Advanced** then **Proceed** (this is normal and safe for local development)

---

### Step 3: Test on your phone

Your phone and your computer must be on the **same Wi-Fi network**.

**1. Find your computer's local IP address:**

- **Windows**: Open a Command Prompt and type `ipconfig`. Look for the line that says **IPv4 Address** under your Wi-Fi adapter (it looks like `192.168.1.42`)
- **macOS**: Open Terminal and type `ifconfig | grep "inet "`. Look for the address that starts with `192.168.` or `10.`
- **Firebase Studio**: Your preview URL is already accessible from any device — look for the URL in the preview panel (it looks like `https://xxxx.idx.dev`)

**2. Open the URL on your phone:**

- If using **VS Code + Live Server**: open your phone's browser and go to `https://192.168.x.x:5501` (replace with your actual IP)
  - Your phone will show a security warning (because of the self-signed certificate). Tap **Advanced** > **Proceed anyway** (on Chrome) or **Continue** (on Safari)
- If using **Firebase Studio**: open the preview URL directly on your phone

**3. Try an example:**

1. You should see the landing page with 9 example cards
2. Tap on any example (start with **01 — Primitives**)
3. The page will ask for camera permission — tap **Allow**
4. Point your camera at the printed image target
5. 3D content should appear on the image!

> **Troubleshooting:** If nothing appears, make sure:
> - The image target is printed clearly, well-lit, and lying flat
> - You are using the correct image (Examples 01-08 use the black-and-white geometric pattern; Example 09 uses the four different images)
> - The page is loaded over HTTPS (check the URL starts with `https://`)
> - You gave camera permission when prompted

---

### Step 4: Publish to GitHub Pages (make it public)

GitHub Pages is a free hosting service from GitHub. It gives you a public HTTPS URL that anyone can open on their phone.

1. First, make sure your changes are pushed to GitHub:
   - In VS Code: open the terminal (`Ctrl+``) and run:
     ```bash
     git add .
     git commit -m "My changes"
     git push
     ```
   - In Firebase Studio: use the Source Control panel (see Option A above)

2. Go to your fork on GitHub: `https://github.com/<your-username>/Aframe_8thwall_binary`

3. Click **Settings** (the gear icon in the top menu bar — not the gear in the About section)

4. In the left sidebar, click **Pages**

5. Under **Source**, select **Deploy from a branch**

6. Under **Branch**, select **main** and leave the folder as **/ (root)**

7. Click **Save**

8. Wait 2-3 minutes. GitHub will build and deploy your site.

9. Refresh the Settings > Pages page. A green banner will appear with your URL:
   ```
   https://<your-username>.github.io/Aframe_8thwall_binary/
   ```

10. Open this URL on your phone. You can share it with anyone — they just scan the QR code or type the URL.

---

## How to Modify the Examples

### Understanding the HTML structure

Every example is a single `.html` file that follows the same pattern. Here is what each part does:

```html
<!DOCTYPE html>
<html>
<head>
  <!-- PART 1: Load the libraries -->
  <!-- 8frame = A-Frame (the 3D framework). Loaded from 8th Wall's CDN. -->
  <script src="https://cdn.8thwall.com/web/aframe/8frame-1.3.0.min.js"></script>
  <!-- XRExtras = loading screen, camera prompts, error messages -->
  <script src="https://cdn.8thwall.com/web/xrextras/xrextras.js"></script>
  <!-- The AR engine itself (self-hosted in the engine/ folder) -->
  <script async src="../engine/xr.js" data-preload-chunks="slam"></script>

  <!-- PART 2: Tell the engine which image to look for -->
  <script>
    const onxrloaded = () => {
      XR8.XrController.configure({
        imageTargetData: [{
          "name": "my-poster",          // A name you choose (must match below)
          "type": "PLANAR",             // The image is flat (a poster/print)
          "imagePath": "../assets/Target_1000055040bw-resize-640x480.jpg",
          "properties": {
            "left": 0, "top": 0,
            "width": 480, "height": 640,         // Image dimensions in pixels
            "originalWidth": 480, "originalHeight": 640,
            "isRotated": false
          }
        }]
      });
    };
    window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded);
  </script>
</head>
<body>
  <!-- PART 3: The 3D scene -->
  <a-scene
    xrextras-gesture-detector
    xrextras-almost-there
    xrextras-loading
    xrextras-runtime-error
    xrweb="disableWorldTracking: true">

    <!-- Camera (required, do not remove) -->
    <a-camera position="0 4 10"></a-camera>

    <!-- PART 4: Your AR content — everything inside this tag appears
         on top of the detected image. The "name" must match the
         name you chose in PART 2 above. -->
    <xrextras-named-image-target name="my-poster">

      <!-- This is where you put your 3D objects -->
      <a-box color="red" position="0 0.5 0"></a-box>

    </xrextras-named-image-target>

  </a-scene>
</body>
</html>
```

### Changing the image target

To use your own image instead of the included ones:

1. **Choose a good image:** High contrast, lots of detail, not symmetric, not repetitive patterns. Photos, illustrations, and posters work well. Plain text or simple logos do not.
2. **Place your image file** in the `assets/` folder (for example, `assets/my-image.jpg`)
3. **Update the configuration** in the `<script>` block. Change `imagePath` to point to your file, and update `width` and `height` to match your image dimensions in pixels:

```javascript
imageTargetData: [{
  "name": "my-poster",
  "type": "PLANAR",
  "imagePath": "../assets/my-image.jpg",    // <-- your image file
  "properties": {
    "left": 0, "top": 0,
    "width": 800, "height": 600,            // <-- your image dimensions
    "originalWidth": 800, "originalHeight": 600,
    "isRotated": false
  }
}]
```

**Understanding the properties:**

| Property | Description |
|---|---|
| `left`, `top` | Pixel offset of the target region within the source image. If you are using a standalone image (not a sprite sheet), keep both at **0**. These only matter when several targets are packed into a single atlas image — `left` and `top` then indicate where the sub-image starts. |
| `width`, `height` | The pixel dimensions of the region the tracker should use. For a standalone image this is simply the image's pixel width and height. The **aspect ratio** (`width / height`) is critical: the engine uses it to know the shape of the target so it can compute the correct 3D pose. If these don't match the real image, tracking will be jittery or fail. |
| `originalWidth`, `originalHeight` | The full pixel dimensions of the source file. For a standalone image, set them **equal to `width` and `height`**. When targets are packed in a sprite sheet, these describe the total atlas size so the engine can locate the sub-region defined by `left`, `top`, `width`, `height`. |
| `isRotated` | Sprite-sheet flag. Set to `false` unless your atlas tool rotated the sub-image 90° to save space. |

> **In practice**, for a single image target you only need to set `width` and `height` to your image's pixel dimensions and copy them into `originalWidth` / `originalHeight`. Keep `left` and `top` at 0 and `isRotated` at false.

**Preparing your image — resolution, color, and performance:**

- **Recommended resolution: 480–1024 px on the longest side.** The tracking engine downscales the image internally to extract feature points — it does not benefit from resolutions above ~1024 px. A 640×480 image tracks just as reliably as a 4K one.
- **Do NOT use a 4K image as-is.** A 3840×2160 image weighs several MB. The engine must download it, decode it into a full-resolution bitmap in memory, and then downsample it before feature extraction. On a phone this means:
  - **Longer startup** — the image must be fetched and decoded before tracking can begin.
  - **Higher memory spike** — a 4K RGBA bitmap uses ~32 MB of RAM just for the decode step, which can cause frame drops or even a crash on low-end devices.
  - **No tracking improvement** — the internal feature detector works at a fixed lower resolution regardless of input size. Extra pixels are thrown away.
  - Resize beforehand to ~768 px on the longest side for the best balance of quality and performance.
- **Keep the image in color (RGB).** The engine converts the image to grayscale internally for feature detection, but you should NOT pre-convert it to black and white yourself. Supplying a color image preserves more tonal information during the engine's own conversion pipeline. Manually converting to B&W can flatten details (e.g., two colors with different hues but similar brightness become the same gray), reducing the number of usable feature points and hurting tracking quality.
- **Use JPEG for photos, PNG for graphics.** JPEG at 80–90% quality keeps file size small with negligible tracking impact. Use PNG only for images with sharp edges or transparency. Avoid uncompressed formats (BMP, TIFF).
- **Aspect ratio matters more than resolution.** Make sure `width` and `height` in the configuration match the actual pixel dimensions of the file you provide. A mismatch causes the engine to compute an incorrect 3D pose, leading to jittery or offset AR content — even if the image is otherwise perfect for tracking.

4. **Print your image** and test with your phone

### Changing the 3D content

Edit the content inside the `<xrextras-named-image-target>` tag. The coordinate system works like this:

- **X axis** = left/right (positive = right)
- **Y axis** = up/down (positive = up, away from the paper surface)
- **Z axis** = forward/back (positive = towards you)
- **Origin (0, 0, 0)** = the center of the detected image

Some examples of things you can add:

```html
<!-- A red cube, half a unit above the image -->
<a-box color="red" position="0 0.5 0"></a-box>

<!-- A blue sphere with a bounce animation -->
<a-sphere color="blue" position="0 1 0" radius="0.3"
          animation="property: position; to: 0 2 0; dir: alternate;
                     loop: true; dur: 1000"></a-sphere>

<!-- A text label -->
<a-text value="Hello AR!" color="white" position="0 1.5 0"
        align="center" width="4"></a-text>

<!-- A flat image -->
<a-image src="../assets/my-photo.jpg" position="0 1 0"
         width="2" height="1.5"></a-image>
```

See the [A-Frame documentation](https://aframe.io/docs/) for the full list of shapes, materials, animations, and components you can use.

### Adding your own assets

1. Put your files (images, 3D models, videos, audio) in the `assets/` folder
2. If they need to be preloaded (videos, 3D models, audio), declare them in the `<a-assets>` section:

```html
<a-assets>
  <video id="my-video" src="../assets/my-video.mp4" loop muted playsinline crossorigin="anonymous"></video>
  <a-asset-item id="my-model" src="../assets/my-model.glb"></a-asset-item>
  <img id="my-image" src="../assets/my-photo.jpg" crossorigin="anonymous">
  <audio id="my-audio" src="../assets/my-sound.mp3" loop></audio>
</a-assets>
```

3. Then reference them by their `id` using the `#` prefix:

```html
<a-entity gltf-model="#my-model" position="0 0.5 0"></a-entity>
```

---

## Mobile Debugging — How to see errors on your phone

When something goes wrong on your phone (blank screen, content not appearing, errors), you need to see the browser's **console** — the place where error messages appear. On a computer you open it with `F12`, but on a phone it is hidden. Here is how to access it.

### Android + Chrome (USB)

This lets you see your phone's Chrome console on your computer screen.

**On your Android phone:**

1. Open **Settings**
2. Scroll down to **About phone** and tap it
3. Find **Build number** and tap it **7 times** in a row. You will see a message saying "You are now a developer!"
4. Go back to **Settings** > **System** > **Developer options** (this menu appeared after step 3)
5. Enable **USB debugging**

**Connect and inspect:**

1. Plug your phone into your computer with a USB cable
2. On your phone, a popup will ask "Allow USB debugging?" — tap **Allow**
3. On your computer, open Chrome and type this in the address bar: `chrome://inspect/#devices`
4. Wait a few seconds. Your phone will appear in the list, along with all open Chrome tabs
5. Find the tab with your AR page and click **inspect**
6. A full DevTools window opens — you can see the Console (error messages), Network (loaded files), Elements (HTML), and more

### iOS + Safari (USB + Mac)

This requires a Mac. It lets you see your iPhone's Safari console on your Mac screen.

**On your iPhone:**

1. Open **Settings**
2. Scroll down and tap **Safari**
3. Scroll down and tap **Advanced**
4. Enable **Web Inspector**

**On your Mac:**

1. Open **Safari**
2. In the menu bar, click **Safari > Settings** (or **Preferences**)
3. Go to the **Advanced** tab
4. Check **Show Develop menu in menu bar**

**Connect and inspect:**

1. Plug your iPhone into your Mac with a USB cable (Lightning or USB-C)
2. On your iPhone, if prompted, tap **Trust** this computer
3. On your Mac, in Safari's menu bar, click **Develop**
4. You will see your iPhone's name in the dropdown
5. Hover over it to see all open Safari tabs
6. Click on the page you want to inspect
7. A Web Inspector window opens with full console, network, and element inspection



### Any phone, any browser, no cable (eruda)

If you don't have a USB cable, don't have a Mac (for iOS), or need to debug a browser that doesn't support remote inspection, you can inject a **floating console directly into the page**.

**eruda** is a small JavaScript library that adds a developer tools panel on top of your page, right on your phone screen.

Add these two lines **just before the closing `</body>` tag** in any example file:

```html
<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script>eruda.init()</script>
```

For example, in `01_primitives.html`, it would look like:

```html
    </xrextras-named-image-target>

  </a-scene>

  <!-- Add these two lines for on-device debugging -->
  <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
  <script>eruda.init()</script>
</body>
</html>
```

When you reload the page on your phone, a small **gear icon** will appear in the bottom-right corner. Tap it to open a console panel where you can see errors, network requests, and more — all directly on your phone screen.

> **Remember to remove these two lines before publishing your final version** — you don't want your users to see the debug panel.

---

## Project Structure

```
Aframe_8thwall_binary/
│
├── index.html                 The landing page — a gallery with links to all 9 examples
├── README.md                  This documentation
│
├── examples/                  A-Frame examples (8frame 1.3.0 + Three.js r137)
│   ├── 01_primitives.html         Basic 3D shapes with animations
│   ├── 02_text_msdf.html          Text with custom fonts
│   ├── 03_images.html             Flat images displayed in AR
│   ├── 04_3d_models.html          3D model files with animation
│   ├── 05_video_chroma.html       Video with green screen removal
│   ├── 06_audio.html              Sound triggered by image detection
│   ├── 07_p5js.html               p5.js generative graphics as AR texture
│   ├── 08_gaussian_splat.html     Photorealistic 3D scan rendering
│   └── 09_multi_targets.html      Multiple images tracked at once
│
├── examples_threejs/          Raw Three.js examples (r178 + XR8 pipeline hooks)
│   ├── lib/
│   │   └── xr8-three-bootstrap.js Shared XR8 + Three.js setup module
│   ├── 01–09_*.html               Same examples, no A-Frame dependency
│   └── 08_gaussian_splat.html     Spark.js works natively with r178
│
├── engine/                    The AR engine (do not modify these files)
│   ├── xr.js                     Main engine file
│   ├── xr-slam.js                SLAM (camera tracking) module
│   ├── xr-face.js                Face detection module (not used in these examples)
│   ├── LICENSE                    Niantic Spatial license terms
│   └── resources/                Machine learning models and worker scripts
│
├── assets/                    All media files (images, models, audio, video)
│   ├── Target_*.jpg               Image targets — print these for AR detection
│   ├── *.glb                      3D model files
│   ├── *.mp3, *.wav               Audio files
│   ├── mask_*.mp4                 Chromakey video files
│   ├── export1.png                Sample image
│   └── splat_30000.sog            Gaussian splat 3D scan data
│
├── agents/                    Notes and plans (for reference only)
│   ├── plan.md                    Implementation plan
│   └── research.md                Technical research on A-Frame + 8th Wall
│
└── .idx/
    └── dev.nix                Configuration for Firebase Studio environment
```

---

## License and Credits

- **XR Engine**: The files in `engine/` are provided under the [Niantic Spatial XR Engine License](engine/LICENSE). Free for non-commercial XR experimentation. Cannot be modified or resold. See the license file for full terms.
- **Audio**: Bass loop sample by josefpres on [Freesound.org](https://freesound.org/) (CC0 — free to use).
- **A-Frame / 8frame**: MIT License (open source, free to use and modify).
