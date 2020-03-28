import { calculateJitter, calculateSum, calculateAverage, calculateRequestsPerSecond } from '../calculator';

it('tests jitter', () => {
  expect(calculateJitter(70, 50, 60)).toBe(10);
  expect(calculateJitter(80, 50, 60)).toBe(15);
  expect(calculateJitter(124, 63, 91)).toBe(30.5);
  expect(calculateJitter(122, 66, 89)).toBe(28);
});

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
