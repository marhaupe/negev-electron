import { Config } from './types';

type ValidationResult = {
  isValid: boolean;
  reason?: string;
};

export function validateConfig(config: Config): ValidationResult {
  if (config.phases.length === 0) {
    return {
      isValid: false,
      reason: 'cannot run loadtest without at least one phase.',
    };
  }
  for (const phase of config.phases) {
    if (phase.duration < 1) {
      return {
        isValid: false,
        reason: 'phases with a duration shorter than one second are not supported.',
      };
    }
    if (phase.arrivalRate < 1) {
      return {
        isValid: false,
        reason: 'phases with an arrival rate smaller than one are not supported.',
      };
    }
  }
  return { isValid: true };
}
