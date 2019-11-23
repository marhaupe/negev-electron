import { ipcMain } from 'electron';
import { executeLoadtest } from 'graphql-loadtest-core';

export function setupListeners() {
  ipcMain.on('request:loadtestFetcher', async (event: any, config: any) => {
    try {
      const res = await executeLoadtest(config);
      event.reply('response:loadtestFetcher', res);
    } catch (error) {
      event.reply('response:loadtestFetcher', { error });
    }
  });
}
