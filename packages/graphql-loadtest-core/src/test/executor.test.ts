import { executeLoadtest, getLoadtestStream } from '../loadtest';
import fetchMock from 'fetch-mock';

describe('tests stream execute', () => {
  beforeEach(() => {
    fetchMock.reset();
  });

  it('tests with invalid endpoint', async done => {
    fetchMock.post('*', Promise.resolve(404));
    const config = {
      phases: [{ arrivalRate: 1, duration: 1 }],
      fetchConfig: {
        body: {
          operationName: undefined,
          query: '{name}',
          variables: null,
        },
        url: 'http://example.com/qry',
      },
    };
    const stream = getLoadtestStream(config);
    stream.on('error', error => {
      expect(error).toBeDefined();
      done();
    });
  });

  it('tests with invalid query', async done => {
    fetchMock.post('*', JSON.stringify({ data: null, errors: ['mockerror'] }));
    const config = {
      phases: [{ arrivalRate: 1, duration: 1 }],
      fetchConfig: {
        body: {
          operationName: undefined,
          query: '{name}',
          variables: null,
        },
        url: 'http://example.com/query',
      },
    };
    const stream = getLoadtestStream(config);
    stream.on('error', error => {
      expect(error).toBeDefined();
      done();
    });
  });
});

describe('tests execute', () => {
  beforeEach(() => {
    fetchMock.reset();
  });

  it('tests that the correct amount of requests are being sent in two seconds', async () => {
    fetchMock.post('*', JSON.stringify({ data: {} }));
    const arrivalRate = 100;
    const duration = 2;
    const config = {
      phases: [{ arrivalRate, duration }],
      fetchConfig: {
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
    expect(result[0].totalRequests).toEqual(arrivalRate * duration);
  });
});
