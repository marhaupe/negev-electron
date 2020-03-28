import { Stats, QueryResult, DurationLoadtestConfig, NumberRequestsLoadtestConfig, Config } from './types';
import Stream from 'stream';
import { validateConfig } from './validator';
import timeSpan from 'time-span';
import { isError, sleep } from './__utils__';
import { collectStats } from './stats';
import { executeQuery } from './query';
import { Request } from 'node-fetch';

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
    // const castedConfig = config as DurationLoadtestConfig;
    throw new Error('not implemented. please leave duration to undefined.');
  }

  const castedConfig = config as NumberRequestsLoadtestConfig;
  if (!castedConfig.numberRequests) {
    castedConfig.numberRequests = 200;
  }

  const end = timeSpan();
  const pendingRequests = await executeRequests(request, castedConfig.numberRequests, castedConfig.rateLimit);

  const resolvedPromises = await Promise.all(pendingRequests);

  const loadtestDuration = end.rounded();

  const filteredPromises = resolvedPromises.filter(result => !isError(result)) as QueryResult[];
  return collectStats(filteredPromises, loadtestDuration);
}

async function executeRequests(
  request: Request,
  numberRequests: number,
  rateLimit?: number
): Promise<Promise<QueryResult | Error>[]> {
  const pendingRequests: Promise<QueryResult | Error>[] = [];

  // If no rate limit is set, do all the work in one chunk.
  // If a limit is set, split the work equally in chunks,
  // After each iteration, we have to check if 1s has elapsed
  // since starting the work on the current chunk. If this
  // is the case and a limit is set, sleep the remaining fraction of a second.
  const chunks = getChunks(numberRequests, rateLimit);
  for (let i = 0; i < chunks.length; i++) {
    const numberRequestsForCurrentChunk = chunks[i];
    const end = timeSpan();
    for (let j = 0; j < numberRequestsForCurrentChunk; j++) {
      pendingRequests.push(executeQuery(request));
      const timeElapsed = end();
      if (rateLimit && timeElapsed < 1000) {
        await sleep(1000 - timeElapsed);
      }
    }
  }

  return pendingRequests;
}

export function getChunks(numberRequests: number, rateLimit?: number): number[] {
  if (!rateLimit) {
    return [numberRequests];
  }

  const chunks: number[] = [];
  let remainingWork = numberRequests;
  let maxChunkSize = rateLimit;

  while (true) {
    if (remainingWork <= maxChunkSize) {
      chunks.push(remainingWork);
      break;
    }
    chunks.push(maxChunkSize);
    remainingWork = remainingWork - maxChunkSize;
  }
  return chunks;
}
