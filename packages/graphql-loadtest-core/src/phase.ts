import { QueryResult, Phase, FetchConfig } from './types';
import { executeQuery } from './query';
import { sleep } from './__utils__';

export async function executePhase(phase: Phase, fetchConfig: FetchConfig): Promise<QueryResult[]> {
  // This is a store all requests that have been kicked off. The store allows
  // us to later await all pending requests.
  const kickedOffRequests: Promise<QueryResult | Error>[] = [];
  const { arrivalRate, duration, pause } = phase;

  const phaseEndDate = Date.now() + duration * 1000;

  while (Date.now() < phaseEndDate) {
    // We need to store the date in one second to allow us to break
    // out of the current iteration if the `arrivalRate` can't be reached
    // in one second.
    const dateInOneSecond = Date.now() + 1000;
    for (let i = 0; i < arrivalRate && Date.now() < dateInOneSecond; i = i + 1) {
      const kickedOffRequest = executeQuery(fetchConfig).catch(error => error);
      kickedOffRequests.push(kickedOffRequest);
    }
    // Once the requests have been kicked off, sleep the remaining fractions of a second.
    const remainingTime = dateInOneSecond - Date.now();
    await sleep(remainingTime);
  }

  if (pause) {
    await sleep(pause * 1000);
  }

  const responses = await Promise.all(kickedOffRequests);

  responses.forEach(request => {
    if (request instanceof Error) {
      throw request;
    }
  });

  return responses as QueryResult[];
}
