import fetch from 'node-fetch';
export { executeLoadtest, getLoadtestStream } from './loadtest';
export * from './types';

// make `fetch` globally accessible for easier mocking
declare global {
  function fetch(url: RequestInfo, init?: RequestInit): Promise<Response>;
}

(global as any).fetch = fetch;
