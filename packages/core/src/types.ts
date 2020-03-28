type BaseConfig = {
  endpoint: string;
  query: string;
  headers?: Record<string, string>;
  rateLimit?: number;
};

export type DurationLoadtestConfig = BaseConfig & {
  duration?: number;
};

export type NumberRequestsLoadtestConfig = BaseConfig & {
  numberRequests?: number;
};

export type Config = DurationLoadtestConfig | NumberRequestsLoadtestConfig;

export type Stats = {
  maxDurationPerRequest: number;
  minDurationPerRequest: number;
  averageDurationPerRequest: number;
  jitter: number;
  totalRequests: number;
  requestsPerSecond: number;
};

export type QueryResult = {
  duration: number;
  statusCode: number;
  errors?: string[];
};
