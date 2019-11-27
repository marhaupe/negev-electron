import { sleep } from './__utils__';
import { Config, Stats, Phase, FetchConfig, DecoratedResponse } from './types';
import {
  calculateJitter,
  calculateTotalDuration,
  calculateAverageDurationPerRequest,
  calculateMinDurationPerRequest,
  calculateMaxDurationPerRequest,
} from './calculator';
import { fetchWithDecoration } from './fetcher';

export async function executeLoadtest(config: Config): Promise<Stats[]> {
  const validationResult = validateConfig(config);
  if (!validationResult.isValid) {
    throw new Error('config is not valid. ' + validationResult.reason);
  }

  const { phases, fetchConfig } = config;

  const responsesPerPhase = await Promise.all(
    phases.map(async phase => {
      return await executePhase(phase, fetchConfig);
    })
  );

  return responsesPerPhase.map(responses => {
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
  });
}

async function executePhase(phase: Phase, fetchConfig: FetchConfig): Promise<DecoratedResponse[]> {
  // This is a store all requests that have been kicked off. The store allows
  // us to later await all pending requests.
  const kickedOffRequests: Promise<DecoratedResponse | Error>[] = [];
  const { arrivalRate, duration, pause } = phase;

  const phaseEndDate = Date.now() + duration * 1000;

  while (Date.now() < phaseEndDate) {
    // We need to store the date in one second to allow us to break
    // out of the current iteration if the `arrivalRate` can't be reached
    // in one second.
    const dateInOneSecond = Date.now() + 1000;
    for (let i = 0; i < arrivalRate && Date.now() < dateInOneSecond; i = i + 1) {
      const kickedOffRequest = fetchWithDecoration(fetchConfig).catch(error => error);
      kickedOffRequests.push(kickedOffRequest);
    }
    // Once the requests have been kicked off, sleep the remaining fractions of a second.
    const remainingTime = dateInOneSecond - Date.now();
    await sleep(remainingTime);
  }

  if (pause) {
    await sleep(pause);
  }

  const responses = await Promise.all(kickedOffRequests);

  responses.forEach(request => {
    if (request instanceof Error) {
      throw request;
    }
  });

  return responses as DecoratedResponse[];
}

type ValidationResult = {
  isValid: boolean;
  reason?: string;
};

function validateConfig(config: Config): ValidationResult {
  for (const phase of config.phases) {
    if (phase.duration < 1) {
      return {
        isValid: false,
        reason: 'phases with a duration shorter than one second are not supported.',
      };
    }
    if (phase.arrivalRate < 1) {
      return {
        isValid: false,
        reason: 'phases with an arrival rate smaller than one are not supported.',
      };
    }
  }
  return { isValid: true };
}
