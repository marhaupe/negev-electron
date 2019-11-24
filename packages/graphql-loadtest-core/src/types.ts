export type DecoratedResponse = {
  duration: number;
};

export type Phase = {
  /**
   * Configures how many requests arrive per second.
   */
  arrivalRate: number;
  /**
   * Configures the duration of the phase in seconds.
   */
  duration: number;

  /**
   * Configures the duration of the pause after the phase.
   */
  pause?: number;

  /**
   * TODO: This might be a nifty functionality
   * Configures the amount of new requests that are being sent at the end of the phase. The number of requests
   * increase linearly over the time of the phase.
   */
  // rampTo: number;
};

export type Config = {
  /**
   * Configures the phase.
   */
  phases: Phase[];
  fetchConfig: FetchConfig;
};

export type FetchConfig = {
  /**
   * Configures the url under test.
   */
  url: string;
  /**
   * Configures the headers being added to the requests.
   */
  headers?: { [key: string]: string };
  /**
   * Configures the query / mutation being sent.
   */
  body: {
    query: string;
    variables?: any;
  };
};

export type Stats = {
  totalRequests: number;
  responses: DecoratedResponse[];
  maxDurationPerRequest: number;
  minDurationPerRequest: number;
  averageDurationPerRequest: number;
  jitter: number;
};
