const { app, BrowserWindow, Tray, Menu, ipcMain, screen } = require('electron');
const path = require('path');

let tray = null;
let overlayWindow = null;
let overlayVisible = true;
let currentMode = 'tint';

function createOverlay() {
  const { width, height } = screen.getPrimaryDisplay().bounds;

  overlayWindow = new BrowserWindow({
    x: 0,
    y: 0,
    width,
    height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    backgroundMaterial: 'none', 
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  overlayWindow.loadFile('overlay.html');
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });

  // allow mouse events only on the bar hitzone
  ipcMain.on('set-ignore-mouse', (e, ignore) => {
    overlayWindow.setIgnoreMouseEvents(ignore, { forward: true });
  });
}

function createTray() {
  // fallback if no icon yet
  const iconPath = path.join(__dirname, 'tray-icon.png');
  try {
    tray = new Tray(iconPath);
  } catch {
    // if icon missing, electron will error — make sure to add tray-icon.png
    tray = new Tray(path.join(__dirname, 'tray-icon.png'));
  }

  tray.setToolTip('BlurBar');
  buildTrayMenu();
}

function buildTrayMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: 'BlurBar On',
      type: 'checkbox',
      checked: overlayVisible,
      click: () => {
        overlayVisible = !overlayVisible;
        if (overlayVisible) {
          overlayWindow.show();
        } else {
          overlayWindow.hide();
        }
        buildTrayMenu();
      }
    },
    { type: 'separator' },
    {
      label: 'Tint',
      type: 'radio',
      checked: currentMode === 'tint',
      click: () => {
        currentMode = 'tint';
        overlayWindow.webContents.send('set-mode', 'tint');
        buildTrayMenu();
      }
    },
    {
      label: 'Blur',
      type: 'radio',
      checked: currentMode === 'blur',
      click: () => {
        currentMode = 'blur';
        overlayWindow.webContents.send('set-mode', 'blur');
        buildTrayMenu();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit()
    }
  ]);

  tray.setContextMenu(menu);
}

app.whenReady().then(() => {
  createOverlay();
  createTray();
});

app.on('window-all-closed', e => e.preventDefault());