import { Request } from 'node-fetch';
import { QueryResult } from './types';

export async function executeQuery(request: Request): Promise<QueryResult | Error> {
  try {
    const startHrTime = process.hrtime();

    const response = await fetch(request);

    const durationHrTime = process.hrtime(startHrTime);

    const json = await response.json();
    let errors = undefined;
    if (json.errors && json.errors.length > 0) {
      errors = json.errors.map((error: any) => JSON.stringify(error));
    }

    return {
      duration: durationHrTimeToMs(durationHrTime),
      statusCode: response.status,
      errors,
    };
  } catch (error) {
    return error;
  }
}

function durationHrTimeToMs(hrtime: [number, number]) {
  return hrtime[0] * 1e6 + hrtime[1] / 1e6;
}
