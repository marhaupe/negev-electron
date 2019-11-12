import { executeLoadtest } from '../executor';

describe('tests execute', () => {
  it('tests with a basic configuration', async () => {
    const config = {
      phases: [{ arrivalRate: 1, duration: 1 }],
      fetchParams: {
        body: {
          operationName: undefined,
          query: '{name}',
          variables: null,
        },
        url: 'http://example.com/query',
      },
    };
    const result = await executeLoadtest(config);
    expect(result).toBeDefined();
  });

  it('tests that the correct amount of requests are being sent in one second', async () => {
    const arrivalRate = 100;
    const config = {
      phases: [{ arrivalRate, duration: 1 }],
      fetchParams: {
        body: {
          operationName: undefined,
          query: '{name}',
          variables: null,
        },
        url: 'http://example.com/query',
      },
    };
    const result = await executeLoadtest(config);
    expect(result).toBeDefined();
    expect(result.totalRequests).toEqual(arrivalRate);
  });

  it('tests that the correct amount of requests are being sent in two seconds', async () => {
    const arrivalRate = 100;
    const duration = 2;
    const config = {
      phases: [{ arrivalRate, duration }],
      fetchParams: {
        body: {
          operationName: undefined,
          query: '{name}',
          variables: null,
        },
        url: 'http://example.com/query',
      },
    };
    const result = await executeLoadtest(config);
    expect(result).toBeDefined();
    expect(result.totalRequests).toEqual(arrivalRate * duration);
  });
});
