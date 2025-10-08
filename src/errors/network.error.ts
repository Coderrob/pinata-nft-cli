import { BaseApplicationError } from './base.error';
import { ErrorCode, ErrorContext, ErrorSeverity } from '../types/errors';

/**
 * Network related errors
 */

export class NetworkError extends BaseApplicationError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.NETWORK_UNAVAILABLE,
    context: ErrorContext = {},
    isRetryable: boolean = true,
    cause?: Error
  ) {
    super(message, code, ErrorSeverity.MEDIUM, context, isRetryable, cause);
  }
}
