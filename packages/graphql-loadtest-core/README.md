# graphql-loadtest

This library allows you to benchmark your graphql-backend.

## Installation

```bash
npm install graphql-loadtest
```

## Usage

```js
import { executeLoadtest } from 'graphql-loadtest';

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
```
