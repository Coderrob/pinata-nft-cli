import { BaseApplicationError } from './base.error';
import { ErrorCode, ErrorContext, ErrorSeverity } from '../types/errors';

/**
 * Validation related errors
 */

export class ValidationError extends BaseApplicationError {
  constructor(message: string, context: ErrorContext = {}, cause?: Error) {
    super(message, ErrorCode.VALIDATION_ERROR, ErrorSeverity.LOW, context, false, cause);
  }
}
