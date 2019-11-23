import fetch from 'node-fetch';
import { FetchConfig } from 'types';

export type DecoratedResponse = {
  duration: number;
};

export async function fetchWithDecoration({ url, headers, body }: FetchConfig): Promise<DecoratedResponse> {
  const startDate = Date.now();

  const response = await fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

  const endDate = Date.now();
  const duration = endDate - startDate;

  const json = await response.json();
  if (json.errors && json.errors.length > 0) {
    throw 'error fetching result: ' + JSON.stringify(json.errors[0]);
  }

  return {
    duration,
  };
}
