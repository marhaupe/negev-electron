import { isError } from '../__utils__';
import VError from 'verror';

it('tests isError', () => {
  expect(isError(new Error('test'))).toBe(true);
  expect(isError(new VError('test'))).toBe(true);
});
