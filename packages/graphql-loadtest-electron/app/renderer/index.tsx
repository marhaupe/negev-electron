import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { Editor } from './Editor';
import { Settings } from './Settings';
import { AppContextProvider } from './context';
import './index.css';

ReactDOM.render(
  <AppContextProvider>
    <Router>
      <Switch>
        <Route path="/settings">
          <Settings />
        </Route>
        <Route path="/">
          <Editor />
        </Route>
      </Switch>
    </Router>
  </AppContextProvider>,
  document.getElementById('root')
);
