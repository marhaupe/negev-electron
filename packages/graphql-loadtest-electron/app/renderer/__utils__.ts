import { useState } from 'react';

export function usePersistedState<S>(key: string, initialState: S | (() => S)): [S, (value: S) => void] {
  const [state, setState] = useState(() => {
    const persistedState = window.localStorage.getItem(key);
    if (persistedState) {
      return JSON.parse(persistedState);
    }
    if (typeof initialState === 'function') {
      return (initialState as () => S)();
    }
    return initialState;
  });

  function setPersistedState(value: S) {
    window.localStorage.setItem(key, JSON.stringify(value));
    setState(value);
  }

  return [state, setPersistedState];
}
