import { Config, Stats, QueryResult } from './types';
import { validateConfig } from './validator';
import Stream from 'stream';
import { executeQuery } from './query';
import { sleep } from './__utils__';
import {
  calculateTotalDuration,
  calculateAverageDurationPerRequest,
  calculateMinDurationPerRequest,
  calculateMaxDurationPerRequest,
  calculateJitter,
} from './calculator';

/**
 *
 * @returns A readable stream. Each time a sent request is resolved, the updated `Stats` array that
 * is being updated and written to the stream. This enables realtime display of the data collected by
 * the loadtest.
 */
export function getLoadtestStream(config: Config): Stream.Readable {
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

export async function executeLoadtest(config: Config, stream?: Stream.Readable): Promise<Stats[]> {
  const validationResult = validateConfig(config);
  if (!validationResult.isValid) {
    throw new Error('config is not valid. ' + validationResult.reason);
  }

  const { phases, fetchConfig } = config;
  const stats: Stats[] = [];
  for (const phase of phases) {
    // This is a store all requests that have been kicked off. The store allows
    // us to later await all pending requests. This introduces redundant data
    // because we also have a store for all resolved and rejected requests, but
    // I didn't find an other solution.
    const phaseKickedOffRequests: Promise<QueryResult | Error>[] = [];
    const phaseResolvedRequests: QueryResult[] = [];
    const phaseRejectedRequests: Error[] = [];

    const { arrivalRate, duration, pause } = phase;

    const phaseEndDate = Date.now() + duration * 1000;

    while (Date.now() < phaseEndDate && phaseRejectedRequests.length === 0) {
      // We need to store the date in one second to allow us to break
      // out of the current iteration if the `arrivalRate` can't be reached
      // in one second.
      const dateInOneSecond = Date.now() + 1000;
      for (let i = 0; i < arrivalRate && Date.now() < dateInOneSecond; i++) {
        const kickedOffRequest = executeQuery(fetchConfig)
          .then(response => {
            phaseResolvedRequests.push(response);
            const updatedStats = collectStats(phaseResolvedRequests);
            stats.pop();
            stats.push(updatedStats);
            stream && stream.push(stats);
            return response;
          })
          .catch(error => {
            phaseRejectedRequests.push(error);
            return error;
          });

        phaseKickedOffRequests.push(kickedOffRequest);
      }
      // Once the requests have been kicked off, sleep the remaining fractions of a second.
      const remainingTime = dateInOneSecond - Date.now();
      if (remainingTime > 0) {
        await sleep(remainingTime);
      }
    }

    if (pause) {
      await sleep(pause * 1000);
    }

    await Promise.all(phaseKickedOffRequests);

    if (phaseRejectedRequests.length > 0) throw phaseRejectedRequests[0];
  }

  stream && stream.push(null);
  return stats;
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
    responses,
    averageDurationPerRequest,
    maxDurationPerRequest,
    minDurationPerRequest,
    jitter,
  };
}
