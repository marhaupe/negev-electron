import { executeLoadtest } from '../loadtest';
import fetchMock from 'fetch-mock';

describe('tests execute', () => {
  beforeEach(() => {
    fetchMock.reset();
  });

  it('tests that the correct amount of requests are being sent', async () => {
    fetchMock.post('http://marhaupe.test/query', JSON.stringify({ data: {} }));
    const result = await executeLoadtest({
      endpoint: 'http://marhaupe.test/query',
      query: '{ books { author } }',
      numberRequests: 200,
    });
    expect(result.totalRequests).toEqual(200);
  });
});
