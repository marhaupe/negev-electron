import { QueryResult, Histogram, LatencyDistribution, ErrorDistribution } from './types';

export function findFastestRequest(responses: QueryResult[]): number {
  return Math.min(...responses.map((response) => response.duration));
}

export function findSlowestRequest(responses: QueryResult[]): number {
  return Math.max(...responses.map((response) => response.duration));
}

export function calculateAverageDuration(responses: QueryResult[]): number {
  let combinedDuration = 0;
  responses.forEach((response) => (combinedDuration += response.duration));
  return roundDecimalPlaces(combinedDuration / responses.length, 2);
}

export function calculateTotalDuration(responses: QueryResult[]): number {
  let combinedDuration = 0;
  responses.forEach((response) => (combinedDuration += response.duration));
  return combinedDuration;
}

function roundDecimalPlaces(num: number, count: number) {
  const x = Math.pow(10, count);
  return Math.round((num + Number.EPSILON) * x) / x;
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

  responses.forEach((response) => {
    const nearestBucket = findNearestBucket(histogram, response.duration);
    if (isNaN(nearestBucket)) {
      console.warn(
        `The nearest histogram bucket for the duration ${response.duration} is NaN. ` +
          `Feel free to open an issue at https://github.com/marhaupe/graphql-loadtest with the following information:\n` +
          `Duration: ${response.duration}, Histogram: ${JSON.stringify(histogram, null, 2)}`
      );
    }
    histogram[nearestBucket]++;
  });

  return histogram;
}

export function findNearestBucket(histogram: Histogram, duration: number): number {
  const buckets = Object.keys(histogram).map((bucket) => parseInt(bucket, 10));

  if (buckets.find((bucket) => bucket === duration)) {
    return duration;
  }

  if (duration <= buckets[0]) {
    return buckets[0];
  }

  if (duration >= buckets[buckets.length - 1]) {
    return buckets[buckets.length - 1];
  }

  let indexOfLargerBucket = buckets.findIndex((bucket) => bucket > duration);
  let indexOfSmallerBucket = indexOfLargerBucket - 1;

  const slowerDuration = buckets[indexOfLargerBucket];
  const fasterDuration = buckets[indexOfSmallerBucket];
  const meanDuration = (slowerDuration + fasterDuration) / 2;
  if (meanDuration > duration) {
    return fasterDuration;
  } else {
    return slowerDuration;
  }
}

export function calculateLatencyDistribution(responses: QueryResult[]): LatencyDistribution {
  const sortedResponses = responses.map((response) => response.duration).sort((a, b) => a - b);
  const tenthPercentile = getPercentile(1, sortedResponses);
  const twentyFifthPercentile = getPercentile(25, sortedResponses);
  const fiftithPercentile = getPercentile(5, sortedResponses);
  const seventyFifthPercentile = getPercentile(75, sortedResponses);
  const ninetithPercentile = getPercentile(90, sortedResponses);
  const ninetyFifthPercentile = getPercentile(95, sortedResponses);
  const ninetyNinthPercentile = getPercentile(99, sortedResponses);

  const distribution: LatencyDistribution = {
    [10]: tenthPercentile,
    [25]: twentyFifthPercentile,
    [50]: fiftithPercentile,
    [75]: seventyFifthPercentile,
    [90]: ninetithPercentile,
    [95]: ninetyFifthPercentile,
    [99]: ninetyNinthPercentile,
  };
  return distribution;
}

function getPercentile(percentile: number, array: number[]): number {
  const index = (percentile / 100) * (array.length - 1);
  const flooredIndex = Math.floor(index);
  if (Math.floor(index) == index) {
    return array[index];
  }
  const fraction = index - flooredIndex;
  return array[flooredIndex] + (array[flooredIndex + 1] - array[flooredIndex]) * fraction;
}

export function calculateErrorDistribution(responses: QueryResult[], errors: Error[]): ErrorDistribution {
  let errorCount = responses.filter((response) => response.errors || response.statusCode !== 200).length;
  errorCount += errors.length;

  const successCount = responses.length + errors.length - errorCount;
  const errorDistribution: ErrorDistribution = {
    errorCount,
    successCount,
  };
  return errorDistribution;
}
