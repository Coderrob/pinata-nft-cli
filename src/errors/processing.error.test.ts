import { ProcessingError } from './processing.error';
import { ErrorCode, ErrorSeverity } from '../types/errors';
import { createErrorTests } from './error-test-utils';

describe('ProcessingError', () => {
  createErrorTests(
    (message, context, cause) => new ProcessingError(message, ErrorCode.PROCESSING_FAILED, context, cause),
    ErrorCode.PROCESSING_FAILED,
    ErrorSeverity.MEDIUM,
    false
  );

  it('should create an instance with custom code and context', () => {
    const context = { operation: 'test' };
    const error = new ProcessingError('Test message', ErrorCode.VALIDATION_ERROR, context);
    expect(error.message).toBe('Test message');
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.context).toEqual(context);
    expect(error.isRetryable).toBe(false);
    expect(error.cause).toBeUndefined();
  });

  it('should be an instance of BaseApplicationError', () => {
    const error = new ProcessingError('Test message');
    expect(error).toBeInstanceOf(Error);
  });
});
