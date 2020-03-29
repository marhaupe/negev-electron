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
    return executeDurationLoadtest(config, request);
  }

  return executeNumberRequestsLoadtest(config, request);
}

async function executeDurationLoadtest(config: DurationLoadtestConfig, request: Request): Promise<Stats> {
  if (!config.duration) {
    config.duration = 10;
  }

  const end = timeSpan();

  const requester = new DurationRequester(request);
  await requester.sendRequests(config.duration, config.rateLimit);
  await requester.awaitPendingRequests();
  const resolvedPromises = requester.getResolvedRequests();

  const loadtestDuration = end.rounded();

  return collectStats(resolvedPromises, loadtestDuration);
}

async function executeNumberRequestsLoadtest(config: NumberRequestsLoadtestConfig, request: Request): Promise<Stats> {
  if (!config.numberRequests) {
    config.numberRequests = 200;
  }

  const end = timeSpan();

  const requester = new NumberRequestsRequester(request);
  await requester.sendRequests(config.numberRequests, config.rateLimit);
  await requester.awaitPendingRequests();
  const resolvedPromises = requester.getResolvedRequests();

  const loadtestDuration = end.rounded();

  return collectStats(resolvedPromises, loadtestDuration);
}

abstract class Requester {
  request: Request;
  resolvedRequests: QueryResult[];
  rejectedRequests: Error[];
  pendingRequests: Promise<QueryResult | Error>[];

  constructor(request: Request) {
    this.request = request;
    this.resolvedRequests = [];
    this.rejectedRequests = [];
    this.pendingRequests = [];
  }

  protected sendSingleRequest(index: number) {
    this.pendingRequests.push(
      executeQuery(this.request)
        .then(response => {
          if (isError(response)) {
            this.rejectedRequests.push(response as Error);
            return response as Error;
          } else {
            this.resolvedRequests.push(response as QueryResult);
            return response as QueryResult;
          }
        })
        .catch(error => {
          this.rejectedRequests.push(error);
          return error as Error;
        })
        .finally(() => {
          this.pendingRequests.slice(index, 1);
        })
    );
  }

  public getResolvedRequests(): QueryResult[] {
    return this.resolvedRequests;
  }

  public getRejectedRequests(): Error[] {
    return this.rejectedRequests;
  }

  public async awaitPendingRequests(): Promise<(QueryResult | Error)[]> {
    console.log(this.pendingRequests.length);
    return Promise.all(this.pendingRequests);
  }
}

class DurationRequester extends Requester {
  async sendRequests(duration: number, rateLimit = 5000): Promise<void> {
    const getTotalDuration = timeSpan();
    for (let i = 0; i < Infinity; i++) {
      const getChunkDuration = timeSpan();
      const numberRequestsForCurrentChunk = rateLimit ? rateLimit : Infinity;
      for (let j = 0; j < numberRequestsForCurrentChunk; j++) {
        if (getTotalDuration() >= duration * 1000) {
          return;
        }
        this.sendSingleRequest(i * j);
        const chunkTimeElapsed = getChunkDuration();
        if (rateLimit && chunkTimeElapsed < 1000) {
          await sleep(1000 - chunkTimeElapsed);
        }
      }
    }
  }
}

class NumberRequestsRequester extends Requester {
  async sendRequests(numberRequests: number, rateLimit = 5000): Promise<void> {
    // If no rate limit is set, do all the work in one chunk.
    // If a limit is set, split the work equally in chunks,
    // After each iteration, we have to check if 1s has elapsed
    // since starting the work on the current chunk and sleep the remaining
    // fraction of a second if we have to.
    const chunks = getChunks(numberRequests, rateLimit);
    for (let i = 0; i < chunks.length; i++) {
      const numberRequestsForCurrentChunk = chunks[i];
      const getChunkTimeElapsed = timeSpan();
      for (let j = 0; j < numberRequestsForCurrentChunk; j++) {
        this.sendSingleRequest(i * j);
        const chunkTimeElapsed = getChunkTimeElapsed();
        const isLastChunk = i === chunks.length - 1;
        if (rateLimit && chunkTimeElapsed < 1000 && !isLastChunk) {
          await sleep(1000 - chunkTimeElapsed);
        }
      }
    }
  }
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
