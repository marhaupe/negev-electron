// Our output should look similar to the one of `hey`:

import { Stats, QueryResult } from './types';
import {
  calculateTotalDuration,
  calculateAverageDuration,
  findFastestRequest,
  findSlowestRequest,
  calculateRequestsPerSecond,
  calculateHistogram,
  calculateLatencyDistribution,
  calculateErrorDistribution,
} from './calculator';

export function collectStats(responses: QueryResult[], totalDuration: number): Stats {
  const totalRequests = responses.length;
  const combinedDuration = calculateTotalDuration(responses);
  const averageDurationPerRequest = calculateAverageDuration(combinedDuration, totalRequests);

  const minDurationPerRequest = findFastestRequest(responses);
  const maxDurationPerRequest = findSlowestRequest(responses);
  const requestsPerSecond = calculateRequestsPerSecond(totalRequests, totalDuration);

  const histogram = calculateHistogram(responses);
  const latencyDistribution = calculateLatencyDistribution(responses);
  const errorDistribution = calculateErrorDistribution(responses);

  return {
    totalRequests,
    average: averageDurationPerRequest,
    slowest: maxDurationPerRequest,
    fastest: minDurationPerRequest,
    requestsPerSecond,
    totalDuration,
    latencyDistribution,
    errorDistribution,
    histogram,
  };
}
