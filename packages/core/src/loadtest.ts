import { Stats, DurationLoadtestConfig, NumberRequestsLoadtestConfig, Config, QueryResult } from './types';
import Stream from 'stream';
import { validateConfig } from './validator';
import timeSpan from 'time-span';
import { collectStats } from './stats';
import { Request } from 'node-fetch';
import { DurationRequester, NumberRequestsRequester } from './requester';

/**
 *
 * @returns A readable stream. Each time a sent request is resolved, the updated `Stats` array that
 * is being updated and written to the stream. This enables realtime display of the data collected by
 * the loadtest.
 */
export function executeStreamingLoadtest(
  config: DurationLoadtestConfig | NumberRequestsLoadtestConfig
): Stream.Readable {
  const stream = new Stream.Readable({
    objectMode: true,
    read(_size) {},
  });

  executeLoadtest(config, stream).catch(error => {
    stream.emit('error', error);
    stream.push(null);
  });

  return stream;
}

export async function executeLoadtest(config: Config, _stream?: Stream.Readable): Promise<Stats> {
  if (
    (config as DurationLoadtestConfig & NumberRequestsLoadtestConfig).duration &&
    (config as DurationLoadtestConfig & NumberRequestsLoadtestConfig).numberRequests
  ) {
    console.warn('You set both duration and numberOfRequests. Ignoring numberOfRequests.');
  }

  const validationResult = validateConfig(config);
  if (!validationResult.isValid) {
    throw new Error(validationResult.reason);
  }

  const { endpoint, query, headers = {} } = config;
  const request = new Request(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ query }),
  });

  if ((config as DurationLoadtestConfig).duration) {
    return executeDurationLoadtest(config, request);
  }

  return executeNumberRequestsLoadtest(config, request);
}

async function executeDurationLoadtest(
  { concurrencyLimit = 50, duration = 10, rateLimit }: DurationLoadtestConfig,
  request: Request
): Promise<Stats> {
  const end = timeSpan();

  const workerPromises: Promise<QueryResult[]>[] = [];
  for (let i = 0; i < concurrencyLimit; i++) {
    workerPromises.push(
      (async () => {
        const requester = new DurationRequester(request, rateLimit);
        await requester.sendRequests(duration);
        return requester.getResolvedRequests();
      })()
    );
  }

  const resolvedWorkerPromises = await Promise.all(workerPromises);
  const queryResults = resolvedWorkerPromises.flat(1);

  const loadtestDuration = end.rounded();

  return collectStats(queryResults, loadtestDuration);
}

async function executeNumberRequestsLoadtest(
  { concurrencyLimit = 50, numberRequests = 200, rateLimit }: NumberRequestsLoadtestConfig,
  request: Request
): Promise<Stats> {
  const end = timeSpan();

  const workerPromises: Promise<QueryResult[]>[] = [];
  for (let i = 0; i < concurrencyLimit; i++) {
    workerPromises.push(
      (async () => {
        const requester = new NumberRequestsRequester(request, rateLimit);
        await requester.sendRequests(Math.round(numberRequests / concurrencyLimit));
        return requester.getResolvedRequests();
      })()
    );
  }

  const resolvedWorkerPromises = await Promise.all(workerPromises);
  const queryResults = resolvedWorkerPromises.flat(1);

  const loadtestDuration = end.rounded();

  return collectStats(queryResults, loadtestDuration);
}
