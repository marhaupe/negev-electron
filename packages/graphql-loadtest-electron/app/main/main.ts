import { format } from 'url';
import { BrowserWindow, app, ipcMain } from 'electron';
import { resolve } from 'app-root-path';
import { execute } from 'graphql-loadtest-core';
import isDev from 'electron-is-dev';

app.on('ready', async () => {
  const webPreferences = isDev
    ? {
        webSecurity: false
      }
    : {};

  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      ...webPreferences
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  const devPath = 'http://localhost:1124';
  const prodPath = format({
    pathname: resolve('app/renderer/.parcel/production/index.html'),
    protocol: 'file:',
    slashes: true
  });
  const url = isDev ? devPath : prodPath;

  mainWindow.setMenu(null);
  mainWindow.loadURL(url);
});

app.on('window-all-closed', app.quit);

ipcMain.on('loadtestFetcher-request', async (event: any, config: any) => {
  // = {
  //   phases: [{ arrivalRate: 1, duration: 1 }],
  //   fetchParams: {
  //     body: arg,
  //     url: 'https://marhaupe.de/query'
  //   }
  // };
  const res = await execute(config);
  event.reply('loadtestFetcher-response', res);
});
