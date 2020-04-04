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
  const errors = responses.filter((response) => isError(response)) as Error[];
  const queryResults = responses.filter((response) => !isError(response)) as QueryResult[];

  const totalRequests = responses.length;
  const combinedDuration = calculateTotalDuration(queryResults);
  const average = calculateAverageDuration(combinedDuration, totalRequests);

  const fastest = findFastestRequest(queryResults);
  const slowest = findSlowestRequest(queryResults);
  const requestsPerSecond = calculateRequestsPerSecond(totalRequests, totalDuration);

  const histogram = calculateHistogram(queryResults);
  const latencyDistribution = calculateLatencyDistribution(queryResults);
  const errorDistribution = calculateErrorDistribution(queryResults, errors);

  return {
    totalRequests,
    average,
    slowest,
    fastest,
    requestsPerSecond,
    totalDuration,
    latencyDistribution,
    errorDistribution,
    histogram,
  };
}
