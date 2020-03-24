import { FetchConfig, QueryResult } from './types';

export async function executeQuery({ url, headers, body }: FetchConfig): Promise<QueryResult> {
  const startHrTime = process.hrtime();

  const response = await fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

  const durationHrTime = process.hrtime(startHrTime);

  const json = await response.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error('failed fetching result: ' + JSON.stringify(json.errors));
  }

  return {
    duration: durationHrTimeToMs(durationHrTime),
  };
}

type HighResolutionTime = [number, number];

function durationHrTimeToMs(hrtime: HighResolutionTime) {
  return hrtime[0] * 1e6 + hrtime[1] / 1e6;
}
