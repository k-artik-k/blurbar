# BlurBar — Internal Documentation

## Concept

BlurBar is a screen privacy overlay. The core idea: a vertical bar sits at the edge of a covered region. You drag it to control how much of the screen is hidden. The bar has a blob handle that emerges from the line on hover, stretches physically during drag, and snaps back on release.

---

## Architecture
app/

├── main.js        — Electron main process. Creates overlay window and tray.

├── preload.js     — IPC bridge between main and renderer.

├── overlay.html   — Renderer entry point.

├── style.css      — Overlay styles.

├── script.js      — All interaction logic, spring physics, SVG path building.

└── tray-icon.png  — System tray icon.

### Main process (`main.js`)

Creates a fullscreen, frameless, always-on-top, transparent `BrowserWindow`. The window is non-focusable and skips the taskbar so it's invisible to the user except visually.

`setIgnoreMouseEvents(true, { forward: true })` is set by default — the entire overlay passes mouse events through to whatever's beneath. When the cursor enters the hitzone (the bar area), the renderer sends an IPC message to flip this to `false`, enabling drag interaction. Flips back to `true` on mouse leave.

The tray is built with `Tray` + `Menu.buildFromTemplate`. Mode changes (blur/tint) are sent to the renderer via `webContents.send('set-mode', mode)`.

### Preload (`preload.js`)

Exposes two methods to the renderer via `contextBridge`:

- `blurbar.setIgnoreMouse(bool)` — tells main to toggle click-through
- `blurbar.onSetMode(cb)` — listens for mode changes from tray

### Renderer (`script.js`)

**Spring system**

All movement uses a simple spring integrator:
```js
function spring(cur, tgt, vel, k, d) {
  vel += (tgt - cur) * k;
  vel *= d;
  return [cur + vel, vel];
}
```
`k` = stiffness, `d` = damping. Four independent springs run every frame: line X position, blob Y position, blob width, blob height.

**SVG path builder**

The bar + blob is one single SVG `<path>`. The line is a 2px wide rect from top to bottom of screen. The blob is a cubic bezier bulge at the cursor's Y position on the line. Direction of bulge flips based on drag direction — drag right = blob stretches right, drag left = blob stretches left. Physics feel: blob elongates with speed, snaps back with spring overshoot on release.

**Overlay**

A fixed `div` covering `coverage%` of the left screen width.

- Tint mode: `rgba(0,0,0, intensity)` — flat black, opacity controlled by Y position
- Blur mode: `backdropFilter: blur(Xpx)` — currently disabled, doesn't work reliably on Electron transparent windows on Win11 without native acrylic

**Intensity**

`intensity = 1 - (mouseY / screenHeight)` — drag to top = max intensity, drag to bottom = min. Locked on release, doesn't track cursor passively.

**Coverage**

`coverage = (lineX / screenWidth) * 100` — expressed as a percentage. Updated live during drag via the spring's current position, not target position, so it follows the animated line not the cursor directly.

---

## Known Limitations

- **Blur mode broken on Win11 transparent windows** — `backdropFilter` doesn't apply through Electron's transparent window compositor. Native acrylic (`backgroundMaterial: 'acrylic'`) blurs the entire window, not a sub-region. Tint mode works perfectly as a workaround.
- **Single monitor only** — overlay spawns on primary display. Multi-monitor support planned.
- **No persistence** — position and intensity reset on relaunch.

---

## Iteration History

| Version | Notes |
|---|---|
| C++ Win32 | First attempt. Native GDI overlay. Looked like Windows 98. Abandoned. |
| Prototype v1–v4 | HTML/CSS/JS prototypes. Wrong architecture — blob was detached from line. |
| Prototype v5 | SVG path approach. Blob born from line. Triple-blob bug. |
| Prototype v6 | Clean single bezier blob. Physics fixed. Blob direction inverted correctly. |
| Electron v1 | Current. Tray, always-on-top, click-through, tint working. Blur shelved. |

---

## Next — Iteration 2

Auto-trigger on specific app focus. Plan:

- Poll foreground window every 500ms using a native module or PowerShell call
- Match against a user-defined list of app names stored in a config JSON
- Auto-show overlay when matched app is focused, auto-hide when not
- Settings page in tray or separate window to manage the app list