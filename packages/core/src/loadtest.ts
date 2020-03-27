import { Config, Stats, QueryResult } from './types';
import { validateConfig } from './validator';
import Stream from 'stream';
import {
  calculateTotalDuration,
  calculateAverageDurationPerRequest,
  calculateMinDurationPerRequest,
  calculateMaxDurationPerRequest,
  calculateJitter,
} from './calculator';
import { VError } from 'verror';
import { Request } from 'node-fetch';
import workerFarm from 'worker-farm';

/**
 *
 * @returns A readable stream. Each time a sent request is resolved, the updated `Stats` array that
 * is being updated and written to the stream. This enables realtime display of the data collected by
 * the loadtest.
 */
export function executeStreamingLoadtest(config: Config): Stream.Readable {
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
  const { endpoint, query, duration, rateLimit, numberRequests = 200, headers = {}, numberWorkers = 10 } = config;
  const validationResult = validateConfig({
    endpoint,
    query,
    duration,
    rateLimit,
    numberRequests,
    headers,
    numberWorkers,
  });
  if (!validationResult.isValid) {
    throw new VError(validationResult.reason);
  }

  const request = new Request(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(query),
  });

  if (duration) {
    throw new VError('not implemented. please leave duration to undefined.');
  }

  const executeRequestsInWorker = workerFarm(require.resolve('./requester'));
  const results: Promise<QueryResult | Error>[] = [];
  for (let i = 0; i < numberWorkers; i++) {
    executeRequestsInWorker(
      {
        request,
        numberRequests: Math.round(numberRequests / numberWorkers),
        rateLimit,
      },
      function(_err: Error | null, result: Promise<QueryResult | Error>[]) {
        results.push(...result);
      }
    );
  }
  const resolvedResults = await Promise.all(results);

  return collectStats(resolvedResults.filter(result => !isError(result)) as QueryResult[]);
}

function isError(e: any): boolean {
  return e && e.stack && e.message && typeof e.stack === 'string' && typeof e.message === 'string';
}

function collectStats(responses: QueryResult[]): Stats {
  const totalRequests = responses.length;
  const combinedDuration = calculateTotalDuration(responses);
  const averageDurationPerRequest = calculateAverageDurationPerRequest(combinedDuration, totalRequests);

  const minDurationPerRequest = calculateMinDurationPerRequest(responses);
  const maxDurationPerRequest = calculateMaxDurationPerRequest(responses);
  const jitter = calculateJitter(maxDurationPerRequest, minDurationPerRequest, averageDurationPerRequest);

  return {
    responses,
    averageDurationPerRequest,
    maxDurationPerRequest,
    minDurationPerRequest,
    jitter,
  };
}
