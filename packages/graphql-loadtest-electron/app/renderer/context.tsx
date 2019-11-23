import React, { useContext } from 'react';
import { Config } from 'graphql-loadtest-core';
import { usePersistedState } from './__utils__';

const defaultConfig: Config = {
  phases: [],
  fetchConfig: {
    headers: {},
    url: '',
    body: {
      query: '',
      operationName: ''
    }
  }
};

type ContextType = [Config, (config: Config) => void];

const AppContext = React.createContext<ContextType>([defaultConfig, (config: Config) => {}]);

type Props = {
  children: React.ReactNode;
};

export function useAppContext() {
  return useContext(AppContext);
}

export function AppContextProvider({ children }: Props) {
  const value = usePersistedState<Config>('appConfig', defaultConfig);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
