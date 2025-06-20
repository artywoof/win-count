const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 520,      // ฟิต UI กระชับกับกล่องตัวเลข+ปุ่ม
    height: 435,
    resizable: false,
    icon: path.join(__dirname, 'LOGO.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  win.setMenuBarVisibility(false);
  win.loadFile('control.html');
  win.center();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
