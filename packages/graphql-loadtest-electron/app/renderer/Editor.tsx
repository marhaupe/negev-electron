import React, { useRef, useState } from 'react';
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
  const [config, setConfig] = useAppContext();

  useState();
  async function fetcher(graphQLParams: any) {
    if (graphQLParams.operationName === 'IntrospectionQuery') {
      return defaultFetcher(config.fetchConfig.url, graphQLParams);
    }
    return loadtestFetcher(config);
  }

  function handleClickPrettifyButton() {
    const editor = (editorRef.current as any).getQueryEditor();
    const currentText = editor.getValue();
    const { parse, print } = require('graphql');
    const prettyText = print(parse(currentText));
    editor.setValue(prettyText);
  }

  // We want our context to be the global source of truth. This introduces redundant data,
  // but this is fine
  function handleEditQuery(value: any) {
    setConfig({
      ...config,
      fetchConfig: {
        ...config.fetchConfig,
        body: value
      }
    });
  }

  return (
    <GraphiQL
      query={config && config.fetchConfig && config.fetchConfig.body}
      onEditQuery={handleEditQuery}
      ref={editorRef}
      fetcher={fetcher}
    >
      <GraphiQL.Logo>graphql-loadtest</GraphiQL.Logo>
      <GraphiQL.Toolbar>
        <input
          name="endpoint"
          className="appearance-none bg-white rounded border focus:border-gray-600 border-gray-400 text-gray-700 mx-2 py-1 px-2 leading-tight focus:outline-none"
          type="text"
          value={config.fetchConfig.url}
          aria-label="Endpoint"
          placeholder="Endpoint"
          onChange={event => setConfig({ ...config, fetchConfig: { ...config.fetchConfig, url: event.target.value } })}
        />
        <GraphiQL.Button onClick={handleClickPrettifyButton} label="Prettify" title="Prettify Query (Shift-Ctrl-P)" />
        <Link to={'/settings'}>
          <GraphiQL.Button label="Settings" title="Open settings page" />
        </Link>
      </GraphiQL.Toolbar>
      <GraphiQL.Footer></GraphiQL.Footer>
    </GraphiQL>
  );
}
