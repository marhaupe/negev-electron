import { execute } from '../executor';

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
    const result = await execute(config);
    expect(result).toBeDefined();
  });
});
