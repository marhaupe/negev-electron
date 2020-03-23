import React, { useRef, useState } from "react";
import GraphiQL from "graphiql";
import fetch from "unfetch";
import "graphiql/graphiql.css";
import { Config } from "graphql-loadtest";
import { Link } from "react-router-dom";
// import "./editor.css";
import { useStore, AppStore } from "../mobx/store";
import { useObserver } from "mobx-react";
import { toJS } from "mobx";
import { throttle } from "lodash";
const { ipcRenderer } = window.require("electron");

export function Editor() {
  const editorRef = useRef(null);
  const store = useStore();

  // This makes sure that the <GraphiQL>-Component gets recreated as soon as
  // a valid url is typed. We need this workaround until the issue gets fixed
  // https://github.com/graphql/graphiql/issues/223. GraphiQL@1.0.0 probably will
  // make this easier.
  const [key, setKey] = useState("");

  return useObserver(() => (
    <GraphiQL
      key={key}
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
        <img alt="graphql-loadtest icon" src={"/icon.png"} />
      </GraphiQL.Logo>
      <GraphiQL.Toolbar>
        <GraphiQL.Button
          onClick={handleClickPrettifyButton}
          label="Prettify"
          title="Prettify Query (Shift-Ctrl-P)"
        />
        <input
          name="endpoint"
          className="appearance-none bg-white flex-1 rounded border focus:border-gray-600 border-gray-400 text-gray-700 mx-2 px-3 focus:outline-none width-32"
          type="text"
          value={store.fetchConfig.url}
          aria-label="Endpoint"
          placeholder="Endpoint"
          onChange={event => store.setUrl(event.target.value)}
        />
        <Link to={"/result"}>
          <GraphiQL.Button label="Result" title="Open result page" />
        </Link>
        <Link to={"/settings"}>
          <GraphiQL.Button label="Settings" title="Open settings page" />
        </Link>
        <GraphiQL.Button
          onClick={handleClickExportButton}
          label="Export"
          title="Export config"
        />
        <GraphiQL.Button
          onClick={handleClickImportButton}
          label="Import"
          title="Import config"
        />
      </GraphiQL.Toolbar>
    </GraphiQL>
  ));

  function handleClickPrettifyButton() {
    const editor = (editorRef.current as any).getQueryEditor();
    const currentText = editor.getValue();
    const { parse, print } = require("graphql");
    const prettyText = print(parse(currentText));
    editor.setValue(prettyText);
  }

  function handleEditOperationName(value: any) {
    store.setBody({
      ...store.fetchConfig.body,
      operationName: value
    });
  }

  function handleEditVariables(value: any) {
    store.setBody({
      ...store.fetchConfig.body,
      variables: value
    });
  }

  function handleEditQuery(value: any) {
    store.setBody({
      ...store.fetchConfig.body,
      query: value
    });
  }

  function handleClickExportButton() {
    ipcRenderer.send("request:saveConfig", {
      fetchConfig: store.fetchConfig,
      phases: store.phases
    });
  }

  function handleClickImportButton() {
    ipcRenderer.send("request:loadConfig");
    ipcRenderer.once("response:loadConfig", (_event: any, config: Config) => {
      if (config) {
        store.setPhases(config.phases);
        store.setFetchConfig(config.fetchConfig);
      }
    });
  }

  async function handleFetch(graphQLParams: any) {
    if (graphQLParams.operationName === "IntrospectionQuery") {
      return defaultFetcher(store.fetchConfig.url, graphQLParams)
        .then(data => {
          setKey(store.fetchConfig.url);
          return data;
        })
        .catch(() => ({
          message: "Could not fetch schema"
        }));
    }

    if (store.phases.length === 0) {
      return {
        message: "Cannot run loadtest. Please configure at least one phase."
      };
    }

    let response = await defaultFetcher(store.fetchConfig.url, graphQLParams);
    await loadTestFetcher(store);
    return response;
  }
}

async function defaultFetcher(
  endpoint: string,
  graphQLParams: any,
  headers = {}
) {
  const response = await fetch(endpoint, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: JSON.stringify(graphQLParams)
  });
  return await response.json();
}

async function loadTestFetcher(store: AppStore): Promise<void> {
  ipcRenderer.send("request:loadtestFetcher", {
    fetchConfig: toJS(store.fetchConfig),
    phases: toJS(store.phases)
  });
  return new Promise((resolve, reject) => {
    ipcRenderer.on(
      "response:loadtestFetcher",
      throttle((_event: any, arg: any) => {
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
      }, 50)
    );
  });
}
