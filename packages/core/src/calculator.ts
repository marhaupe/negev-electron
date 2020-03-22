import { QueryResult } from './types';

export function calculateJitter(
  maxDurationPerRequest: number,
  minDurationPerRequest: number,
  averageDurationPerRequest: number
) {
  const jitterTop = maxDurationPerRequest - averageDurationPerRequest;
  const jitterBottom = averageDurationPerRequest - minDurationPerRequest;
  return roundDecimalPlaces((jitterBottom + jitterTop) / 2, 2);
}

export function calculateMinDurationPerRequest(responses: QueryResult[]): number {
  return Math.min(...responses.map(response => response.duration));
}

export function calculateMaxDurationPerRequest(responses: QueryResult[]): number {
  return Math.max(...responses.map(response => response.duration));
}

export function calculateAverageDurationPerRequest(combinedDuration: number, durationCount: number): number {
  return roundDecimalPlaces(((combinedDuration / durationCount) * 100) / 100, 2);
}

export function calculateTotalDuration(responses: QueryResult[]): number {
  let combinedDuration = 0;
  responses.forEach(response => (combinedDuration += response.duration));
  return combinedDuration;
}

function roundDecimalPlaces(num: number, count: number) {
  const x = Math.pow(10, count);
  return Math.round(num * x) / x;
}
