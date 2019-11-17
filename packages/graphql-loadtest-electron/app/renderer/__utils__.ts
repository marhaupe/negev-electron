import { useState, useEffect } from 'react';
const { ipcRenderer } = window.require('electron');

export function usePersistedState<S>(key: string, initialState: S | (() => S)): [S, (value: S) => void] {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    ipcRenderer.send('getPersistedState');
    ipcRenderer.once('getPersistedState', onGetPersistedState);

    function onGetPersistedState(_event: any, persistedState: any) {
      if (persistedState[key]) {
        setState(persistedState[key]);
      }
    }
    // Since we can't do this kind of stuff in the useState-callback to setup the initial
    // state, we do it only one time once the component mounted.
    // eslint-disable-next-line
  }, []);

  function setPersistedState(value: S) {
    ipcRenderer.send('setPersistedState', { key, value });
    setState(value);
  }

  return [state, setPersistedState];
}
