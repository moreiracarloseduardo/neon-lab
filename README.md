# ⚡ Neon Lab - Three.js Lighting & PBR Test

![ezgif-1c5126f142348342aaa](https://github.com/user-attachments/assets/dbc48be5-06a2-46ee-864b-91a890e1c6ff)


**Neon Lab** is an experimental 3D rendering environment built with **Three.js**. The project focuses on advanced cinematic lighting techniques, PBR (Physically Based Rendering) materials, and real-time interactivity.

## 🚀 Technologies Used

- **Three.js**: Core 3D engine.
- **Vite**: Ultra-fast build tool and development server.
- **lil-gui**: Interactive interface for parameter control.
- **Post-Processing**: Advanced Bloom (glow) effects.
- **PBR Materials**: Use of `MeshPhysicalMaterial` with clearcoat layers and refraction.

## ✨ Technical Highlights

- **Geometric Lighting:** Use of `RectAreaLights` to simulate real SFX light panels.
- **IBL (Image Based Lighting):** Studio environment via `RoomEnvironment` for realistic reflections.
- **Grounding (Contact Shadows):** Dynamic contact shadows that add weight and realism to objects.
- **Full Control:** Side panel to adjust colors, light intensities, and physical material properties.

## 📦 Installation & Usage

### Prerequisites

- [Node.js](https://nodejs.org/) installed.

### 1. Clone and Install

```bash
# Install dependencies
npm install
```

### 2. Start Development

```bash
# Run local server
npm run dev
```

Open `http://localhost:5173` in your browser.

### 3. Production Build

```bash
# Generate optimized bundle
npm run build
```

## 🎮 How to Test

- **Orbit Controls:** Use the mouse (left-click) to rotate the camera and scroll to zoom.
- **Control Panel:** In the top-right corner, use the sliders to change Bloom intensity, RGB panel colors, and the appearance of the central sphere.

---

*Developed for lighting and material studies in FiveM/Cinematic environments.*
