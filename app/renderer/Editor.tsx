import React, { useState } from 'react';
import GraphiQL from 'graphiql';
import fetch from 'isomorphic-fetch';
import 'graphiql/graphiql.css';

function usePersistedState<S>(key: string, initialState: S | (() => S)): [S, (value: S) => void] {
  const [state, setState] = useState(() => {
    return getPersistedState(initialState);
  });

  function getPersistedState(initialState: S | (() => S)) {
    const persistedState = window.localStorage.getItem(key);
    if (!persistedState) {
      if (typeof initialState !== 'function') {
        return initialState;
      }
      return (initialState as () => S)();
    }
    return JSON.parse(persistedState);
  }

  function setPersistedState(value: S) {
    window.localStorage.setItem(key, JSON.stringify(value));
    setState(value);
  }

  return [state, setPersistedState];
}

function calculateSum(args: number[]) {
  return args.reduce((accumulator, current) => accumulator + current);
}

function calculateAverage(args: number[]) {
  return Math.round(calculateSum(args) / args.length);
}

export function Editor() {
  const [endpoint, setEndpoint] = usePersistedState('endpoint', '');
  const [counts, setCount] = usePersistedState('counts', 100);
  const [cycles, setCycles] = usePersistedState('cycles', 5);

  async function fetcher(graphQLParams: any) {
    const response = await fetch(endpoint, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphQLParams)
    });
    return await response.json();
  }

  async function fetcherBenchmarker(graphQLParams: any) {
    if (graphQLParams.operationName === 'IntrospectionQuery') {
      return fetcher(graphQLParams);
    }

    let mostRecentResponseBody: any;
    const elapsedTimes = [];
    for (let cycle = 0; cycle < cycles; cycle++) {
      const cycleElapsedTimes = [];
      for (let count = 0; count < counts; count++) {
        const timeStart = Date.now();

        // ony assign mostRecentReponseBody at the end of the loop to be more efficient
        if (cycle === cycles - 1 && count === counts - 1) {
          mostRecentResponseBody = await fetcher(graphQLParams);
        } else {
          await fetcher(graphQLParams);
        }

        const timeEnd = Date.now();
        const timeElapsed = timeEnd - timeStart;
        cycleElapsedTimes.push(timeElapsed);
      }
      elapsedTimes.push(cycleElapsedTimes);
    }

    let totalDuration = 0;
    for (let i = 0; i < elapsedTimes.length; i++) {
      const cycleElapsedTimes = elapsedTimes[i];
      const cycleDuration = calculateSum(cycleElapsedTimes);
      const cycleAverage = calculateAverage(cycleElapsedTimes);
      console.log(`total duration for cycle ${i + 1}: ${cycleDuration}ms`);
      console.log(`average duration for cycle ${i + 1}: ${cycleAverage}ms`);
      totalDuration += cycleDuration;
    }
    console.log(`benchmarking took ${totalDuration}ms for ${counts} requests over ${cycles} cycles`);
    return mostRecentResponseBody;
  }

  return (
    <GraphiQL fetcher={fetcherBenchmarker}>
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

        <input value={endpoint} onChange={event => setEndpoint(event.target.value)} />
        <input value={counts} type={'number'} onChange={event => setCount(parseInt(event.target.value))} />
        <input value={cycles} type={'number'} onChange={event => setCycles(parseInt(event.target.value))} />
      </GraphiQL.Toolbar>
      <GraphiQL.Footer></GraphiQL.Footer>
    </GraphiQL>
  );
}
