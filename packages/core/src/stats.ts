import { Stats, QueryResult } from './types';
import {
  calculateTotalDuration,
  calculateAverageDurationPerRequest,
  calculateMinDurationPerRequest,
  calculateMaxDurationPerRequest,
  calculateJitter,
  calculateRequestsPerSecond,
} from './calculator';

export function collectStats(responses: QueryResult[], duration: number): Stats {
  const totalRequests = responses.length;
  const combinedDuration = calculateTotalDuration(responses);
  const averageDurationPerRequest = calculateAverageDurationPerRequest(combinedDuration, totalRequests);

  const minDurationPerRequest = calculateMinDurationPerRequest(responses);
  const maxDurationPerRequest = calculateMaxDurationPerRequest(responses);
  const jitter = calculateJitter(maxDurationPerRequest, minDurationPerRequest, averageDurationPerRequest);
  const requestsPerSecond = calculateRequestsPerSecond(totalRequests, duration);

  return {
    totalRequests,
    averageDurationPerRequest,
    maxDurationPerRequest,
    minDurationPerRequest,
    jitter,
    requestsPerSecond,
  };
}
