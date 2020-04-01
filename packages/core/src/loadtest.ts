import { Stats, DurationLoadtestConfig, NumberRequestsLoadtestConfig, Config, QueryResult } from './types';
import Stream from 'stream';
import { validateConfig } from './validator';
import timeSpan from 'time-span';
import { collectStats } from './stats';
import { Request } from 'node-fetch';
import { DurationRequester, NumberRequestsRequester } from './requester';

const DEFAULT_CONCURRENCY_LIMIT = 50;
const DEFAULT_NUMBER_REQUESTS = 500;
const DEFAULT_DURATION = 200;

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

  const end = timeSpan();

  let queryResults: QueryResult[] = [];
  if ((config as DurationLoadtestConfig).duration) {
    queryResults = await executeDurationLoadtest(config, request);
  } else {
    queryResults = await executeNumberRequestsLoadtest(config, request);
  }

  const loadtestDuration = end.rounded();

  return collectStats(queryResults, loadtestDuration);
}

async function executeDurationLoadtest(
  { concurrencyLimit = DEFAULT_CONCURRENCY_LIMIT, duration = DEFAULT_DURATION, rateLimit }: DurationLoadtestConfig,
  request: Request
): Promise<QueryResult[]> {
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

  return Promise.all(workerPromises).then(nestedQueryResults => nestedQueryResults.flat(1));
}

async function executeNumberRequestsLoadtest(
  {
    concurrencyLimit = DEFAULT_CONCURRENCY_LIMIT,
    numberRequests = DEFAULT_NUMBER_REQUESTS,
    rateLimit,
  }: NumberRequestsLoadtestConfig,
  request: Request
): Promise<QueryResult[]> {
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

  return Promise.all(workerPromises).then(nestedQueryResults => nestedQueryResults.flat(1));
}
