import React, { useEffect, useState } from "react";
import { observable } from "mobx";
import { useLocalStore } from "mobx-react";
import { create, persist } from "mobx-persist";
import { FetchConfig, Stats, Phase } from "@negev/core";

const hydrate = create({
  storage: window.localStorage,
  jsonify: true,
});

export class AppStore {
  @persist("list") @observable phases: Phase[] = [
    {
      pause: 0,
      duration: 5,
      arrivalRate: 50,
    },
  ];

  @persist("object") @observable fetchConfig: FetchConfig = {
    headers: {},
    url: "",
    body: {
      query: "",
      variables: undefined,
      operationName: undefined,
    },
  };

  @persist("list") @observable stats: Stats[] = [];

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrate("mobx-persist", store).then(() => setLoading(false));
  }, [store]);

  return (
    <storeContext.Provider value={store}>
      {loading ? null : children}
    </storeContext.Provider>
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
