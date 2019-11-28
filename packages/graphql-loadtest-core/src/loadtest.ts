import { Config, Stats } from './types';
import { validateConfig } from './validator';
import { executePhase } from './phase';
import {
  calculateTotalDuration,
  calculateAverageDurationPerRequest,
  calculateMinDurationPerRequest,
  calculateMaxDurationPerRequest,
  calculateJitter,
} from './calculator';

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
