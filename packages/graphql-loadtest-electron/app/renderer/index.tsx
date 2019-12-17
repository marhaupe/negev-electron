import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { Editor } from './Editor';
import { Settings } from './Settings';
import './index.css';
import { Result } from './Result';
import { StoreProvider } from './store';

ReactDOM.render(
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
  </StoreProvider>,
  document.getElementById('root')
);
