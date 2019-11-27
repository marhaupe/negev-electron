import { ipcMain, dialog } from 'electron';
import { executeLoadtest } from 'graphql-loadtest-core';
import fs from 'fs';

export function setupListeners() {
  ipcMain.on('request:loadtestFetcher', async (event: any, config: any) => {
    try {
      const res = await executeLoadtest(config);
      event.reply('response:loadtestFetcher', { resolved: res });
    } catch (error) {
      event.reply('response:loadtestFetcher', { rejected: { error: error.toString() } });
    }
  });

  ipcMain.on('request:loadConfig', async (event: any, config: any) => {
    dialog.showOpenDialog(
      {
        defaultPath: 'graphql-loadtest-config.json',
        properties: ['openFile', 'showHiddenFiles'],
        filters: [{ name: 'JSON', extensions: ['json'] }]
      },
      fileName => {
        if (!fileName || fileName.length === 0) {
          return;
        }
        if (fileName.length > 1) {
          dialog.showMessageBox({ type: 'error', message: 'Plase choose a single file', buttons: ['OK'] });
        }

        // fileName is a string that contains the path and filename created in the save file dialog.
        fs.readFile(fileName[0], (err, data) => {
          if (err) {
            dialog.showMessageBox({ type: 'error', message: err.message, buttons: ['OK'] });
            return;
          }
          try {
            const config = JSON.parse(data.toString());
            event.reply('response:loadConfig', config);
          } catch (error) {
            dialog.showMessageBox({ type: 'error', message: error, buttons: ['OK'] });
            return;
          }
        });
      }
    );
  });

  ipcMain.on('request:saveConfig', async (event: any, config: any) => {
    dialog.showSaveDialog(
      {
        defaultPath: 'graphql-loadtest-config.json'
      },
      fileName => {
        if (fileName === undefined) {
          return;
        }

        // fileName is a string that contains the path and filename created in the save file dialog.
        fs.writeFile(fileName, JSON.stringify(config), err => {
          if (err) {
            dialog.showMessageBox({ type: 'error', message: err.message, buttons: ['OK'] });
          }
        });
      }
    );
  });
}
