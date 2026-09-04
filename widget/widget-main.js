const { app, BrowserWindow, ipcMain, screen, Tray, Menu, shell, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
let isPinned = false;

function createWidgetWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const widgetWidth = 400;
  const widgetHeight = 650;
  const widgetX = screenWidth - widgetWidth - 24; // 24px margin from right edge
  const widgetY = 32; // 32px margin from top edge

  mainWindow = new BrowserWindow({
    width: widgetWidth,
    height: widgetHeight,
    x: widgetX,
    y: widgetY,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: true,
    minWidth: 360,
    minHeight: 500,
    maxWidth: 520,
    maxHeight: 900,
    alwaysOnTop: isPinned,
    skipTaskbar: false,
    show: false,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'widget.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Hide to tray on close if user clicks close
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

function createTray() {
  // Create an SVG-based icon or fallback icon
  const iconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="8" fill="#2F68A1"/>
      <path fill="#ffffff" d="M16 4a12 12 0 100 24 12 12 0 000-24zM8 16c0-.5.4-1 1-1s1 .4 1 1-.4 1-1 1-1-.4-1-1zm8 8a8 8 0 110-16 8 8 0 010 16z"/>
      <circle cx="16" cy="14" r="3.5" fill="#ffffff"/>
      <rect x="12" y="18" width="8" height="2" fill="#ffffff"/>
      <path fill="#ffffff" d="M10 22h12v2H10z"/>
    </svg>
  `;
  const iconBuffer = Buffer.from(iconSvg);
  const icon = nativeImage.createFromBuffer(iconBuffer);

  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip('Case Management • Desktop Widget');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Case Tracker Widget',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Open Full Admin Portal',
      click: () => {
        shell.openPath(path.join(__dirname, '..', 'admin.html'));
      }
    },
    { type: 'separator' },
    {
      label: 'Always On Top (Pinned)',
      type: 'checkbox',
      checked: isPinned,
      click: (item) => {
        isPinned = item.checked;
        if (mainWindow) mainWindow.setAlwaysOnTop(isPinned);
      }
    },
    { type: 'separator' },
    {
      label: 'Exit Widget',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

// IPC Handlers for Window Controls
ipcMain.on('widget-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('widget-close', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.handle('widget-toggle-pin', () => {
  isPinned = !isPinned;
  if (mainWindow) mainWindow.setAlwaysOnTop(isPinned);
  return isPinned;
});

ipcMain.handle('widget-is-pinned', () => {
  return isPinned;
});

ipcMain.on('widget-open-admin', () => {
  shell.openPath(path.join(__dirname, '..', 'admin.html'));
});

// Single Instance Lock (prevents multiple widget windows)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWidgetWindow();
    createTray();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWidgetWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Keep running in tray
  }
});
