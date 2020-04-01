import fetch, { RequestInfo } from 'node-fetch';
export {
  executeLoadtest,
  executeStreamingLoadtest,
  DEFAULT_CONCURRENCY_LIMIT,
  DEFAULT_DURATION,
  DEFAULT_NUMBER_REQUESTS,
} from './loadtest';
export * from './types';

// Make `fetch` globally accessible for easier mocking.
// This uses the typing of `node-fetch`'s `fetch`. Beware that
// this might differ as time progresses.
declare global {
  function fetch(url: RequestInfo, init?: RequestInit): Promise<Response>;
}

(global as any).fetch = fetch;
