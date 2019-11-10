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
  /**
   * Configures the params being passed to the `fetch`-Requests.
   */
  fetchParams: FetchParams;
};

export type Stats = {
  totalRequests: number;
  totalDuration: number;
  maxDurationPerRequest: number;
  minDurationPerRequest: number;
  averageDurationPerRequest: number;
  jitter: number;
};

export type FetchParams = {
  /**
   * Configures the headers being added to the requests.
   */
  headers?: Record<string, string>;
  /**
   * Configures the query / mutation being sent.
   */
  body: {
    query: string;
    operationName?: string;
    variables?: any;
  };
  /**
   * Configures the url under test.
   */
  url: string;
};
