const { app, BrowserWindow, Tray, Menu, clipboard, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const express = require('express');
const remoteMain = require('@electron/remote/main');
remoteMain.initialize();

const overlayApp = express();
overlayApp.use(express.static(__dirname));
const server = overlayApp.listen(3000, () => {
  console.log('Overlay server running on http://localhost:3000');
});

let controlWin, tray;
const WIN_PATH = path.join(__dirname, 'win_state.txt');

function getWin() {
  try { return Number(fs.readFileSync(WIN_PATH, 'utf8').trim()); } catch { return 0; }
}
function setWin(v) {
  fs.writeFileSync(WIN_PATH, String(v));
}

function createControlWindow() {
  controlWin = new BrowserWindow({
    width: 240,
    height: 310,
    resizable: false,
    maximizable: false,
    minimizable: true,
    frame: false, // Frameless!
    icon: path.join(__dirname, 'LOGO.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });
  controlWin.loadFile('control.html');
  controlWin.setMenuBarVisibility(false);
  remoteMain.enable(controlWin.webContents); // สำคัญ!

  controlWin.on('close', (e) => { 
    if (!app.isQuiting) {
      e.preventDefault();
      controlWin.hide();
    }
    return false;
  });
}

app.whenReady().then(() => {
  createControlWindow();

  tray = new Tray(path.join(__dirname, 'LOGO.ico'));
  const trayMenu = Menu.buildFromTemplate([
    { label: 'เปิด', click: () => controlWin.show() },
    { label: 'รีเซ็ทวิน', click: () => setWin(0) },
    { label: 'ปิดแอพ', click: () => {
      app.isQuiting = true;
      app.quit();
    }}
  ]);
  tray.setToolTip('Win Counter');
  tray.setContextMenu(trayMenu);
  tray.on('click', () => {
    controlWin.show();
    controlWin.focus();
  });

  // ==== Hotkey ====
  globalShortcut.register('Alt+=', () => { setWin(getWin() + 1); });
  globalShortcut.register('Alt+-', () => { setWin(getWin() - 1); });
  globalShortcut.register('Shift+Alt+=', () => { setWin(getWin() + 10); });
  globalShortcut.register('Shift+Alt+-', () => { setWin(getWin() - 10); });

  // ==== IPC (จาก control.html) ====
  ipcMain.on('close-all', () => {
    app.isQuiting = true;
    app.quit();
  });
  ipcMain.on('hide-control', () => {
    controlWin.hide();
  });
  ipcMain.on('set-win', (_e, v) => setWin(Number(v)));
  ipcMain.on('reset-win', () => setWin(0));
});

app.on('window-all-closed', () => {
  if (server) server.close();
  app.quit();
});
