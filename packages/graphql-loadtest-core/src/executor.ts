import { sleep } from './__utils__';
import fetch from 'node-fetch';
import { FetchParams, Config, Stats } from './types';

export async function execute({ phases, fetchParams }: Config): Promise<Stats> {
  // This is a store all requests that have been kicked off.
  // This allows us to later await all pending requests.
  const kickedOffRequests: Promise<LoadTestResponse>[] = [];

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
  const responses = await Promise.all(kickedOffRequests);
  let completeDuration = 0;
  responses.forEach(response => (completeDuration += response.duration));

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

type LoadTestResponse = {
  json: any;
  duration: number;
};
export async function fetchResponse({
  url,
  headers,
  body,
}: FetchParams): Promise<LoadTestResponse> {
  const startDate = Date.now();

  const response = await fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

  const endDate = Date.now();
  const duration = endDate - startDate;
  const json = await response.json();

  return {
    json,
    duration,
  };
}
