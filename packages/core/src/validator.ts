import { NumberRequestsLoadtestConfig, DurationLoadtestConfig } from './types';

type ValidationResult = {
  isValid: boolean;
  reason?: string;
};

export function validateConfig(config: NumberRequestsLoadtestConfig & DurationLoadtestConfig): ValidationResult {
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
