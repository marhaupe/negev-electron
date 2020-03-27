export type Config = {
  endpoint: string;
  query: string;
  headers?: Record<string, string>;
  duration?: number;
  numberRequests?: number;
  numberWorkers?: number;
  rateLimit?: number;
};

export type Stats = {
  responses: QueryResult[];
  maxDurationPerRequest: number;
  minDurationPerRequest: number;
  averageDurationPerRequest: number;
  jitter: number;
};

export type QueryResult = {
  duration: number;
  statusCode: number;
  errors?: string[];
};
