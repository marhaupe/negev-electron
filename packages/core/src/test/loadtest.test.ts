import { executeLoadtest } from '../loadtest';
import fetchMock from 'fetch-mock';

describe('tests execute happy path', () => {
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
    expect(result.errorDistribution.successCount).toEqual(200);
  });

  it('tests that the correct amount of requests are being sent when ratelimit is set', async () => {
    fetchMock.post('http://marhaupe.test/query', JSON.stringify({ data: {} }));
    const result = await executeLoadtest({
      endpoint: 'http://marhaupe.test/query',
      query: '{ books { author } }',
      numberRequests: 200,
      rateLimit: 190,
    });
    expect(result.errorDistribution.successCount).toEqual(200);
  });

  beforeEach(() => {
    fetchMock.reset();
  });

  it('tests that duration is respected', async () => {
    fetchMock.post('http://marhaupe.test/query', JSON.stringify({ data: {} }));
    const result = await executeLoadtest({
      endpoint: 'http://marhaupe.test/query',
      query: '{ books { author } }',
      duration: 2,
    });
    expect(result.totalDuration).toBeGreaterThanOrEqual(2000);
  });

  it('tests that duration and rateLimit is respected ', async () => {
    fetchMock.post('http://marhaupe.test/query', JSON.stringify({ data: {} }));
    const result = await executeLoadtest({
      endpoint: 'http://marhaupe.test/query',
      query: '{ books { author } }',
      duration: 2,
      rateLimit: 50,
    });

    expect(result.totalDuration).toBeGreaterThanOrEqual(2000);
    expect(result.totalRequests).toBeGreaterThanOrEqual(100);
  });
});
