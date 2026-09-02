const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronWidget', {
  minimize: () => ipcRenderer.send('widget-minimize'),
  close: () => ipcRenderer.send('widget-close'),
  togglePin: () => ipcRenderer.invoke('widget-toggle-pin'),
  openAdmin: () => ipcRenderer.send('widget-open-admin'),
  isPinned: () => ipcRenderer.invoke('widget-is-pinned')
});
