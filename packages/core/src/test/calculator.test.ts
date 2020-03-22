import { calculateJitter } from '../calculator';

it('tests jitter', () => {
  expect(calculateJitter(70, 50, 60)).toBe(10);
  expect(calculateJitter(80, 50, 60)).toBe(15);
  expect(calculateJitter(124, 63, 91)).toBe(30.5);
  expect(calculateJitter(122, 66, 89)).toBe(28);
});
