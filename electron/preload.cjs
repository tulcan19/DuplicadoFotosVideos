const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  selectFolder: () => ipcRenderer.invoke('dialog:select-folder'),
  selectFiles: () => ipcRenderer.invoke('dialog:select-files'),
  moveToTrash: (filePaths) => ipcRenderer.invoke('trash:items', filePaths),
  showInFolder: (filePath) => ipcRenderer.invoke('shell:show-item', filePath),
  readLocalFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
});
