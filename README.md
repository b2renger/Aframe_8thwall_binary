# A-Frame + 8th Wall — WebAR Examples (Image Tracking & World Effects)

## What is this project?

This project lets you create **Augmented Reality (AR) experiences that run directly in a phone's web browser** — no app to download, no app store involved.

It covers the two classic kinds of WebAR:

- **Image targets** — you print an image (or display it on a screen), point your phone at it, and 3D content appears on top of it and follows it. Think of an interactive poster.
- **World effects** — no image needed: you tap the floor on your phone screen and 3D content is placed there, as if it were in the room.

Each kind exists in two flavours: **A-Frame** (3D described with HTML tags, the easiest) and **raw Three.js** (JavaScript, more control, newer libraries). That makes 4 sets of 9 examples (plus a bonus 05b in the A-Frame image-target set).

### What tools does this project use, and why?

| Tool | What it is | Why we use it |
|------|-----------|---------------|
| **A-Frame (8frame 1.3.0)** | An open-source framework for building 3D scenes in a web page using HTML tags. You write `<a-box color="red">` and a red cube appears. 8frame is 8th Wall's build of A-Frame. | It makes 3D accessible to people who know basic HTML. |
| **Three.js (r178)** | The JavaScript 3D library A-Frame is built on. | Used directly in the `*_Threejs` folders, so we can use modern libraries (e.g. Spark.js for Gaussian splats) that need a newer Three.js than the r137 bundled in 8frame. |
| **8th Wall XR Engine** (Niantic Spatial) | The AR engine: it reads the camera, recognises image targets and tracks the phone's movement in the room. Self-hosted in `engine/`. | It runs in the browser (WebAR): no native app, just a URL. |
| **XRExtras** | 8th Wall helpers for A-Frame: loading screen, camera-permission and error screens. | Saves writing all that UI yourself (A-Frame examples only). |

### How does it work in practice?

1. You open a URL on your phone. The page **must be served over HTTPS** — browsers refuse camera access on plain HTTP (see [Step 3](#step-3-test-on-your-phone) for an easy way to get HTTPS).
2. The page asks for camera permission — you accept.
3. **Image target examples:** you point the camera at the printed image; the 3D content appears on it and stays anchored to it as you move.
   **World examples:** you move the phone a little so the engine understands the room, then tap the floor on screen; the content is placed there.

### Words you'll meet

- **HTTPS**: the secure version of a web address (`https://`). Phones only give the camera to HTTPS pages (`localhost` on your computer is the exception).
- **CDN**: a website that hosts code libraries for everyone to use. The examples load A-Frame, Three.js and fonts from CDNs, so they need an internet connection.
- **r137 / r178**: Three.js version numbers ("release 137", "release 178"). A-Frame (8frame 1.3.0) contains r137; the `*_Threejs` folders use r178.
- **SLAM**: the part of the engine that tracks the phone's movement in the room. `data-preload-chunks="slam"` downloads it early (the image-target examples load it too: it also does the image tracking).
- **MSDF font**: a font stored as a picture plus a `.json` file, so text stays sharp in 3D.
- **Shader**: a small program the graphics card runs for every pixel. The chromakey shader in example 05 makes the green pixels transparent.
- **Gaussian splat**: a photorealistic 3D scan made of millions of soft coloured dots (`.sog` or `.splat` files).
- **Import map**: the `<script type="importmap">` block at the top of each Three.js example. It tells the browser where to download `three` when the code says `import ... from 'three'`.
- **Y-up**: "the Y axis points up". `.glb` models and world effects work this way; image targets don't (there, Z points out of the paper, see [Coordinates and units](#coordinates-and-units)).
- **sRGB**: the normal colour format of images. Three.js must be told a texture is sRGB (`texture.colorSpace = THREE.SRGBColorSpace`), or it looks washed out.
- **Pipeline module**: a set of functions the AR engine calls on every camera frame. The Three.js examples use one (in their `lib/` file) to update the 3D scene.

---

## Table of Contents

- [Words you'll meet](#words-youll-meet)
- [Examples Overview](#examples-overview)
- [Which set should I start with?](#which-set-should-i-start-with)
- [Assets — What you need to print and prepare](#assets--what-you-need-to-print-and-prepare)
- [Getting Started](#getting-started)
  - [Step 1: Fork the repository](#step-1-fork-the-repository-make-your-own-copy)
  - [Step 2: Choose your working environment](#step-2-choose-your-working-environment)
  - [Step 3: Test on your phone](#step-3-test-on-your-phone)
  - [Step 4: Publish to GitHub Pages](#step-4-publish-to-github-pages-make-it-public)
- [How to Modify the Examples](#how-to-modify-the-examples)
- [Mobile Debugging — How to see errors on your phone](#mobile-debugging--how-to-see-errors-on-your-phone)
- [Project Structure](#project-structure)
- [Known limitations](#known-limitations)
- [License and Credits](#license-and-credits)

---

## Examples Overview

The landing page (`index.html`) links to every example. Each example is one HTML file demonstrating one technique, from simple to advanced (in `world_8thFrame/`, `image_target_Threejs/` and `world_Threejs/`, the examples also share a helper file in that folder's `lib/` folder). The same 9 topics exist in all 4 folders:

| Folder | Kind of AR | Technology |
|--------|-----------|------------|
| [`image_target_8thFrame/`](image_target_8thFrame/) | Image target | A-Frame (8frame 1.3.0, Three.js r137) |
| [`image_target_Threejs/`](image_target_Threejs/) | Image target | Raw Three.js r178 + `lib/xr8-three-bootstrap.js` |
| [`world_8thFrame/`](world_8thFrame/) | World effect (tap to place) | A-Frame + `lib/tap-to-place.js` |
| [`world_Threejs/`](world_Threejs/) | World effect (tap to place) | Raw Three.js r178 + `lib/xr8-three-world-bootstrap.js` |

| # | Topic | What you will see | What it teaches you |
|---|-------|-------------------|---------------------|
| 01 | Primitives | Six animated coloured shapes (cube, sphere, cylinder, cone, torus, ring) | Placing basic 3D shapes, colours, positions, simple animations |
| 02 | Text & Fonts | Text in several fonts | Text in AR: MSDF fonts (A-Frame & image-target Three.js), [troika-three-text](https://github.com/protectwise/troika/tree/main/packages/troika-three-text) (world Three.js) |
| 03 | Images | The same picture on three stacked planes | Showing flat images in AR |
| 04 | 3D Models | A plant and an animated character | Loading `.glb` files (from Blender, Sketchfab…) and playing their animations |
| 05 | Video Chroma (green screen) | A video with its green background removed | Video in AR with a chromakey (green-screen) shader |
| 05b | Video Chroma + Audio | Same as 05 with music (image target A-Frame only) | Combining video and sound on one target |
| 06 | Audio | A speaker icon and music | Starting/stopping sound when the image is found/lost (or when content is placed) |
| 07 | p5.js | An animated pattern drawn live by a p5.js sketch on a 3D plane | Using p5.js (creative coding) as a live texture |
| 08 | Gaussian Splat | A photorealistic 3D scan | Displaying Gaussian Splat captures in AR |
| 09 | Multi Targets / Multi Placement | Image: 7 different images each trigger their own content. World: each tap places the next object | Tracking several images at once / placing several objects |

---

## Which set should I start with?

- **New to code?** Start with `image_target_8thFrame/` — everything is HTML tags. Then try `world_8thFrame/`.
- **You know some JavaScript?** The `*_Threejs` folders show what A-Frame does for you, and give you access to the whole Three.js ecosystem.
- **Gaussian splats:** prefer the Three.js versions (Spark.js, `.sog` files, 5 MB). The A-Frame version needs a workaround library and a 48 MB file (see [Known limitations](#known-limitations)).
- **Testing on a laptop:** the `image_target_Threejs/` examples also run with a laptop webcam (hold the printed target in front of it). World tracking only works on a phone or tablet.

---

## Assets — What you need to print and prepare

### Image targets (print these)

These are the images the camera recognises. **Print them** (A4 is fine) or display them on another screen. They are in `assets/Targets/`.

| Image file | Size (px) | Used in |
|-----------|-----------|---------|
| `Target_1000055040.jpg` | 830 × 830 | Examples 01 to 08, and target A of example 09 |
| `Target_cat.jpg` | 584 × 937 | Example 09 (target B) |
| `Target_drawing.jpg` | 800 × 972 | Example 09 (target C) |
| `Target_dragonfly.jpg` | 934 × 754 | Example 09 (target D) |
| `Target_wall_close.jpg` | 994 × 768 | Example 09 (target E) |
| `Target_wall_large.jpg` | 986 × 564 | Example 09 (target F) |
| `Target_wall_detail.jpg` | 524 × 772 | Example 09 (target G) |

World examples need no target — just a reasonably textured floor or table (a plain white floor is hard to track).

> **Tip:** print at least 10 cm wide, with good contrast, on matte paper (glossy paper reflects light). Keep it flat and well-lit.

### Media files (`assets/`)

| File | Size | Used in |
|------|------|---------|
| `plant_modelling.glb` | 259 KB | 04 — static plant model |
| `satanim3.glb` | 1.4 MB | 04 — animated character |
| `634332__josefpres__bass-loops-077-with-drums-long-loop-120-bpm.mp3` | 189 KB | 05b, 06 — music loop (use this one) |
| `634332__josefpres__bass-loops-077-with-drums-long-loop-120-bpm.wav` | 2.1 MB | Same track, WAV (not used, heavier) |
| `mask_green_sil.mp4` | 603 KB | 05 — silhouette on a green background |
| `mask_*_back.mp4`, `mask_blue_sil.mp4`, `mask_red_sil.mp4`, `mask.mp4`, `video.mp4` | 0.4–2.8 MB | Other test videos (blue/red/white backgrounds) |
| `export1.png` | 27 KB | 03 — sample image |
| `flower_14p.sog` | 5.3 MB | 08 (Three.js) — Gaussian splat |
| `flower_38p.sog` | 15 MB | Higher-quality version of the same splat (not used) |
| `splat_30000.sog` | 19 MB | Another splat in `.sog` format (not used) |
| `splat_30000.splat` | 48 MB | 08 (A-Frame) — same capture in `.splat` format |

> File names are **case-sensitive** once published (GitHub Pages runs on Linux): `export1.png` and `Export1.png` are different files. A wrong case works on Windows and then fails online.

---

## Getting Started

### Step 1: Fork the repository (make your own copy)

A "fork" creates your own copy of this project on your GitHub account, which you can modify freely.

1. **Create a GitHub account** if you don't have one: [github.com](https://github.com) (free)
2. Go to the original repository: [github.com/b2renger/Aframe_8thwall_binary](https://github.com/b2renger/Aframe_8thwall_binary)
3. Click **Fork** (top-right)
4. You now have your own copy at `https://github.com/<your-username>/Aframe_8thwall_binary`

### Step 2: Choose your working environment

- **Option A (Firebase Studio)** — everything runs in the browser, nothing to install.
- **Option B (VS Code)** — on your computer; more control, and the easiest way to test on your phone (Step 3).

---

#### Option A: Firebase Studio (works in the browser)

Firebase Studio (formerly Project IDX) is a free online code editor from Google: VS Code in your browser, with a built-in web server and preview.

1. Open [Firebase Studio](https://idx.google.com/)
2. Click **Import a repo**, paste the URL of **your fork**, click **Import**
3. Wait for the environment to load (1–2 minutes the first time). It is configured by `.idx/dev.nix`
4. A **web preview** panel shows the landing page. If not: `Ctrl+Shift+P` → type **Web Preview** and pick *Show Web Preview*
5. The preview runs inside the editor frame, so the camera may not work there — use your phone (Step 3)

**To edit an example:** open a file (e.g. `image_target_8thFrame/01_primitives.html`), make a copy **in the same folder** with a new name without spaces (e.g. `my_poster.html`), change something (e.g. `color="#FF0055"` → `color="blue"`), save (`Ctrl+S`) and refresh the preview. See [Making your own page](#making-your-own-page) for why the copy must stay in the same folder.

**To push your changes to GitHub:** Source Control icon (left sidebar) → type a message → stage your files → **Commit & Push**.

---

#### Option B: VS Code on your computer

**1. Install:**

- **VS Code**: [code.visualstudio.com](https://code.visualstudio.com/)
- **Git**: [git-scm.com](https://git-scm.com/) (default options are fine)

**2. Clone your fork** (Windows: `Win+R`, type `cmd`, Enter):

```bash
git clone https://github.com/<your-username>/Aframe_8thwall_binary.git
cd Aframe_8thwall_binary
code .
```

Or in VS Code: **File > Open Folder** and select `Aframe_8thwall_binary`.

**3. Install the Live Server extension:** Extensions icon (`Ctrl+Shift+X`) → search **Live Server** (by Ritwick Dey) → **Install**.

**4. Start it:** right-click `index.html` → **Open with Live Server**. Your browser opens `http://127.0.0.1:5500/index.html`.

That is enough to test on your computer (`localhost` counts as secure), with one limit: only the `image_target_Threejs/` examples work with a laptop webcam (hold the printed target in front of it). The A-Frame examples show an "open this on your phone" screen (or a QR code), and the world examples need a phone. That is normal, not a broken setup. For the phone, continue with Step 3.

> **Don't use `python -m http.server` on Windows.** It often serves `.js` files with the wrong type (`text/plain`), and the AR engine then fails with *"Failed to load module script … MIME type of text/plain"*. Live Server doesn't have this problem.

---

### Step 3: Test on your phone

Your phone needs an **HTTPS** address. Pick one of these options.

#### Option 1 (recommended): VS Code port forwarding — real HTTPS, no certificate

VS Code can open a secure tunnel (Microsoft *dev tunnels*) to your local server and give you a public `https://` address. The certificate is a real one, so the phone shows **no security warning**, and the phone **doesn't even need to be on the same Wi-Fi** (4G works too).

1. Start **Live Server** normally (Step 2, Option B). Leave its settings at default (plain HTTP, port **5500**).
2. In VS Code open the **Ports** panel: it's a tab next to *Terminal* at the bottom. If you don't see it: `Ctrl+Shift+P` → **Ports: Focus on Ports View**.
3. Click **Forward a Port**, type `5500`, press Enter.
4. The first time, VS Code asks you to **sign in with GitHub** — accept.
5. A line appears with a **Forwarded Address** like `https://abc123xy-5500.euw.devtunnels.ms`.
6. **Make it public:** right-click the line → **Port Visibility** → **Public**.
   (By default the port is *Private*: the phone would have to sign in to your GitHub account to open it.)
7. Open that address on your phone: right-click the line → **Copy Local Address** (despite the name, it copies the `https://…devtunnels.ms` address), then send it to yourself by email or chat. Add the page path if needed, e.g. `https://abc123xy-5500.euw.devtunnels.ms/index.html`.
8. The first time, Microsoft may show a *"You are about to connect to a developer tunnel"* page: tap **Continue**.

Good to know:

- The address stays the same as long as you keep forwarding the same port, so you can bookmark it on the phone.
- When you're done, right-click the port → **Stop Forwarding Port**. A public port is reachable by **anyone who has the link** while it's open — don't leave it running with private files in the folder.
- Live reload keeps working: save in VS Code and the page on the phone refreshes.
- If you already did Option 2, Live Server now uses HTTPS on port **5501**. Either delete the three `liveServer.settings.*` lines from your settings (Live Server goes back to HTTP on 5500), or forward port **5501** instead of 5500, then right-click it → **Change Port Protocol** → **HTTPS**.

#### Option 2: Live Server with a self-signed certificate (same Wi-Fi)

Works without any account, but your phone will show a security warning, and phone and computer must be on the **same Wi-Fi network** (some school/office networks block this).

1. Create a certificate. Open a terminal in the project folder: in VS Code, **Terminal → New Terminal**. On Windows, click the small **˅** arrow next to **+** in the terminal panel and choose **Git Bash** (it's installed with Git). On macOS/Linux, the default terminal is fine. Then run:

   ```bash
   # Self-signed certificate valid 365 days
   MSYS_NO_PATHCONV=1 openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
   ```

   > `MSYS_NO_PATHCONV=1` is needed on Windows: without it Git Bash turns `/CN=localhost` into a Windows path and the command fails. Harmless on macOS/Linux. `key.pem` and `cert.pem` are listed in `.gitignore`, so they won't be published.

2. `Ctrl+Shift+P` → **Preferences: Open Settings (JSON)** and add:

   ```json
   "liveServer.settings.https": {
       "enable": true,
       "cert": "C:/Users/you/Documents/Aframe_8thwall_binary/cert.pem",
       "key": "C:/Users/you/Documents/Aframe_8thwall_binary/key.pem",
       "passphrase": ""
   },
   "liveServer.settings.host": "0.0.0.0",
   "liveServer.settings.port": 5501
   ```

   Replace the two example paths with the **full paths** of your own `cert.pem` and `key.pem`: in the VS Code Explorer, right-click the file → **Copy Path** and paste it. On Windows, change every `\` to `/`, because JSON doesn't accept single backslashes (on macOS a path looks like `/Users/you/Documents/Aframe_8thwall_binary/cert.pem`). A short path like `./cert.pem` does **not** work: Live Server doesn't look for it in your project folder, so it can't find the file and won't start in HTTPS mode. Paste the block **inside** the outer `{ }` of the settings file, and put a comma at the end of the line just above it. `"host": "0.0.0.0"` makes the server reachable from other devices on your Wi-Fi.

3. Find your computer's IP: Windows `ipconfig` (→ **IPv4 Address**, e.g. `192.168.1.42`), macOS `ipconfig getifaddr en0`.
4. **Windows only:** the first time Live Server starts with these settings, Windows may ask whether to let *Visual Studio Code* through the firewall. Tick **Private networks** and click **Allow**. If the phone still can't load the page (it spins, then times out), your Wi-Fi is probably marked as *Public*: set it to **Private network** in Settings → Network & internet → Wi-Fi → your network. If you can't change these settings (school computer), use Option 1.
5. On the phone open `https://192.168.x.x:5501` and accept the warning: **Advanced → Proceed** (Chrome) or **Show Details → visit this website** (Safari).

#### Option 3: Firebase Studio

In the Web Preview panel, click the **Open in new window** icon in its top toolbar. Copy the address of the tab that opens (it looks like `https://xxxx.idx.dev` or `…cloudworkstations.dev`) and open it on your phone. It is HTTPS already. You may need to sign in to the same Google account on the phone.

#### Try an example

1. The landing page shows all the example cards
2. Tap one (start with **Image Target — A-Frame → 01 Primitives**)
3. Allow camera access
4. Point at the printed target — or, for world examples, move the phone slowly for a few seconds then tap the floor
5. 3D content appears!

> **Troubleshooting:** nothing appears?
> - The URL must start with `https://` (or be `localhost` on the computer)
> - You allowed the camera (if you refused once: browser site settings → Camera → Allow, then reload)
> - Image targets: the right image (01–08 use `Target_1000055040.jpg`), printed clearly, flat and well lit
> - World: textured floor, good light, move the phone sideways a bit before tapping
> - Still stuck? Turn on the [on-phone console](#mobile-debugging--how-to-see-errors-on-your-phone) and read the red errors

---

### Step 4: Publish to GitHub Pages (make it public)

GitHub Pages is free hosting with a permanent HTTPS address anyone can open.

1. Push your changes:
   - VS Code: terminal (`Ctrl+ù` / ``Ctrl+` ``).
     **Only the very first time on this computer**, tell Git who you are (otherwise `git commit` stops with "Author identity unknown"):
     ```bash
     git config --global user.name "Your Name"
     git config --global user.email "you@example.com"
     ```
     Then, every time you want to publish:
     ```bash
     git add .
     git commit -m "My changes"
     git push
     ```
     On the first `git push`, a window opens asking you to sign in to GitHub: accept it.
   - Firebase Studio: Source Control panel (see Option A)
2. On GitHub, open your fork → **Settings** (top menu) → **Pages** (left sidebar)
3. **Source**: *Deploy from a branch* — **Branch**: `main`, folder `/ (root)` — **Save**
4. Wait 2–3 minutes and refresh: the address appears, `https://<your-username>.github.io/Aframe_8thwall_binary/`
5. Open it on any phone, share it, make a QR code of it.

---

## How to Modify the Examples

### Making your own page

1. Make a copy of an example **in the same folder** as the original, with a new name without spaces (e.g. `image_target_8thFrame/my_poster.html`). In VS Code: right-click the file → **Copy**, right-click the folder → **Paste**, then `F2` to rename it.
2. Keep it in that folder. The paths inside it start with `../`, which means "go up one folder" (`../engine/xr.js`, `../assets/…`, `../eruda-debug.js`), or with `lib/` (the helper file next to it). If you move the file elsewhere, it can't find them and the page stays black.
3. To open it easily, add a card on the landing page: in `index.html`, copy one `<a class="card blue" href="…">…</a>` block and change its `href` to your file (e.g. `image_target_8thFrame/my_poster.html`).

**Make your experience the home page (optional).** To open it at `https://<you>.github.io/Aframe_8thwall_binary/`, it must be in the project's root folder and be called `index.html`:

1. Rename the current landing page (e.g. to `landingpage.html`).
2. Move your file to the root folder and rename it `index.html`.
3. Fix its paths, because the file is now one folder higher. Use Find (`Ctrl+F`) for `../` and delete every one, including inside attributes (`src: ../assets/…`) and inside JavaScript strings: `../engine/xr.js` → `engine/xr.js`, `../assets/…` → `assets/…`, `../eruda-debug.js` → `eruda-debug.js`. Where a path had no `../`, add the folder name in front: `lib/tap-to-place.js` → `world_8thFrame/lib/tap-to-place.js`, `./lib/xr8-three-bootstrap.js` → `./image_target_Threejs/lib/xr8-three-bootstrap.js`, `./lib/xr8-three-world-bootstrap.js` → `./world_Threejs/lib/xr8-three-world-bootstrap.js`.
4. Test the **published** URL. Live Server and the dev tunnel ignore a leftover `../`, but GitHub Pages does not. If the page stays black, open the console (`?debug`) and look for red `Could not load …` or 404 lines: they name the path you missed. If the eruda gear button doesn't appear at all, the path to `eruda-debug.js` itself is the one you missed — or open the published page on your computer and press `F12` → Console, which lists every missing file.

### Understanding the HTML structure (A-Frame image target)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <!-- On-phone console: off unless switched on with ?debug or the landing-page box (see Mobile Debugging) -->
  <script src="../eruda-debug.js"></script>

  <!-- PART 1: Load the libraries -->
  <script src="https://cdn.8thwall.com/web/aframe/8frame-1.3.0.min.js"></script>  <!-- A-Frame -->
  <script src="https://cdn.8thwall.com/web/xrextras/xrextras.js"></script>         <!-- loading/error screens -->
  <script async src="../engine/xr.js" data-preload-chunks="slam"></script>        <!-- the AR engine ("slam" = its tracking part) -->

  <!-- PART 2: Tell the engine which image to look for -->
  <script>
    const onxrloaded = () => {
      XR8.XrController.configure({
        imageTargetData: [{
          "name": "my-poster",          // A name you choose (must match PART 4)
          "type": "PLANAR",             // A flat image
          "imagePath": "../assets/Targets/Target_1000055040.jpg",
          "properties": {
            "left": 0, "top": 0,
            "width": 830, "height": 830,              // image size in pixels
            "originalWidth": 830, "originalHeight": 830,
            "isRotated": false
          }
        }]
      });
    };
    window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded);
  </script>
</head>
<body>
  <!-- PART 3: The 3D scene. Keep these attributes as they are:
       xrextras-loading / -almost-there / -runtime-error = 8th Wall's loading screen,
         "open this on your phone" screen and error screen
       xrextras-gesture-detector = turns finger pinch/drag into events
       vr-mode-ui="enabled: false" = hides A-Frame's VR-goggles button (this is AR)
       xrweb="disableWorldTracking: true" = starts the AR engine, image targets only -->
  <a-scene
    xrextras-gesture-detector
    xrextras-almost-there
    xrextras-loading
    xrextras-runtime-error
    vr-mode-ui="enabled: false"
    xrweb="disableWorldTracking: true">

    <a-camera position="0 4 10"></a-camera>  <!-- the phone's camera: the AR engine moves it, keep this line as is -->

    <!-- PART 4: everything inside appears on the detected image.
         "name" must match the name in PART 2. -->
    <xrextras-named-image-target name="my-poster">
      <a-box color="red" position="0 0 0.25" scale="0.5 0.5 0.5"></a-box>
    </xrextras-named-image-target>

  </a-scene>
</body>
</html>
```

World examples are the same without PART 2, with three changes: the scene uses `xrweb="disableWorldTracking: false"`; the content goes in an `<a-entity tap-to-place>` instead of `<xrextras-named-image-target>`; and the `<head>` loads that component after the engine with `<script src="lib/tap-to-place.js"></script>`. That path points to `world_8thFrame/lib/tap-to-place.js`, so keep your page in `world_8thFrame/`. Without this line, tapping does nothing and you won't see an error.

### Coordinates and units

The two kinds of AR use different axes — this is the most common source of "my model is lying on its back".

**Image targets** (content inside `<xrextras-named-image-target>`, or in the Three.js group that follows the target):

- **Origin (0, 0, 0)** = centre of the image
- **X** = towards the right edge of the image
- **Y** = towards the **top edge** of the image (in the plane of the paper)
- **Z** = **out of the image**, towards you
- **1 unit = the height of the image** (top edge to bottom edge, with `"isRotated": false` as in all the examples). A 1 × 1 plane exactly covers the square target. A landscape image is wider than 1 unit (e.g. `Target_wall_large.jpg`, 986 × 564 px, is 1.75 × 1), a portrait one is narrower. `0 0 0.5` floats half an image-height in front of it
- Every `.glb` model is "Y-up": its top points along Y (Blender and other tools convert to this when they export). Inside an image target Y lies flat in the paper, so rotate the model with `rotation="90 0 0"` (Three.js: `model.scene.rotation.set(Math.PI / 2, 0, 0)`) to make it stand up out of the image (see example 04)

**World effects:**

- **Y = up**, the floor is at **y = 0**
- The phone starts at `0 4 10` (`<a-camera position="0 4 10">`): its **height of 4 units sets the scale** — 4 units ≈ the height of the phone above the floor (≈ 1.2–1.5 m), so 1 unit ≈ 30–40 cm. To change the scale, change that height: a **bigger** number makes everything look **smaller** (`0 8 10` → 1 unit ≈ 15–20 cm), a smaller number makes it look bigger. In A-Frame, edit `<a-camera position>` in your file. In Three.js, edit `CAMERA_ORIGIN` in `world_Threejs/lib/xr8-three-world-bootstrap.js` (use Find, `Ctrl+F`) (this changes all the Three.js world examples)
- Content is placed on the floor where you tap and turned to face you. No `rotation="90 0 0"` needed for models

### Changing the image target

1. **Choose a good image:** lots of detail and contrast, not symmetric, not repetitive. Photos, illustrations and posters work well; plain text or simple logos do not.
2. **Put the file** in `assets/Targets/` (e.g. `assets/Targets/my-image.jpg`)
3. **Update the configuration** with its path and its **exact pixel size**:

```javascript
imageTargetData: [{
  "name": "my-poster",
  "type": "PLANAR",
  "imagePath": "../assets/Targets/my-image.jpg",   // <-- your image
  "properties": {
    "left": 0, "top": 0,
    "width": 800, "height": 600,                   // <-- its real size in pixels
    "originalWidth": 800, "originalHeight": 600,
    "isRotated": false
  }
}]
```

**Where to find this:** in the A-Frame examples (`image_target_8thFrame/`) it's in the `<script>` inside `<head>`. If you change `"name"`, give `<xrextras-named-image-target name="…">` in the `<body>` the same name, or your content won't appear. In the Three.js examples (`image_target_Threejs/`) the same object is in the `imageTargets: [ … ]` list passed to `startXR8({ … })` near the end of the file: the keys have no quotes there, but the values are the same.

| Property | Description |
|---|---|
| `left`, `top` | Offset of the target inside the image file. Keep **0** for a normal image (they only matter when several targets are packed into one sprite sheet). |
| `width`, `height` | Pixel size of the region to track — for a normal image, the image's own size. The **aspect ratio is critical**: the engine uses it to compute the 3D pose. If it doesn't match the file, tracking is jittery or content is offset. |
| `originalWidth`, `originalHeight` | Pixel size of the whole file. For a normal image, **the same as `width` / `height`**. |
| `isRotated` | Sprite-sheet flag. Keep `false`. |

To check an image's size: Windows → right-click → Properties → Details; macOS → Finder → Get Info.

**Preparing your image:**

- **480–1024 px on the longest side.** The engine downscales internally; a 4K image only adds download time and a memory spike (≈ 32 MB to decode on the phone) without better tracking. ~768 px is a good choice.
- **Keep it in colour.** The engine converts to greyscale itself; converting beforehand can merge colours of similar brightness and lose detail.
- **JPEG (80–90 %) for photos, PNG for graphics.** Avoid BMP/TIFF.

Then print it and test.

### Changing the 3D content

Edit what's inside `<xrextras-named-image-target>` (image) or `<a-entity tap-to-place>` (world). The positions below are written for **world effects** (Y = up). Inside an image target, Z comes out of the paper (see [Coordinates and units](#coordinates-and-units)), so swap the 2nd and 3rd numbers: the cube becomes `position="0 0 0.25"`, the sphere `position="0 0 1"` bouncing `to: 0 0 2`. Flat things (`<a-image>`, `<a-text>`) already face you there: `position="0 0 0.01"` lays them on the paper.

```html
<!-- A red cube -->
<a-box color="red" position="0 0.25 0" scale="0.5 0.5 0.5"></a-box>

<!-- A blue sphere bouncing -->
<a-sphere color="blue" position="0 1 0" radius="0.3"
          animation="property: position; to: 0 2 0; dir: alternate; loop: true; dur: 1000"></a-sphere>

<!-- A text label -->
<a-text value="Hello AR!" color="white" position="0 1.5 0" align="center" width="4"></a-text>

<!-- A flat image -->
<a-image src="../assets/my-photo.jpg" position="0 1 0" width="2" height="1.5"></a-image>
```

See the [A-Frame documentation](https://aframe.io/docs/1.3.0/) for all shapes, materials, animations and components. For the Three.js versions, see the [Three.js manual](https://threejs.org/manual/).

### Adding your own assets

1. Put the files in `assets/` (mind the upper/lower case in file names)
2. In A-Frame, preload heavy assets in `<a-assets>`. Put it **inside `<a-scene>`**, as its first child (not in `<head>`). See example 04:

```html
<a-assets>
  <video id="my-video" src="../assets/my-video.mp4" loop muted playsinline crossorigin="anonymous"></video>
  <a-asset-item id="my-model" src="../assets/my-model.glb"></a-asset-item>
  <img id="my-image" src="../assets/my-photo.jpg" crossorigin="anonymous">
</a-assets>
```

3. Reference them with `#id`: `<a-entity gltf-model="#my-model"></a-entity>`. Keep only the `<a-assets>` lines you need: a line pointing to a file that doesn't exist makes the scene wait a few seconds.

**Adding a 3D model — checklist** (easiest: start from example 04, which already has all of this):

- Inside an image target, add `rotation="90 0 0"` so the model stands up out of the paper (not needed in world examples).
- Model invisible? It is probably huge or tiny: try `scale="0.01 0.01 0.01"`, then `0.1`, `1`, `10`.
- Animated model? Copy the `aframe-extras` `<script>` line from the `<head>` of example 04 and add `animation-mixer="clip: *; loop: repeat"` to the entity. Without that script, `animation-mixer` silently does nothing.

**Sound and video:** browsers only allow sound after the user **taps** the page. The camera finding an image is not a tap, so the image-target audio examples (05b, 06) ask for one tap first ("Tap the screen once to enable sound"). Videos without sound (`muted`) can start on their own.

**Three.js colour images:** when you load a colour texture yourself (`TextureLoader`, `CanvasTexture`), add `texture.colorSpace = THREE.SRGBColorSpace;` or it will look washed out. `GLTFLoader` does it for you.

---

## Mobile Debugging — How to see errors on your phone

When something goes wrong on the phone (black screen, nothing appears, no sound), the explanation is almost always in the browser **console**. On a computer you open it with `F12`; on a phone it's hidden. Three ways to see it:

### 1. eruda — a console directly on the phone (any phone, any browser, no cable) ⭐

[eruda](https://github.com/liriliri/eruda) is a small developer-tools panel that appears **on top of the page, on the phone itself**. It is already wired into every example here — you just switch it on:

- **For one page:** add `?debug` at the end of the URL
  `https://<you>.github.io/Aframe_8thwall_binary/image_target_8thFrame/01_primitives.html?debug`
  This is **not remembered**: open the page again without `?debug` and eruda is gone.
- **For all examples on this phone:** tick **On-phone console (eruda)** on the landing page. It's remembered on this phone (even after closing the browser) until you untick it — for this web address only: ticking it on your dev-tunnel address doesn't turn it on for your github.io address.
- **To switch it off:** untick the box on the landing page. While the box is ticked, `?debug=0` at the end of a URL hides eruda on that page only.

A **gear button** appears at the bottom right. Tap it to open the panel (you can drag the button if it hides something). The useful tabs:

| Tab | What it shows | Use it to… |
|-----|---------------|-----------|
| **Console** | Errors (red), warnings (yellow), and anything printed with `console.log(...)` | Read error messages; add your own `console.log('found!', detail)` in the code to follow what happens. There's also a command line at the bottom to type JavaScript, e.g. `XR8` or `document.querySelector('a-scene')` |
| **Network** | Files loaded by JavaScript (3D models, fonts, splats) with their status | Spot files in red / status **404** = wrong path or wrong upper/lower case. Images, videos, scripts and the image target are **not** listed here: for those, look in **Console** for a red `Could not load …` line |
| **Elements** | The live HTML | Check that an element exists and its attributes (e.g. `position`, `visible`) |
| **Resources** | localStorage, cookies… | Rarely needed here |
| **Info** | Browser, screen size, URL | Tell which browser/version a student is using |

Common errors and what they mean:

| You see in the console | Meaning / fix |
|------------------------|---------------|
| `NotAllowedError: Permission denied` (camera) | Camera access was refused. Browser site settings → Camera → Allow, then reload |
| Nothing about the camera at all, page stuck | Probably not HTTPS. Check the URL starts with `https://` |
| `Could not load …` in Console, `404` in Network, or `fetch for "…" responded with 404` | A file path is wrong — check spelling and **upper/lower case** |
| `NotSupportedError: … no supported sources` | Usually a wrong path to a sound or video file (`new Audio('…')`, `<video src>`) |
| `NotAllowedError: play() failed because the user didn't interact` | Sound blocked until the first tap (see "Sound and video" above) |
| `Failed to load module script … MIME type of "text/plain"` | The local server sends `.js` with the wrong type — use Live Server instead of `python -m http.server` on Windows |
| `… has been blocked by CORS policy` | A file is loaded from another website that doesn't allow it. Put the file in `assets/` instead |
| `No valid session manager to handle this session` | World tracking opened on a computer: use a phone |

> To add eruda to a page of your own in this project, put `<script src="../eruda-debug.js"></script>` as the **first** script in `<head>`, exactly like the examples do (so it catches errors from the scripts after it). The path is relative to your page: `../` means "one folder up". If your page sits at the project root, next to `index.html`, use `eruda-debug.js` without the `../`. Or, the bare minimum, before `</body>`:
> ```html
> <script src="https://cdn.jsdelivr.net/npm/eruda@3/eruda.min.js"></script>
> <script>eruda.init();</script>
> ```
> With the bare version eruda is always visible — remove it before sharing your project.

### 2. Android + Chrome, with a USB cable

Shows the phone's full Chrome DevTools on your computer.

**On the phone:** Settings → **About phone** → tap **Build number** 7 times ("You are now a developer!") → back to Settings → **System** → **Developer options** → enable **USB debugging**. (Menu names vary a little between brands.)

**Then:**

1. Plug the phone into the computer, tap **Allow** on the "Allow USB debugging?" popup
2. In Chrome on the computer go to `chrome://inspect/#devices`
3. Your phone and its open tabs appear; click **inspect** under your AR page
4. You get the full DevTools: Console, Network, Elements… and a live mirror of the phone screen

### 3. iPhone + Safari, with a cable and a Mac

**On the iPhone:** Settings → **Apps** → **Safari** → **Advanced** → enable **Web Inspector** (on older iOS: Settings → Safari → Advanced).

**On the Mac:** Safari → **Settings** → **Advanced** → tick **Show features for web developers** (older macOS: "Show Develop menu in menu bar").

**Then:** plug in the iPhone (tap **Trust** if asked), in Safari on the Mac open the **Develop** menu → your iPhone → your page. A Web Inspector window opens with Console, Network, Elements.

No Mac? Use eruda (method 1).

---

## Project Structure

```
Aframe_8thwall_binary/
│
├── index.html                  Landing page: links to all examples + eruda switch
├── eruda-debug.js              On-phone console: ?debug (one page) or landing-page box (all pages)
├── README.md                   This documentation
│
├── image_target_8thFrame/      Image targets — A-Frame (8frame 1.3.0)
│   ├── 01_primitives.html … 09_multi_targets.html
│   └── 05_b_video_chroma.html  Video chromakey + audio
│
├── image_target_Threejs/       Image targets — raw Three.js r178
│   ├── lib/xr8-three-bootstrap.js        Shared XR8 + Three.js setup, image target callbacks
│   └── 01_primitives.html … 09_multi_targets.html
│
├── world_8thFrame/             World effects — A-Frame
│   ├── lib/tap-to-place.js               tap-to-place / tap-to-cycle components
│   └── 01_primitives.html … 09_multi_targets.html
│
├── world_Threejs/              World effects — raw Three.js r178
│   ├── lib/xr8-three-world-bootstrap.js  Shared XR8 + Three.js setup, tap-to-place
│   └── 01_primitives.html … 09_multi_targets.html
│
├── engine/                     8th Wall XR Engine (do not modify — see License)
│   ├── xr.js, xr-slam.js, xr-face.js
│   ├── resources/              Models and workers used by the engine
│   └── LICENSE
│
├── assets/                     Media files
│   ├── Targets/                Image targets — print these
│   ├── *.glb, *.mp3, *.mp4, *.png, *.sog, *.splat
│
├── agents/                     Original planning/research notes (historical, partly outdated)
└── .idx/dev.nix                Firebase Studio configuration
```

### How the raw Three.js versions work

The engine (XR8) draws the camera image on `<canvas id="xr-canvas">`. The bootstrap module creates a **second, transparent canvas on top** for Three.js, and registers a *camera pipeline module* that, every frame, copies the phone's position and the camera's lens parameters from XR8 into the Three.js camera, and reports image targets through `onImageFound` / `onImageUpdated` / `onImageLost` (or taps through `onTapPlace` for world effects; there, the bootstrap also moves the sun, the light that casts shadows, to the tapped spot so the placed content keeps its shadows). If the engine can't start, the bootstrap shows the error on screen.

---

## Known limitations

- **Gaussian splat in A-Frame (`image_target_8thFrame/08`, `world_8thFrame/08`)**: Spark.js needs Three.js r178+, but 8frame bundles r137. These two examples use `@zappar/three-gaussian-splat` instead, with an import-map shim and a `Worker` patch. It works, but only with the `.splat` format (48 MB here — slow on mobile data). Prefer the Three.js versions (Spark.js, 5 MB `.sog`).
- **World tracking needs a phone or tablet.** On a computer the A-Frame world examples show a QR code to open them on a phone, and the Three.js ones show "World tracking needs a phone or tablet".
- **A-Frame examples on a computer** show XRExtras' "open this on your phone" screen; the `image_target_Threejs/` examples run with a laptop webcam.
- **Libraries come from CDNs** (8th Wall CDN, jsDelivr, esm.sh, raw.githubusercontent.com for the MSDF fonts). Without internet, the examples don't load.

---

## License and Credits

- **8th Wall XR Engine** (`engine/`): created by **Niantic Spatial, Inc.**, licensed under the [Niantic Spatial XR Engine License](engine/LICENSE). You may use and redistribute it **unmodified**, in your own applications; you may not modify, reverse-engineer or resell it, nor use it in a product sold for a fee whose value comes mainly from the engine (section 1.2). Any material using it must credit Niantic Spatial as the creator, include a copyright notice (`© Niantic Spatial, Inc.`), and refer to the license and its disclaimer of warranties (section 1.3) — the landing page footer does this; keep a similar notice if you publish your own project. The engine is provided "as is", without warranty. Read the license file for the exact terms.
- **A-Frame / 8frame**, **Three.js**, **eruda**: MIT License. **p5.js**: LGPL-2.1.
- **Spark.js**: MIT License. **troika-three-text**: MIT License.
- **aframe-extras** (the `animation-mixer` in the A-Frame `04_3d_models` examples) and **@zappar/three-gaussian-splat** (the A-Frame `08_gaussian_splat` examples): MIT License.
- **Audio**: bass loop by josefpres on [Freesound.org](https://freesound.org/) (CC0).
- **MSDF fonts**: [etiennepinchon/aframe-fonts](https://github.com/etiennepinchon/aframe-fonts) (fonts under their own open licenses).
