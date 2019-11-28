import { Config, Stats, QueryResult } from './types';
import { validateConfig } from './validator';
import { executePhase } from './phase';
import {
  calculateTotalDuration,
  calculateAverageDurationPerRequest,
  calculateMinDurationPerRequest,
  calculateMaxDurationPerRequest,
  calculateJitter,
} from './calculator';
import Stream from 'stream';

export async function executeStreamingLoadtest(config: Config, stream: Stream.Readable): Promise<void> {
  const validationResult = validateConfig(config);
  if (!validationResult.isValid) {
    throw new Error('config is not valid. ' + validationResult.reason);
  }
  const { phases, fetchConfig } = config;

  for (const phase of phases) {
    const responses = await executePhase(phase, fetchConfig);
    const totalRequests = responses.length;
    const combinedDuration = calculateTotalDuration(responses);
    const averageDurationPerRequest = calculateAverageDurationPerRequest(combinedDuration, totalRequests);

    const minDurationPerRequest = calculateMinDurationPerRequest(responses);
    const maxDurationPerRequest = calculateMaxDurationPerRequest(responses);
    const jitter = calculateJitter(maxDurationPerRequest, minDurationPerRequest, averageDurationPerRequest);
    stream.push(
      JSON.stringify({
        totalRequests,
        responses,
        averageDurationPerRequest,
        maxDurationPerRequest,
        minDurationPerRequest,
        jitter,
      })
    );
  }
  stream.push(null);
}

export async function executeLoadtest(config: Config): Promise<Stats[]> {
  const validationResult = validateConfig(config);
  if (!validationResult.isValid) {
    throw new Error('config is not valid. ' + validationResult.reason);
  }

  const { phases, fetchConfig } = config;

  const responsesPerPhase: QueryResult[][] = [];
  for (const phase of phases) {
    const phaseResult = await executePhase(phase, fetchConfig);
    responsesPerPhase.push(phaseResult);
  }

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
