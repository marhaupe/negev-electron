import { Config } from './types';

type ValidationResult = {
  isValid: boolean;
  reason?: string;
};

export function validateConfig(config: Config): ValidationResult {
  if (config.duration && !numberIsValid(config.duration)) {
    return {
      isValid: false,
      reason: 'config validation failed: duration is invalid',
    };
  }
  if (config.numberRequests && !numberIsValid(config.numberRequests)) {
    return {
      isValid: false,
      reason: 'config validation failed: numberRequests is invalid',
    };
  }
  if (config.rateLimit && !numberIsValid(config.rateLimit)) {
    return {
      isValid: false,
      reason: 'config validation failed: rateLimit is invalid',
    };
  }
  return {
    isValid: true,
  };
}

function numberIsValid(num: number) {
  if (!Number.isInteger(num)) {
    return false;
  }
  if (num < 0) {
    return false;
  }
  return true;
}
