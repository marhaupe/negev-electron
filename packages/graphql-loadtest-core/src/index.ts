import { execute } from './executor';

// const config = {
//   phases: [{ arrivalRate: 1, duration: 1 }],
//   fetchParams: {
//     body: {
//       operationName: undefined,
//       query: '{name}',
//       variables: null,
//     },
//     url: 'https://marhaupe.de/query',
//   },
// };

// execute(config).then((res: any) => console.log(res));

// Methods
export { execute };

// Types
export * from './types';
