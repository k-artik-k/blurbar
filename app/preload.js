const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('blurbar', {
  onSetMode: (cb) => ipcRenderer.on('set-mode', (e, mode) => cb(mode)),
  setIgnoreMouse: (ignore) => ipcRenderer.send('set-ignore-mouse', ignore)
});