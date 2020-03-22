import * as React from "react";
import * as ReactDOM from "react-dom";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Editor } from "./Editor/Editor";
import { Settings } from "./Settings/Settings";
import { Result } from "./Result/Result";
import { StoreProvider } from "./mobx/store";
import * as serviceWorker from "./serviceWorker";
import "./index.css";

ReactDOM.render(
  <React.StrictMode>
    <StoreProvider>
      <Router>
        <Switch>
          <Route path="/result">
            <Result />
          </Route>
          <Route path="/settings">
            <Settings />
          </Route>
          <Route path="/">
            <Editor />
          </Route>
        </Switch>
      </Router>
    </StoreProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
