export type Config = {
  phases: Phase[];
  fetchConfig: FetchConfig;
};

export type Phase = {
  /**
   * Sets how many requests are sent per second.
   */
  arrivalRate: number;
  /**
   * The duration of the phase in seconds.
   */
  duration: number;

  /**
   * The duration of the pause after the phase in seconds.
   */
  pause?: number;
};

export type FetchConfig = {
  /**
   * The url under test.
   */
  url: string;
  /**
   * The headers being added to the requests.
   */
  headers?: { [key: string]: string };
  /**
   * The query / mutation being sent.
   */
  body: {
    query: string;
    variables?: any;
    operationName?: string;
  };
};

export type Stats = {
  totalRequests: number;
  responses: QueryResult[];
  maxDurationPerRequest: number;
  minDurationPerRequest: number;
  averageDurationPerRequest: number;
  jitter: number;
};

export type QueryResult = {
  duration: number;
};
