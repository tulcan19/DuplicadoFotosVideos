const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    minWidth: 950,
    minHeight: 650,
    backgroundColor: '#0a0f1d',
    title: 'FotoClean - Detector de Fotos y Videos Duplicados',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev && !process.env.ELECTRON_PROD_TEST) {
    mainWindow.loadURL(devUrl).catch(() => {
      // Si el servidor dev aún no arrancó o falla, cargar dist
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler: Mover archivos a la Papelera de reciclaje de Windows
ipcMain.handle('trash:items', async (event, filePaths) => {
  const results = { success: [], failed: [] };
  if (!Array.isArray(filePaths)) return results;

  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        await shell.trashItem(filePath);
        results.success.push(filePath);
      } else {
        results.failed.push({ path: filePath, error: 'Archivo no encontrado' });
      }
    } catch (err) {
      console.error('Error al mover a la papelera:', filePath, err);
      results.failed.push({ path: filePath, error: err.message });
    }
  }

  return results;
});

// IPC Handler: Abrir en el explorador de Windows
ipcMain.handle('shell:show-item', async (event, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath);
    return true;
  }
  return false;
});

// IPC Handler: Seleccionar carpeta nativa
ipcMain.handle('dialog:select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Seleccionar carpeta con fotos y videos para analizar',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const folderPath = result.filePaths[0];
  const mediaExtensions = new Set([
    '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif', '.avif',
    '.mp4', '.webm', '.mov', '.mkv', '.avi', '.m4v'
  ]);
  
  try {
    const files = fs.readdirSync(folderPath);
    const mediaFiles = [];

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (mediaExtensions.has(ext)) {
        const fullPath = path.join(folderPath, file);
        const stats = fs.statSync(fullPath);
        mediaFiles.push({
          name: file,
          path: fullPath,
          size: stats.size,
          lastModified: stats.mtimeMs,
        });
      }
    }

    return { folderPath, files: mediaFiles };
  } catch (err) {
    console.error('Error al leer carpeta:', err);
    return { folderPath, files: [], error: err.message };
  }
});

// IPC Handler: Leer archivo local en Base64 o Buffer para la app
ipcMain.handle('file:read', async (event, filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    const mime = ext === 'jpg' ? 'jpeg' : ext;
    return `data:image/${mime};base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.error('Error al leer archivo:', err);
    return null;
  }
});
