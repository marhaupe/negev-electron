import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { Editor } from './Editor';
import { Settings } from './Settings';
import { AppConfigProvider, AppStatsProvider } from './context';
import './index.css';
import { Result } from './Result';

ReactDOM.render(
  <AppConfigProvider>
    <AppStatsProvider>
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
    </AppStatsProvider>
  </AppConfigProvider>,
  document.getElementById('root')
);
