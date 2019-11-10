import { DecoratedResponse } from './fetcher';

export function calculateJitter(min: number, max: number, denominator: number): number {
  return (max - min) / denominator;
}

export function calculateMinDurationPerRequest(responses: DecoratedResponse[]): number {
  return Math.min(...responses.map(response => response.duration));
}
export function calculateMaxDurationPerRequest(responses: DecoratedResponse[]): number {
  return Math.max(...responses.map(response => response.duration));
}

export function calculateAverageDurationPerRequest(totalDuration: number, durationCount: number): number {
  return Math.round(totalDuration / durationCount);
}

export function calculateTotalDuration(responses: DecoratedResponse[]): number {
  let totalDuration = 0;
  responses.forEach(response => (totalDuration += response.duration));
  return totalDuration;
}
