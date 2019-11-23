import { sleep } from './__utils__';
import { Config, Stats, Phase, FetchConfig } from './types';
import {
  calculateJitter,
  calculateTotalDuration,
  calculateAverageDurationPerRequest,
  calculateMinDurationPerRequest,
  calculateMaxDurationPerRequest,
} from './calculator';
import { DecoratedResponse, fetchWithDecoration } from './fetcher';

export async function executeLoadtest(config: Config): Promise<Stats[]> {
  const validationResult = validateConfig(config);
  if (!validationResult.isValid) {
    throw 'config is not valid. ' + validationResult.reason;
  }

  const { phases, fetchConfig } = config;

  const kickedOffRequestsPerPhase: Promise<DecoratedResponse[]>[] = phases.map(phase => {
    return executePhase(phase, fetchConfig);
  });

  const responsesPerPhase = await Promise.all(kickedOffRequestsPerPhase);

  return responsesPerPhase.map(responses => {
    const totalRequests = responses.length;
    const combinedDuration = calculateTotalDuration(responses);
    const averageDurationPerRequest = calculateAverageDurationPerRequest(combinedDuration, totalRequests);

    const minDurationPerRequest = calculateMinDurationPerRequest(responses);
    const maxDurationPerRequest = calculateMaxDurationPerRequest(responses);
    const jitter = calculateJitter(maxDurationPerRequest, minDurationPerRequest, averageDurationPerRequest);

    return {
      totalRequests,
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
  const kickedOffRequests: Promise<DecoratedResponse>[] = [];
  const { arrivalRate, duration, pause } = phase;

  const phaseEndDate = Date.now() + duration * 1000;

  while (Date.now() < phaseEndDate) {
    // We need to store the date in one second to allow us to break
    // out of the current iteration if the `arrivalRate` can't be reached
    // in one second.
    const dateInOneSecond = Date.now() + 1000;
    for (let i = 0; i < arrivalRate && Date.now() < dateInOneSecond; i = i + 1) {
      const kickedOffRequest = fetchWithDecoration(fetchConfig);
      kickedOffRequests.push(kickedOffRequest);
    }
    // Once the requests have been kicked off, sleep the remaining fractions of a second.
    const remainingTime = dateInOneSecond - Date.now();
    await sleep(remainingTime);
  }

  if (pause) {
    await sleep(pause);
  }
  return Promise.all(kickedOffRequests);
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
        reason: 'phases with a duration shorter than one second are currently not supported.',
      };
    }
    if (phase.arrivalRate === 0) {
      return {
        isValid: false,
        reason: 'phases with an arrival rate set to zero are invalid.',
      };
    }
  }
  return { isValid: true };
}
