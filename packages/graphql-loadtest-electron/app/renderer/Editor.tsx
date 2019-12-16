import React, { useRef } from 'react';
import GraphiQL from 'graphiql';
import fetch from 'isomorphic-fetch';
import 'graphiql/graphiql.css';
import { Config } from 'graphql-loadtest-core';
import { Link } from 'react-router-dom';
import { useAppConfigContext, useAppStatsContext } from './context';
import './editor.css';
import Swal from 'sweetalert2';
const { ipcRenderer } = window.require('electron');

export function Editor() {
  const editorRef = useRef(null);
  const [config, setConfig] = useAppConfigContext();
  const [stats, setStats] = useAppStatsContext();

  return (
    <GraphiQL
      query={config && config.fetchConfig && config.fetchConfig.body.query}
      variables={config && config.fetchConfig && config.fetchConfig.body && config.fetchConfig.body.variables}
      operationName={config && config.fetchConfig && config.fetchConfig.body && config.fetchConfig.body.operationName}
      onEditQuery={handleEditQuery}
      onEditVariables={handleEditVariables}
      onEditOperationName={handleEditOperationName}
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

    if (config.phases.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please configure at least one phase before running a loadtest.',
        footer: '<a href="/settings">Take me to the settings</a>'
      });
      return;
    }

    let response: any;
    try {
      response = await defaultFetcher(config.fetchConfig.url, graphQLParams);
    } catch (error) {
      throw error;
    }

    try {
      await loadTestFetcher(config, setStats);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Something went wrong while running the loadtest.',
        footer: `<code>${JSON.stringify(error)}</code>`
      });
    }
    return response;
  }

  function handleClickPrettifyButton() {
    const editor = (editorRef.current as any).getQueryEditor();
    const currentText = editor.getValue();
    const { parse, print } = require('graphql');
    const prettyText = print(parse(currentText));
    editor.setValue(prettyText);
  }

  function handleEditOperationName(value: any) {
    const newConfig = { ...config };
    newConfig.fetchConfig.body.operationName = value;
    setConfig(newConfig);
  }

  function handleEditVariables(value: any) {
    const newConfig = { ...config };
    newConfig.fetchConfig.body.variables = value;
    setConfig(newConfig);
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
    const err = new Error('failed running introspection query on the provided url.');
    err.stack = undefined;
    throw err;
  }
}

async function loadTestFetcher(config: Config, onPartialData: (data: any) => any): Promise<void> {
  ipcRenderer.send('request:loadtestFetcher', config);
  return new Promise((resolve, reject) => {
    ipcRenderer.on('response:loadtestFetcher', (_event: any, arg: any) => {
      if (arg.data != null) {
        onPartialData(JSON.parse(arg.data));
      }
      if (arg.end != null) {
        resolve();
      }
      if (arg.close != null) {
        resolve();
      }
      if (arg.error != null) {
        reject(arg.error);
      }
    });
  });
}
