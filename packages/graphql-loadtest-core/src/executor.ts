import { sleep } from './__utils__';
import { Config, Stats } from './types';
import {
  calculateJitter,
  calculateTotalDuration,
  calculateAverageDurationPerRequest,
  calculateMinDurationPerRequest,
  calculateMaxDurationPerRequest,
} from './calculator';
import { DecoratedResponse, fetchWithDecoration } from './fetcher';

export async function execute({ phases, fetchParams }: Config): Promise<Stats> {
  // This is a store all requests that have been kicked off.
  // This allows us to later await all pending requests.
  const kickedOffRequests: Promise<DecoratedResponse>[] = [];

  for (const phase of phases) {
    const { arrivalRate, duration, pause } = phase;

    const phaseEndDate = Date.now() + duration * 1000;
    while (Date.now() < phaseEndDate) {
      // `dateInOneSecond` stores the date advanced by one second.
      // This allows us to kick off $arrivalRate requests per second.
      const dateInOneSecond = Date.now() + 1000;
      for (let i = 0; i < arrivalRate && Date.now() < dateInOneSecond; i = i + 1) {
        const kickedOffRequest = fetchWithDecoration(fetchParams);
        kickedOffRequests.push(kickedOffRequest);
      }
      // Once the requests have been kick off, sleep the remaining fractions of a second.
      const remainingTime = dateInOneSecond - Date.now();
      await sleep(remainingTime);
    }

    if (pause) {
      await sleep(pause);
    }
  }
  const responses = await Promise.all(kickedOffRequests);

  const totalRequests = kickedOffRequests.length;
  const totalDuration = calculateTotalDuration(responses);
  const averageDurationPerRequest = calculateAverageDurationPerRequest(totalDuration, totalRequests);

  const minDurationPerRequest = calculateMinDurationPerRequest(responses);
  const maxDurationPerRequest = calculateMaxDurationPerRequest(responses);
  const jitter = calculateJitter(minDurationPerRequest, maxDurationPerRequest, totalRequests);

  return {
    totalDuration,
    totalRequests,
    averageDurationPerRequest,
    maxDurationPerRequest,
    minDurationPerRequest,
    jitter,
  };
}
