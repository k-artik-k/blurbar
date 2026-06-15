# BlurBar  

![Platform](https://img.shields.io/badge/platform-Windows%2011-blue)
![Version](https://img.shields.io/badge/version-1.0.0-gray)
![License](https://img.shields.io/badge/license-ISC-green)
![Electron](https://img.shields.io/badge/electron-v42-47848F)

A lightweight screen privacy overlay for Windows 11. Sits always-on-top, hides the left portion of your screen with a smooth tint. Drag to adjust coverage and intensity.

Built with Electron.

---

## What it does

- Draggable bar that covers the left side of your screen
- Drag left/right to control how much of the screen is covered
- Drag up/down to control darkness intensity
- Always on top — works over any app
- System tray icon to toggle on/off and switch modes
- Click-through on everything except the bar itself

---

## Install

Download the latest `.exe` from [Releases](../../releases) and run it. No setup needed.

---

## Dev setup

```bash
git clone https://github.com/k-artik-k/blurbar
cd blurbar/app
npm install
npx electron .
```

## Build

```bash
npm run build
```

Outputs installer to `dist/`.

---

## Usage

- **Hover** the bar — handle appears
- **Drag left/right** — adjust screen coverage
- **Drag up/down** — adjust tint intensity
- **Hold 700ms** on the bar — toggle blur/tint mode
- **System tray** — right click to toggle overlay or switch mode

---

## Stack

- Electron v42
- Vanilla JS + SVG
- No frameworks, no dependencies at runtime

---

## Roadmap

- [ ] Auto-trigger on specific app launch
- [ ] Blur mode (win11 native acrylic)
- [ ] Multi-monitor support
- [ ] Startup on boot

---

Made by [Kartikeya](https://github.com/k-artik-k)
