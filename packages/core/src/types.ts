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
  totalDuration: number;
  slowest: number;
  fastest: number;
  average: number;
  requestsPerSecond: number;
  latencyDistribution: LatencyDistribution;
  errorDistribution: ErrorDistribution;
  histogram: Histogram;
};

export type ErrorDistribution = {
  errorCount: number;
  successCount: number;
};

export type Histogram = {
  [duration: number]: number;
};

export type LatencyDistribution = {
  10: number;
  25: number;
  50: number;
  75: number;
  90: number;
  95: number;
  99: number;
};

export type QueryResult = {
  duration: number;
  statusCode: number;
  errors?: string[];
};
