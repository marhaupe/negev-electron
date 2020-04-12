# @negev/cli

[![npm version](https://img.shields.io/npm/v/@negev/cli)](https://img.shields.io/npm/v/@negev/cli)
[![Build Status](https://travis-ci.com/marhaupe/graphql-loadtest.svg?branch=master)](https://travis-ci.com/marhaupe/graphql-loadtest)

<!-- [![codecov](https://codecov.io/gh/marhaupe/negev/branch/master/graph/badge.svg?flag=core)](https://codecov.io/gh/marhaupe/negev) -->

> Benchmark your GraphQL servers with ease.

## Installation

```bash
npm install -g @negev/cli
```

![Demo](.github/demo.gif)

# Usage

```bash
$ negev --help

Benchmark your GraphQL servers with ease.

USAGE
  $ negev

OPTIONS
  -H, --headers=headers                    request header. can be set multiple times. example: -H="Content-Type: application/json"
  -c, --concurrencyLimit=concurrencyLimit  the limit of concurrent requests
  -d, --duration=duration                  the total duration of the loadtest
  -e, --endpoint=endpoint                  the endpoint to test
  -h, --help                               show CLI help
  -n, --numberRequests=numberRequests      the number of requests to send
  -q, --query=query                        the query to use
  -r, --rateLimit=rateLimit                the limit of requests per second
  -v, --version                            show CLI version

EXAMPLES
  $ negev    # Will run the command in prompt-mode
  $ negev -e="http://localhost:4000" -q="{ books { author } }"   # Will immediately start a loadtest with the given configuration
```
