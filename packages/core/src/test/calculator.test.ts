import {
  calculateSum,
  calculateAverage,
  calculateRequestsPerSecond,
  calculateHistogram,
  findNearestBucket,
} from '../calculator';
import { QueryResult, Histogram } from 'types';

it('tests calculate sum', () => {
  expect(calculateSum([1, 2, 3, 4, 5])).toEqual(15);
});

it('tests calculate average', () => {
  expect(calculateAverage([1, 4, 1, 4])).toEqual(2.5);
  expect(calculateAverage([1.005])).toEqual(1.01);
});

it('tests calculate requestsPerSecond', () => {
  expect(calculateRequestsPerSecond(10, 2000)).toEqual(5);
  expect(calculateRequestsPerSecond(2.5, 2500)).toEqual(1);
  expect(calculateRequestsPerSecond(5, 2000)).toEqual(2.5);
});

describe('tests get histogram', () => {
  it('tests with durations that match buckets perfectly', () => {
    const input = [
      buildMockResponse(10),
      buildMockResponse(20),
      buildMockResponse(30),
      buildMockResponse(40),
      buildMockResponse(50),
      buildMockResponse(60),
      buildMockResponse(70),
      buildMockResponse(80),
      buildMockResponse(90),
      buildMockResponse(100),
      buildMockResponse(110),
    ];
    const histogram = calculateHistogram(input as any);
    expect(Object.keys(histogram)).toEqual(['10', '20', '30', '40', '50', '60', '70', '80', '90', '100', '110']);
    expect(Object.values(histogram)).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  });

  it('tests with durations with difference of 1', () => {
    const input = [
      buildMockResponse(1),
      buildMockResponse(2),
      buildMockResponse(3),
      buildMockResponse(4),
      buildMockResponse(5),
      buildMockResponse(6),
      buildMockResponse(7),
      buildMockResponse(8),
      buildMockResponse(9),
      buildMockResponse(10),
      buildMockResponse(11),
    ];
    const histogram = calculateHistogram(input as any);
    expect(Object.keys(histogram)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']);
    expect(Object.values(histogram)).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  });

  it('tests a with random sets and makes sure that outputs seem valid', () => {
    function expectNotNaN(input: Histogram) {
      Object.values(input).forEach(count => {
        expect(count).not.toBeNaN();
      });
    }
    function expectValidTotal(responses: QueryResult[], input: Histogram) {
      let total = 0;
      Object.values(input).forEach(count => (total += count));
      expect(total).toEqual(responses.length);
    }

    let mockResponses = buildMockResponses(500);
    let histogram = calculateHistogram(mockResponses);
    expectNotNaN(histogram);
    expectValidTotal(mockResponses, histogram);

    mockResponses = buildMockResponses(500);
    histogram = calculateHistogram(mockResponses);
    expectNotNaN(histogram);
    expectValidTotal(mockResponses, histogram);

    mockResponses = buildMockResponses(500);
    histogram = calculateHistogram(mockResponses);
    expectNotNaN(histogram);
    expectValidTotal(mockResponses, histogram);

    mockResponses = buildMockResponses(500);
    histogram = calculateHistogram(mockResponses);
    expectNotNaN(histogram);
    expectValidTotal(mockResponses, histogram);
  });

  it('tests findNearestBucket with easy values', () => {
    const histogram = {
      10: 0,
      20: 0,
      30: 0,
    };
    expect(findNearestBucket(histogram, 10)).toEqual(10);
    expect(findNearestBucket(histogram, 20)).toEqual(20);
    expect(findNearestBucket(histogram, 30)).toEqual(30);
  });

  it('tests findNearestBucket with hard values', () => {
    const histogram = {
      10: 0,
      20: 0,
      30: 0,
    };
    expect(findNearestBucket(histogram, 14)).toEqual(10);
    expect(findNearestBucket(histogram, 15)).toEqual(20);
    expect(findNearestBucket(histogram, 16)).toEqual(20);
  });
});

function buildMockResponse(duration: number): QueryResult {
  return {
    duration,
    statusCode: 200,
  };
}

function buildMockResponses(length: number): QueryResult[] {
  const responses: QueryResult[] = [];
  for (let i = 0; i < length; i++) {
    responses.push(buildMockResponse(1 + Math.round(Math.random() * 5000)));
  }

  return responses;
}
