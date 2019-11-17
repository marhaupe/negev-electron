import React, { useRef } from 'react';
import GraphiQL from 'graphiql';
import fetch from 'isomorphic-fetch';
import 'graphiql/graphiql.css';
import { Config } from 'graphql-loadtest-core';
import { Link } from 'react-router-dom';
import { useAppContext } from './context';
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

export function Editor(props: any) {
  const editorRef = useRef(null);
  const { config } = useAppContext();
  async function fetcher(graphQLParams: any) {
    if (graphQLParams.operationName === 'IntrospectionQuery') {
      return defaultFetcher(config.url, graphQLParams);
    }
    return loadtestFetcher({
      ...config,
      body: graphQLParams
    });
  }

  function handleClickPrettifyButton() {
    const editor = (editorRef.current as any).getQueryEditor();
    const currentText = editor.getValue();
    const { parse, print } = require('graphql');
    const prettyText = print(parse(currentText));
    editor.setValue(prettyText);
  }

  return (
    <GraphiQL ref={editorRef} fetcher={fetcher}>
      <GraphiQL.Logo>Custom Logo</GraphiQL.Logo>
      <GraphiQL.Toolbar>
        <GraphiQL.Button onClick={handleClickPrettifyButton} label="Prettify" title="Prettify Query (Shift-Ctrl-P)" />
        <Link to={'/settings'}>
          <GraphiQL.Button label="Settings" title="Open settings page" />
        </Link>
      </GraphiQL.Toolbar>
      <GraphiQL.Footer></GraphiQL.Footer>
    </GraphiQL>
  );
}
