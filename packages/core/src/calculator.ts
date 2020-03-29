import { QueryResult, Histogram, LatencyDistribution, ErrorDistribution } from './types';

export function findFastestRequest(responses: QueryResult[]): number {
  return Math.min(...responses.map(response => response.duration));
}

export function findSlowestRequest(responses: QueryResult[]): number {
  return Math.max(...responses.map(response => response.duration));
}

export function calculateAverageDuration(combinedDuration: number, durationCount: number): number {
  return roundDecimalPlaces(((combinedDuration / durationCount) * 100) / 100, 2);
}

export function calculateTotalDuration(responses: QueryResult[]): number {
  let combinedDuration = 0;
  responses.forEach(response => (combinedDuration += response.duration));
  return combinedDuration;
}

function roundDecimalPlaces(num: number, count: number) {
  const x = Math.pow(10, count);
  return Math.round((num + Number.EPSILON) * x) / x;
}

export function calculateSum(args: number[]) {
  return args.reduce((accumulator, current) => accumulator + current);
}

export function calculateAverage(args: number[]) {
  return roundDecimalPlaces(calculateSum(args) / args.length, 2);
}

export function calculateRequestsPerSecond(requestCount: number, durationMS: number): number {
  return roundDecimalPlaces(requestCount / (durationMS / 1000), 2);
}

// TODO: NaN with 5000 requests not limited
export function calculateHistogram(responses: QueryResult[]): Histogram {
  if (responses.length === 0) {
    return {};
  }
  if (responses.length === 1) {
    return {
      [responses[0].duration]: 1,
    };
  }
  const BUCKET_COUNT = 10;
  const slowest = findSlowestRequest(responses);
  const fastest = findFastestRequest(responses);
  const bucketSize = Math.round((slowest - fastest) / BUCKET_COUNT);

  const histogram: Histogram = {};
  for (let i = 0; i <= BUCKET_COUNT; i++) {
    histogram[fastest + bucketSize * i] = 0;
  }

  responses.forEach(response => {
    const nearestBucket = findNearestBucket(histogram, response.duration);
    histogram[nearestBucket]++;
  });

  return histogram;
}

export function findNearestBucket(histogram: Histogram, duration: number): number {
  const buckets = Object.keys(histogram);

  if (buckets.findIndex(bucket => parseInt(bucket, 10) === duration) >= 0) {
    return duration;
  }

  let indexOfLargerBucket = buckets.findIndex(bucket => parseInt(bucket, 10) > duration);
  let indexOfSmallerBucket = indexOfLargerBucket - 1;

  const slowerDuration = parseInt(buckets[indexOfLargerBucket]);
  const fasterDuration = parseInt(buckets[indexOfSmallerBucket]);
  const meanDuration = (slowerDuration + fasterDuration) / 2;
  if (meanDuration > duration) {
    return fasterDuration;
  } else {
    return slowerDuration;
  }
}

export function calculateLatencyDistribution(responses: QueryResult[]): LatencyDistribution {
  const sortedResponses = responses.sort((a, b) => a.duration - b.duration);

  const tenthPercentile = getIndexForPercentile(0.1, sortedResponses.length);
  const twentyFifthPercentile = getIndexForPercentile(0.25, sortedResponses.length);
  const seventyFifthPercentile = getIndexForPercentile(0.5, sortedResponses.length);
  const fiftithPercentile = getIndexForPercentile(0.5, sortedResponses.length);
  const ninetithPercentile = getIndexForPercentile(0.9, sortedResponses.length);
  const ninetyFifthPercentile = getIndexForPercentile(0.95, sortedResponses.length);
  const ninetyNinthPercentile = getIndexForPercentile(0.99, sortedResponses.length);

  return {
    '10': sortedResponses[tenthPercentile].duration,
    '25': sortedResponses[twentyFifthPercentile].duration,
    '50': sortedResponses[fiftithPercentile].duration,
    '75': sortedResponses[seventyFifthPercentile].duration,
    '90': sortedResponses[ninetithPercentile].duration,
    '95': sortedResponses[ninetyFifthPercentile].duration,
    '99': sortedResponses[ninetyNinthPercentile].duration,
  };
}

function getIndexForPercentile(percentile: number, length: number): number {
  return Math.round(percentile * (length + 1));
}

export function calculateErrorDistribution(responses: QueryResult[]): ErrorDistribution {
  const errorCount = responses.filter(response => response.errors || response.statusCode !== 200).length;
  const successCount = responses.length - errorCount;
  const errorDistribution: ErrorDistribution = {
    errorCount,
    successCount,
  };
  return errorDistribution;
}
