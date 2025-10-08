import { ErrorCode, ErrorSeverity } from '../types/errors';
import { ValidationError } from './validation.error';
import { createErrorTests } from './error-test-utils';

describe('ValidationError', () => {
  createErrorTests(
    (message, context, cause) => new ValidationError(message, context, cause),
    ErrorCode.VALIDATION_ERROR,
    ErrorSeverity.LOW,
    false
  );
});
