import { FetchParams } from './types';

export type DecoratedResponse = {
  json: any;
  duration: number;
};

export async function fetchWithDecoration({ url, headers, body }: FetchParams): Promise<DecoratedResponse> {
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

  return {
    json,
    duration,
  };
}
