import fetch from 'node-fetch';
import { FetchConfig } from 'types';

export type DecoratedResponse = {
  duration: number;
};

export async function fetchWithDecoration({ url, headers, body }: FetchConfig): Promise<DecoratedResponse> {
  const startDate = Date.now();

  await fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

  const endDate = Date.now();
  const duration = endDate - startDate;

  return {
    duration,
  };
}
