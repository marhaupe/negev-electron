import { useState } from 'react';

export function usePersistedState<S>(key: string, initialState: S | (() => S)): [S, (value: S) => void] {
  const [state, setState] = useState(() => {
    return getPersistedState(initialState);
  });

  function getPersistedState(initialState: S | (() => S)) {
    const persistedState = window.localStorage.getItem(key);
    if (!persistedState) {
      if (typeof initialState !== 'function') {
        return initialState;
      }
      return (initialState as () => S)();
    }
    return JSON.parse(persistedState);
  }

  function setPersistedState(value: S) {
    window.localStorage.setItem(key, JSON.stringify(value));
    setState(value);
  }

  return [state, setPersistedState];
}
