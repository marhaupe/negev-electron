import { sleep } from './__utils__';
import fetch from 'node-fetch';
import { FetchParams, Config, Stats } from './types';

export async function execute({ phases, fetchParams }: Config): Promise<Stats> {
  const executionBeginDate = Date.now();
  // This is a store all requests that have been kicked off.
  // This allows us to later await all pending requests.
  const kickedOffRequests: Promise<any>[] = [];

  for (const phase of phases) {
    const { arrivalRate, duration, pause } = phase;

    const phaseEndDate = Date.now() + duration * 1000;
    while (Date.now() < phaseEndDate) {
      // `dateInOneSecond` stores the date advanced by one second.
      // This allows us to kick off $arrivalRate requests per second.
      const dateInOneSecond = Date.now() + 1000;
      for (
        let i = 0;
        i < arrivalRate && Date.now() < dateInOneSecond;
        i = i + 1
      ) {
        const kickedOffRequest = fetchResponse(fetchParams);
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
  await Promise.all(kickedOffRequests);
  const executionEndDate = Date.now();
  const completeDuration = executionEndDate - executionBeginDate;

  // TODO: This is wrong because it accounts the time slept during each phase, e.g when `remainingTime`
  // is greater than zero after kicking of the requests.
  const averageDurationPerRequest = Math.round(
    completeDuration / kickedOffRequests.length
  );

  return {
    completeDuration,
    averageDurationPerRequest,
    maxDurationPerRequest: 0,
    minDurationPerRequest: 0,
  };
}

export async function fetchResponse({
  url,
  headers,
  body,
}: FetchParams): Promise<any> {
  const response = await fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
  return await response.json();
}
