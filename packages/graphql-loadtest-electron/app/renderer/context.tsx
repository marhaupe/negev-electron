import React, { useContext } from 'react';
import { Config, Stats } from 'graphql-loadtest-core';
import { usePersistedState } from './__utils__';

const defaultAppConfig: Config = {
  phases: [],
  fetchConfig: {
    headers: {},
    url: '',
    body: {
      query: ''
    }
  }
};

type AppConfigContextType = [Config, (config: Config) => void];

const AppConfigContext = React.createContext<AppConfigContextType>([defaultAppConfig, (config: Config) => {}]);

export function useAppConfigContext() {
  return useContext(AppConfigContext);
}

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const value = usePersistedState<Config>('appConfig', defaultAppConfig);

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}

const defaultStats: Stats[] = [];

type AppStatsContextType = [Stats[], (stats: Stats[]) => void];

const AppStatsContext = React.createContext<AppStatsContextType>([defaultStats, (stats: Stats[]) => {}]);

export function useAppStatsContext() {
  return useContext(AppStatsContext);
}

export function AppStatsProvider({ children }: { children: React.ReactNode }) {
  const value = usePersistedState<Stats[]>('appStats', defaultStats);

  return <AppStatsContext.Provider value={value}>{children}</AppStatsContext.Provider>;
}
