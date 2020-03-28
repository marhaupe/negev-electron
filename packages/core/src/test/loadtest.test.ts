import { executeLoadtest, getChunks } from '../loadtest';
import fetchMock from 'fetch-mock';

describe('tests execute', () => {
  beforeEach(() => {
    fetchMock.reset();
  });

  it('tests that the correct amount of requests are being sent when no ratelimit is set', async () => {
    fetchMock.post('http://marhaupe.test/query', JSON.stringify({ data: {} }));
    const result = await executeLoadtest({
      endpoint: 'http://marhaupe.test/query',
      query: '{ books { author } }',
      numberRequests: 200,
    });
    expect(result.totalRequests).toEqual(200);
  });

  it('tests that the correct amount of requests are being sent when ratelimit is set', async () => {
    fetchMock.post('http://marhaupe.test/query', JSON.stringify({ data: {} }));
    const result = await executeLoadtest({
      endpoint: 'http://marhaupe.test/query',
      query: '{ books { author } }',
      numberRequests: 200,
      rateLimit: 190,
    });
    expect(result.totalRequests).toEqual(200);
  });

  it('tests getChunks', () => {
    expect(getChunks(180)).toEqual([180]);
    expect(getChunks(360, 180)).toEqual([180, 180]);
    expect(getChunks(400, 180)).toEqual([180, 180, 40]);
    expect(getChunks(181, 180)).toEqual([180, 1]);
    expect(getChunks(179, 180)).toEqual([179]);
  });
});
