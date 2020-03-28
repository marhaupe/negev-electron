import { Request } from 'node-fetch';
import { QueryResult } from './types';

export async function executeQuery(request: Request): Promise<QueryResult | Error> {
  try {
    const startHrTime = process.hrtime();

    const response = await fetch(request);

    const durationHRTime = process.hrtime(startHrTime);

    const json = await response.json();
    let errors = undefined;
    if (json.errors && json.errors.length > 0) {
      errors = json.errors.map((error: any) => JSON.stringify(error));
    }

    return {
      duration: hrTimeToMS(durationHRTime),
      statusCode: response.status,
      errors,
    };
  } catch (error) {
    return error;
  }
}

function hrTimeToMS(hrtime: [number, number]) {
  const nanoseconds = hrtime[0] * 1e9 + hrtime[1];
  return nanoseconds / 1e6;
}
