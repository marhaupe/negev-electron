import { getChunks } from '../requester';

it('tests getChunks', () => {
  expect(getChunks(180)).toEqual([180]);
  expect(getChunks(360, 180)).toEqual([180, 180]);
  expect(getChunks(400, 180)).toEqual([180, 180, 40]);
  expect(getChunks(181, 180)).toEqual([180, 1]);
  expect(getChunks(179, 180)).toEqual([179]);
});
