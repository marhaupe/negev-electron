import React from "react";
import { observable } from "mobx";
import { useLocalStore } from "mobx-react";
import { FetchConfig, Stats, Phase } from "graphql-loadtest";

export class AppStore {
  @observable phases: Phase[] = [
    {
      pause: 0,
      duration: 5,
      arrivalRate: 50
    }
  ];

  setPhases(phases: Phase[]) {
    this.phases = phases;
  }

  addPhase(phase: Phase) {
    this.phases.push(phase);
  }

  removePhase(index: number) {
    this.phases.splice(index, 1);
  }

  updatePhase(index: number, newPhase: Phase) {
    this.phases[index] = newPhase;
  }

  @observable fetchConfig: FetchConfig = {
    headers: {},
    url: "",
    body: {
      query: "",
      variables: undefined,
      operationName: undefined
    }
  };

  setFetchConfig(fetchConfig: FetchConfig) {
    this.fetchConfig = fetchConfig;
  }

  setUrl(url: string) {
    this.fetchConfig.url = url;
  }

  setHeaders(headers: { [key: string]: string }) {
    this.fetchConfig.headers = headers;
  }

  setBody(body: any) {
    this.fetchConfig.body = body;
  }

  @observable stats: Stats[] = [];

  setStats(stats: Stats[]) {
    this.stats = stats;
  }
}

function createStore() {
  return new AppStore();
}

const storeContext = React.createContext<AppStore | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const store = useLocalStore(createStore);

  return (
    <storeContext.Provider value={store}>{children}</storeContext.Provider>
  );
}

export const useStore = () => {
  const store = React.useContext(storeContext);
  if (!store) {
    // this is especially useful in TypeScript so you don't need to be checking for null all the time
    throw new Error("useStore must be used within a StoreProvider.");
  }
  return store;
};
