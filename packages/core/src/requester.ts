import { Request } from 'node-fetch';
import { QueryResult } from './types';
import { sleep } from './__utils__';
import { executeQuery } from './query';
import timeSpan from 'time-span';

abstract class Requester {
  protected request: Request;
  protected rateLimit: number | undefined;
  protected pendingRequests: Promise<QueryResult | Error>[];

  constructor(request: Request, rateLimit?: number) {
    this.request = request;
    this.rateLimit = rateLimit;
    this.pendingRequests = [];
  }

  protected async sendSingleRequest() {
    this.pendingRequests.push(
      await executeQuery(this.request)
        .then((response) => {
          return response;
        })
        .catch((error) => {
          return error;
        })
    );
  }

  public async getPendingRequests() {
    return Promise.all(this.pendingRequests);
  }
}

export class DurationRequester extends Requester {
  async sendRequests(duration: number): Promise<void> {
    const getTotalDuration = timeSpan();
    while (true) {
      const getChunkDuration = timeSpan();
      const numberRequestsForCurrentChunk = this.rateLimit ? this.rateLimit : Infinity;
      for (let j = 0; j < numberRequestsForCurrentChunk; j++) {
        if (getTotalDuration() >= duration * 1000) {
          return;
        }
        await this.sendSingleRequest();
      }
      const chunkTimeElapsed = getChunkDuration();
      if (this.rateLimit && chunkTimeElapsed < 1000) {
        await sleep(1000 - chunkTimeElapsed);
      }
    }
  }
}

export class NumberRequestsRequester extends Requester {
  async sendRequests(numberRequests: number): Promise<void> {
    // If no rate limit is set, do all the work in one chunk.
    // If a limit is set, split the work equally in chunks,
    // After each iteration, we have to check if 1s has elapsed
    // since starting the work on the current chunk and sleep the remaining
    // fraction of a second if we have to.
    const chunks = getChunks(numberRequests, this.rateLimit);
    for (let i = 0; i < chunks.length; i++) {
      const numberRequestsForCurrentChunk = chunks[i];
      const getChunkTimeElapsed = timeSpan();
      for (let j = 0; j < numberRequestsForCurrentChunk; j++) {
        await this.sendSingleRequest();
      }
      const chunkTimeElapsed = getChunkTimeElapsed();
      const isLastChunk = i === chunks.length - 1;
      if (this.rateLimit && chunkTimeElapsed < 1000 && !isLastChunk) {
        await sleep(1000 - chunkTimeElapsed);
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
