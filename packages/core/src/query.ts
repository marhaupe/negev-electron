import { Request } from 'node-fetch';
import { QueryResult } from './types';
import timeSpan from 'time-span';

export async function executeQuery(request: Request): Promise<QueryResult | Error> {
  try {
    const end = timeSpan();

    const response = await fetch(request);

    const duration = end.rounded();

    const json = await response.json();
    let errors = undefined;
    if (json.errors && json.errors.length > 0) {
      errors = json.errors.map((error: any) => JSON.stringify(error));
    }

    return {
      statusCode: response.status,
      duration,
      errors,
    };
  } catch (error) {
    return error;
  }
}
