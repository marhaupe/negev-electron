import React, { useRef } from 'react';
import GraphiQL from 'graphiql';
import fetch from 'isomorphic-fetch';
import 'graphiql/graphiql.css';
import { Config } from 'graphql-loadtest-core';
import { Link } from 'react-router-dom';
import './editor.css';
import Swal from 'sweetalert2';
import { useStore, AppStore } from './store';
import { useObserver } from 'mobx-react';
import { toJS } from 'mobx';
const { ipcRenderer } = window.require('electron');

export function Editor() {
  const editorRef = useRef(null);
  const store = useStore();

  return useObserver(() => (
    <GraphiQL
      query={store.fetchConfig.body.query}
      variables={store.fetchConfig.body.variables}
      operationName={store.fetchConfig.body.operationName}
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
          value={store.fetchConfig.url}
          aria-label="Endpoint"
          placeholder="Endpoint"
          onChange={event => store.setUrl(event.target.value)}
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
  ));

  async function handleFetch(graphQLParams: any) {
    if (graphQLParams.operationName === 'IntrospectionQuery') {
      return defaultFetcher(store.fetchConfig.url, graphQLParams);
    }

    if (store.phases.length === 0) {
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
      response = await defaultFetcher(store.fetchConfig.url, graphQLParams);
    } catch (error) {
      throw error;
    }

    try {
      await loadTestFetcher(store);
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
    store.setBody({ ...store.fetchConfig.body, operationName: value });
  }

  function handleEditVariables(value: any) {
    store.setBody({ ...store.fetchConfig.body, variables: value });
  }

  function handleEditQuery(value: any) {
    store.setBody({ ...store.fetchConfig.body, query: value });
  }

  function handleClickExportButton() {
    ipcRenderer.send('request:saveConfig', { fetchConfig: store.fetchConfig, phases: store.phases });
  }

  function handleClickImportButton() {
    ipcRenderer.send('request:loadConfig');
    ipcRenderer.once('response:loadConfig', (_event: any, config: Config) => {
      if (config) {
        store.setPhases(config.phases);
        store.setFetchConfig(config.fetchConfig);
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

async function loadTestFetcher(store: AppStore): Promise<void> {
  ipcRenderer.send('request:loadtestFetcher', { fetchConfig: toJS(store.fetchConfig), phases: toJS(store.phases) });
  return new Promise((resolve, reject) => {
    ipcRenderer.on('response:loadtestFetcher', (_event: any, arg: any) => {
      if (arg.data != null) {
        store.setStats(JSON.parse(arg.data));
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
