import { Request } from 'node-fetch';
import fetchMock from 'fetch-mock';
const { executeRequests } = require('../requester');

const baseRequest = new Request('http://marhaupe.test/graphql', { method: 'POST' });
describe('tests requester', () => {
  beforeEach(() => {
    fetchMock.reset();
  });

  it('tests that the correct amount of requests are sent', () => {
    fetchMock.post('http://marhaupe.test/graphql', JSON.stringify({ data: {} }));
    executeRequests({ request: baseRequest, numberRequests: 1000 }, function(_err: any, res: any) {
      expect(res).toHaveLength(1000);
    });
  });
});
