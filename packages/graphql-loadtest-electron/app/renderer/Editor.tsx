import React from 'react';
import GraphiQL from 'graphiql';
import fetch from 'isomorphic-fetch';
import { usePersistedState } from './__utils__';
import 'graphiql/graphiql.css';
import { Config } from 'graphql-loadtest-core';
const { ipcRenderer } = window.require('electron');

async function defaultFetcher(endpoint: string, graphQLParams: any) {
  try {
    const response = await fetch(endpoint, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphQLParams)
    });
    return await response.json();
  } catch (error) {
    return {};
  }
}

async function loadtestFetcher(config: Config) {
  return new Promise((resolve, _reject) => {
    ipcRenderer.send('loadtestFetcher-request', config);
    ipcRenderer.once('loadtestFetcher-request', (_event: any, arg: any) => {
      resolve(arg);
    });
  });
}

export function Editor() {
  const [endpoint, setEndpoint] = usePersistedState('endpoint', '');
  const [duration, setDuration] = usePersistedState('duration', 5);
  const [arrivalRate, setArrivalRate] = usePersistedState('arrivalRate', 20);

  async function fetcher(graphQLParams: any) {
    if (graphQLParams.operationName === 'IntrospectionQuery') {
      return defaultFetcher(endpoint, graphQLParams);
    }
    return loadtestFetcher({
      fetchParams: { url: endpoint, body: graphQLParams },
      phases: [{ arrivalRate, duration }]
    });
  }

  return (
    <GraphiQL fetcher={fetcher}>
      <GraphiQL.Logo>Custom Logo</GraphiQL.Logo>
      <GraphiQL.Toolbar>
        <GraphiQL.Button
          // onClick={this.handleClickPrettifyButton}
          label="Prettify"
          title="Prettify Query (Shift-Ctrl-P)"
        />

        <GraphiQL.Menu label="File" title="File">
          <GraphiQL.MenuItem label="Save" title="Save" onSelect={() => {}} />
        </GraphiQL.Menu>

        <input value={endpoint} placeholder={'Endpoint'} onChange={event => setEndpoint(event.target.value)} />
        <input
          value={duration}
          placeholder={'Duration (in seconds)'}
          type={'number'}
          onChange={event => setDuration(parseInt(event.target.value))}
        />
        <input
          value={arrivalRate}
          placeholder={'Arrival Rate (per second)'}
          type={'number'}
          onChange={event => setArrivalRate(parseInt(event.target.value))}
        />
      </GraphiQL.Toolbar>
      <GraphiQL.Footer></GraphiQL.Footer>
    </GraphiQL>
  );
}
