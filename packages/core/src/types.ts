export type Config = {
  endpoint: string;
  query: string;
  headers?: Record<string, string>;
  duration?: number;
  numberRequests?: number;
  rateLimit?: number;
};

export type Stats = {
  maxDurationPerRequest: number;
  minDurationPerRequest: number;
  averageDurationPerRequest: number;
  jitter: number;
  totalRequests: number;
};

export type QueryResult = {
  duration: number;
  statusCode: number;
  errors?: string[];
};
