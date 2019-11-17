import { ipcMain } from 'electron';
import { executeLoadtest } from 'graphql-loadtest-core';
import * as fs from 'fs';

export function setupListeners() {
  ipcMain.on('loadtestFetcher-request', async (event: any, config: any) => {
    try {
      const res = await executeLoadtest(config);
      event.reply('loadtestFetcher-request', res);
    } catch (error) {
      event.reply('loadtestFetcher-request', { error });
    }
  });

  ipcMain.on('getPersistedState', (event: any) => {
    const filename = './graphql-loadtest-persistence';
    const fileExists = fs.existsSync(filename);
    if (!fileExists) {
      fs.writeFileSync(filename, '{}');
    }
    const content = JSON.parse(fs.readFileSync(filename, 'utf-8'));
    event.reply('getPersistedState', content);
  });

  ipcMain.on('setPersistedState', (event: any, config: any) => {
    const filename = './graphql-loadtest-persistence';
    const fileExists = fs.existsSync(filename);
    if (!fileExists) {
      fs.writeFileSync(filename, '{}');
    }
    const content = JSON.parse(fs.readFileSync(filename, 'utf-8'));
    const newContent = { ...content, [config.key]: config.value };
    fs.writeFileSync(filename, JSON.stringify(newContent));
  });
}
