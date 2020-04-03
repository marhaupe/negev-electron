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
import { isError } from './__utils__';

export function collectStats(responses: (QueryResult | Error)[], totalDuration: number): Stats {
  const errors = responses.filter(response => isError(response)) as Error[];
  const queryResults = responses.filter(response => !isError(response)) as QueryResult[];

  const totalRequests = responses.length;
  const combinedDuration = calculateTotalDuration(queryResults);
  const averageDurationPerRequest = calculateAverageDuration(combinedDuration, totalRequests);

  const minDurationPerRequest = findFastestRequest(queryResults);
  const maxDurationPerRequest = findSlowestRequest(queryResults);
  const requestsPerSecond = calculateRequestsPerSecond(totalRequests, totalDuration);

  const histogram = calculateHistogram(queryResults);
  const latencyDistribution = calculateLatencyDistribution(queryResults);
  const errorDistribution = calculateErrorDistribution(queryResults, errors);

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
