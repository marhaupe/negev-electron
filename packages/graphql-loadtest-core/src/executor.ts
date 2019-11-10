import { sleep } from './__utils__';
import fetch from 'node-fetch';

type Phase = {
  /**
   * Configures how many requests arrive per second.
   */
  arrivalRate: number;
  /**
   * Configures the duration of the phase in seconds.
   */
  duration: number;

  /**
   * Configures the duration of the pause after the phase.
   */
  pause?: number;

  /**
   * TODO: This might be a nifty functionality
   * Configures the amount of new requests that are being sent at the end of the phase. The number of requests
   * increase linearly over the time of the phase.
   */
  // rampTo: number;
};

type Config = {
  /**
   * Configures the phase.
   */
  phases: Phase[];
  /**
   * Configures the params being passed to the `fetch`-Requests.
   */
  fetchParams: FetchParams;
};

type Stats = {
  completeDuration: number;
  maxDurationPerRequest: number;
  minDurationPerRequest: number;
  averageDurationPerRequest: number;
};

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

type FetchParams = {
  /**
   * Configures the headers being added to the requests.
   */
  headers?: Record<string, string>;
  /**
   * Configures the query / mutation being sent.
   */
  body: {
    query: string;
    operationName?: string;
    variables?: any;
  };
  /**
   * Configures the url under test.
   */
  url: string;
};

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
