# 🌲 Pixel Forest — PixiJS Game Menu

A 2D pixel-art game menu built with **PixiJS v7** + **React 19** + **TypeScript** + **Vite**.

## 🎮 Features

- **Parallax Background** — 5-layer depth: sky → mountains → far trees → mid trees → near trees → ground
- **Pixel Horse Herd** — 6 horses running across screen using `PIXI.AnimatedSprite` (8 frames, procedurally generated)
- **Main Menu** — Pixel-art styled panel with *START* and *EXIT* buttons
- **Difficulty Menu** — Easy / Medium / Hard / Asia + Back button
- **Smooth Transitions** — Fade in/out between menus (eased tween)
- **8-bit Sound Effects** — Web Audio API procedural sounds (hover, click, menu open/back)
- **Pixel-Perfect Rendering** — `NEAREST` scale mode, no antialiasing

## 🏗️ Architecture

```
src/
├── App.tsx                        ← React canvas mount wrapper
├── main.tsx                       ← Entry point
├── index.css                      ← Global pixel-perfect canvas style
└── game/
    ├── PixiApp.ts                 ← Main PIXI.Application + game loop
    ├── systems/
    │   ├── BackgroundSystem.ts    ← Parallax TilingSprite layers
    │   ├── HorseSystem.ts         ← AnimatedSprite horse herd
    │   └── UISystem.ts            ← Finite-state menu manager
    └── utils/
        ├── PixelArtFactory.ts     ← Procedural texture generation
        └── SoundManager.ts        ← Web Audio API 8-bit sounds
```

### Container Hierarchy

```
PIXI.stage
  ├── backgroundContainer   ← TilingSprites (parallax layers)
  ├── horseContainer        ← AnimatedSprites (horse herd)
  └── uiContainer           ← Menu panels & buttons
```

## 🚀 Getting Started

```bash
# Install dependencies (includes pixi.js v7)
npm install

# Run dev server
npm run dev
```

Open `http://localhost:5173`

## 🎨 Assets

All pixel art is **100% procedurally generated** — no external sprite sheets or image files are needed. Every texture is drawn using `PIXI.Graphics` and rendered to `PIXI.RenderTexture` at runtime.

This means the project works **offline, instantly**, with no asset loading errors.

### Palette

| Element | Color |
|---------|-------|
| Sky | Deep navy `#05071a` → `#1a0a35` |
| Moon | Warm ivory `#fff4b8` |
| Mountains | Dark slate `#0e1a2e` |
| Trees (far) | Deep forest `#0d2314` |
| Ground | Dark moss `#1a3d08` |
| Horse body | Chestnut brown `#7a3b10` |

## 🔧 Technical Notes

- **Pixel-perfect**: `PIXI.settings.SCALE_MODE = NEAREST` + `imageRendering: pixelated` on canvas
- **No StrictMode**: Removed to prevent double WebGL context creation in development
- **Menu FSM**: Simple `'main' | 'difficulty'` state, transitions via alpha tweening
- **Sound**: Web Audio API oscillators — no `.mp3` files, pure 8-bit tones
- **Responsive**: Listens to `window.resize`, updates renderer + systems

## 🕹️ Menu Controls

| Action | Result |
|--------|--------|
| Hover button | Scale + glow effect + hover sound |
| Click **START** | Fade to difficulty selection |
| Click **BACK** | Fade back to main menu |
| Click **EASY/MEDIUM/HARD/ASIA** | Console log + notification |
| Click **EXIT** | UI fades out |
