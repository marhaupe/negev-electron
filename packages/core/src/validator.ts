import { NumberRequestsLoadtestConfig, DurationLoadtestConfig, QueryResult } from './types';
import { executeQuery } from './query';
import { Request } from 'node-fetch';
import { isError } from './__utils__';

type ValidationResult = {
  isValid: boolean;
  reason?: string;
};

export async function validateConfig(
  config: NumberRequestsLoadtestConfig & DurationLoadtestConfig,
  request: Request
): Promise<ValidationResult> {
  if (config.duration && !numberIsValid(config.duration)) {
    return {
      isValid: false,
      reason: 'duration is invalid',
    };
  }
  if (config.numberRequests && !numberIsValid(config.numberRequests)) {
    return {
      isValid: false,
      reason: 'numberRequests is invalid',
    };
  }
  if (config.rateLimit && !numberIsValid(config.rateLimit)) {
    return {
      isValid: false,
      reason: 'rateLimit is invalid',
    };
  }
  if (config.numberRequests && config.rateLimit && config.numberRequests < config.rateLimit) {
    return {
      isValid: false,
      reason: 'numberRequests may not be smaller than rateLimit',
    };
  }

  const queryResult = await executeQuery(request);
  const errors = (queryResult as QueryResult).errors;
  if (errors) {
    return {
      isValid: false,
      reason: 'query returned errors: ' + errors,
    };
  }
  if (isError(queryResult)) {
    return {
      isValid: false,
      reason: 'request failed: ' + (queryResult as Error).message,
    };
  }

  return {
    isValid: true,
  };
}

function numberIsValid(num: number) {
  if (isNaN(num)) {
    return false;
  }
  if (typeof num !== 'number') {
    return false;
  }
  if (!Number.isInteger(num)) {
    return false;
  }
  if (num <= 0) {
    return false;
  }
  if (num >= Number.MAX_SAFE_INTEGER) {
    return false;
  }
  return true;
}
