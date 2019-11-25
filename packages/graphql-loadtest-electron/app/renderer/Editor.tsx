import React, { useRef } from 'react';
import GraphiQL from 'graphiql';
import fetch from 'isomorphic-fetch';
import 'graphiql/graphiql.css';
import { Config, Stats } from 'graphql-loadtest-core';
import { Link } from 'react-router-dom';
import { useAppConfigContext, useAppStatsContext } from './context';
import './editor.css';
const { ipcRenderer } = window.require('electron');

export function Editor() {
  const editorRef = useRef(null);
  const [config, setConfig] = useAppConfigContext();
  const [stats, setStats] = useAppStatsContext();

  return (
    <GraphiQL
      query={config && config.fetchConfig && config.fetchConfig.body.query}
      onEditQuery={handleEditQuery}
      ref={editorRef}
      fetcher={handleFetch}
      editorTheme="material-palenight"
    >
      <GraphiQL.Logo>
        <img alt="graphql-loadtest icon" src={require('../../build/icon.ico')} />
      </GraphiQL.Logo>
      <GraphiQL.Toolbar>
        <GraphiQL.Button onClick={handleClickPrettifyButton} label="Prettify" title="Prettify Query (Shift-Ctrl-P)" />
        <input
          name="endpoint"
          className="appearance-none bg-white flex-1 rounded border focus:border-gray-600 border-gray-400 text-gray-700 mx-2 px-3 focus:outline-none width-32"
          type="text"
          value={config.fetchConfig.url}
          aria-label="Endpoint"
          placeholder="Endpoint"
          onChange={event => setConfig({ ...config, fetchConfig: { ...config.fetchConfig, url: event.target.value } })}
        />
        <Link to={'/result'}>
          <GraphiQL.Button label="Result" title="Open result page" />
        </Link>
        <Link to={'/settings'}>
          <GraphiQL.Button label="Settings" title="Open settings page" />
        </Link>
        <GraphiQL.Button onClick={handleClickExportButton} label="Export" title="Export config" />
        <GraphiQL.Button onClick={handleClickImportButton} label="Import" title="Import config" />
      </GraphiQL.Toolbar>
    </GraphiQL>
  );

  async function handleFetch(graphQLParams: any) {
    if (graphQLParams.operationName === 'IntrospectionQuery') {
      return defaultFetcher(config.fetchConfig.url, graphQLParams);
    }
    const [queryResult, loadTestResult] = await Promise.all([
      defaultFetcher(config.fetchConfig.url, graphQLParams),
      loadtestFetcher(config)
    ]);

    setStats(loadTestResult);
    return queryResult;
  }

  function handleClickPrettifyButton() {
    const editor = (editorRef.current as any).getQueryEditor();
    const currentText = editor.getValue();
    const { parse, print } = require('graphql');
    const prettyText = print(parse(currentText));
    editor.setValue(prettyText);
  }

  function handleEditQuery(value: any) {
    const newConfig = { ...config };
    newConfig.fetchConfig.body.query = value;
    setConfig(newConfig);
  }

  function handleClickExportButton() {
    ipcRenderer.send('request:saveConfig', config);
  }

  function handleClickImportButton() {
    ipcRenderer.send('request:loadConfig');
    ipcRenderer.once('response:loadConfig', (_event: any, config: Config) => {
      if (config) {
        setConfig(config);
      }
    });
  }
}

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

async function loadtestFetcher(config: Config): Promise<Stats[]> {
  return new Promise((resolve, _reject) => {
    ipcRenderer.send('request:loadtestFetcher', config);
    ipcRenderer.once('response:loadtestFetcher', (_event: any, arg: any) => {
      resolve(arg);
    });
  });
}
