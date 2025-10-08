import { BaseApplicationError } from './base.error';
import { ErrorCode, ErrorContext, ErrorSeverity } from '../types/errors';

/**
 * Configuration related errors
 */

export class ConfigurationError extends BaseApplicationError {
  constructor(message: string, context: ErrorContext = {}, cause?: Error) {
    super(message, ErrorCode.CONFIG_INVALID, ErrorSeverity.HIGH, context, false, cause);
  }
}
