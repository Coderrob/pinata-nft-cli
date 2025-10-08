import { PinataError } from './pinata.error';
import { ErrorCode, ErrorSeverity, ErrorContext } from '../types/errors';

describe('PinataError', () => {
  it('should create an instance with default parameters', () => {
    const error = new PinataError('Test message');

    expect(error.message).toBe('Test message');
    expect(error.code).toBe(ErrorCode.PINATA_UPLOAD_FAILED);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.context).toEqual({});
    expect(error.isRetryable).toBe(true);
    expect(error.cause).toBeUndefined();
  });

  it('should set severity to HIGH for PINATA_AUTH_FAILED code', () => {
    const error = new PinataError('Auth failed', ErrorCode.PINATA_AUTH_FAILED);

    expect(error.code).toBe(ErrorCode.PINATA_AUTH_FAILED);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
  });

  it('should set severity to MEDIUM for other codes', () => {
    const error = new PinataError('Upload failed', ErrorCode.PINATA_UPLOAD_FAILED);

    expect(error.code).toBe(ErrorCode.PINATA_UPLOAD_FAILED);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
  });

  it('should accept custom context, isRetryable, and cause', () => {
    const context: ErrorContext = { operation: 'test-operation', fileName: 'test.txt' };
    const cause = new Error('Cause error');
    const error = new PinataError('Custom message', ErrorCode.PINATA_UPLOAD_FAILED, context, false, cause);

    expect(error.message).toBe('Custom message');
    expect(error.code).toBe(ErrorCode.PINATA_UPLOAD_FAILED);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.context).toEqual(context);
    expect(error.isRetryable).toBe(false);
    expect(error.cause).toBe(cause);
  });

  it('should be an instance of BaseApplicationError', () => {
    const error = new PinataError('Test');

    expect(error).toBeInstanceOf(PinataError);
    // Assuming BaseApplicationError is the parent class
    expect(error.constructor.name).toBe('PinataError');
  });
});
