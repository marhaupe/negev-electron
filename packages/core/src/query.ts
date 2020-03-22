import { FetchConfig, QueryResult } from './types';

export async function executeQuery({ url, headers, body }: FetchConfig): Promise<QueryResult> {
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
    throw new Error('failed fetching result: ' + JSON.stringify(json.errors));
  }

  return {
    duration,
  };
}
