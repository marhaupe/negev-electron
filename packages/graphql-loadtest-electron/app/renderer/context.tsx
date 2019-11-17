import React, { useContext } from 'react';
import { Config } from 'graphql-loadtest-core';
import { usePersistedState } from './__utils__';

const defaultConfig = {
  phases: [],
  headers: undefined,
  url: ''
};

type AppConfig = Pick<Config, 'phases' | 'headers' | 'url'>;

type ContextType = {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
};

const AppContext = React.createContext<ContextType>({
  config: defaultConfig,
  setConfig: (config: AppConfig) => {}
});

type Props = {
  children: React.ReactNode;
};

export function useAppContext() {
  return useContext(AppContext);
}

export function AppContextProvider({ children }: Props) {
  const [config, setConfig] = usePersistedState<AppConfig>('appConfig', defaultConfig);

  return <AppContext.Provider value={{ config, setConfig }}>{children}</AppContext.Provider>;
}
