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
import { Request } from 'node-fetch';
import { executeQuery } from './query';
import { isError } from './__utils__';

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
  const { endpoint, query, duration, rateLimit, numberRequests = 200, headers = {} } = config;
  const validationResult = validateConfig({
    endpoint,
    query,
    duration,
    rateLimit,
    numberRequests,
    headers,
  });
  if (!validationResult.isValid) {
    throw new Error(validationResult.reason);
  }

  const request = new Request(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ query }),
  });

  if (duration) {
    throw new Error('not implemented. please leave duration to undefined.');
  }

  const pendingRequests: Promise<QueryResult | Error>[] = [];

  for (let i = 0; i < numberRequests; i++) {
    pendingRequests.push(executeQuery(request));
  }

  const resolvedPromises = await Promise.all(pendingRequests);

  return collectStats(resolvedPromises.filter(result => !isError(result)) as QueryResult[]);
}

function collectStats(responses: QueryResult[]): Stats {
  const totalRequests = responses.length;
  const combinedDuration = calculateTotalDuration(responses);
  const averageDurationPerRequest = calculateAverageDurationPerRequest(combinedDuration, totalRequests);

  const minDurationPerRequest = calculateMinDurationPerRequest(responses);
  const maxDurationPerRequest = calculateMaxDurationPerRequest(responses);
  const jitter = calculateJitter(maxDurationPerRequest, minDurationPerRequest, averageDurationPerRequest);

  return {
    totalRequests,
    averageDurationPerRequest,
    maxDurationPerRequest,
    minDurationPerRequest,
    jitter,
  };
}
