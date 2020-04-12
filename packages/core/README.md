# @negev/core

[![npm version](https://img.shields.io/npm/v/@negev/core)](https://img.shields.io/npm/v/@negev/core)
[![Build Status](https://travis-ci.com/marhaupe/graphql-loadtest.svg?branch=master)](https://travis-ci.com/marhaupe/graphql-loadtest)
[![codecov](https://codecov.io/gh/marhaupe/negev/branch/master/graph/badge.svg?flag=core)](https://codecov.io/gh/marhaupe/negev)

> Benchmark your GraphQL servers with ease.

## Installation

```bash
npm install @negev/core
```

## Usage

### Config

Depending on your configuration, you can execute a loadtest that runs for a certain amount of time (by setting `duration`) or one that sends a specified amount of requests (by setting `numberRequests`). Note that if both fields are present, `numberRequests` will be ignored.

| Parameter        | Default      | Description                                            |
| ---------------- | ------------ | ------------------------------------------------------ |
| endpoint         | **Required** | The endpoint to test                                   |
| query            | **Required** | The query / mutation to send                           |
| headers          | None         | The headers attached to each request                   |
| rateLimit        | None         | The limit for how many requests are sent per second    |
| concurrencyLimit | 50           | The limit for how many concurrent requests can be sent |
| duration         | 15           | The duration (in seconds) of the loadtest.             |
| numberRequests   | 500          | The count of how many total requests are sent.         |

### Example - `numberRequests`

```js
import { executeLoadtest } from '@negev/core';

const loadtestResult = await executeLoadtest({
  endpoint: 'https://example.com/query',
  query: '{ books { author } }',
  headers: {
    'Content-type': 'application/json',
  },
  numberOfRequests: 1000,
});
```

### Example - `duration`

```js
import { executeLoadtest } from '@negev/core';

const loadtestResult = await executeLoadtest({
  endpoint: 'https://example.com/query',
  query: '{ books { author } }',
  headers: {
    'Content-type': 'application/json',
  },
  duration: 15,
});
```
