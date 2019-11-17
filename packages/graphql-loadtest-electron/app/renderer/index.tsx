import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { Editor } from './Editor';
import { Settings } from './Settings';

ReactDOM.render(
  <Router>
    <Switch>
      <Route path="/settings">
        <Settings />
      </Route>
      <Route path="/">
        <Editor />
      </Route>
    </Switch>
  </Router>,

  document.getElementById('root')
);
