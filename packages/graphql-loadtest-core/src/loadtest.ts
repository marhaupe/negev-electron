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
    read(_size) {},
  });

  executeLoadtest(config, stream);

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
    // us to later await all pending requests.
    const phaseKickedOffRequests: Promise<QueryResult | Error>[] = [];
    // While this introduces redundant data, this allows us to write the current
    // stats to `stream` each time a single request has been resolved.
    const phaseResolvedRequests: QueryResult[] = [];

    const { arrivalRate, duration, pause } = phase;

    const phaseEndDate = Date.now() + duration * 1000;

    while (Date.now() < phaseEndDate) {
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
            stream && stream.push(JSON.stringify(stats));
            return response;
          })
          .catch(error => error);
        phaseKickedOffRequests.push(kickedOffRequest);
      }
      // Once the requests have been kicked off, sleep the remaining fractions of a second.
      const remainingTime = dateInOneSecond - Date.now();
      await sleep(remainingTime);
    }

    if (pause) {
      await sleep(pause * 1000);
    }

    const responses = await Promise.all(phaseKickedOffRequests);

    responses.forEach(request => {
      if (request instanceof Error) {
        throw request;
      }
    });
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
