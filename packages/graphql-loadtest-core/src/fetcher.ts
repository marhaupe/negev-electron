import { FetchParams } from './types';
import fetch from 'node-fetch';

export type DecoratedResponse = {
  duration: number;
};

export async function fetchWithDecoration({ url, headers, body }: FetchParams): Promise<DecoratedResponse> {
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
