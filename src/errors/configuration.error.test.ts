import { ConfigurationError } from './configuration.error';
import { BaseApplicationError } from './base.error';
import { ErrorCode, ErrorContext, ErrorSeverity } from '../types/errors';

describe('ConfigurationError', () => {
  it('should create an instance with default context and no cause', () => {
    const message = 'Test configuration error';
    const error = new ConfigurationError(message);

    expect(error).toBeInstanceOf(ConfigurationError);
    expect(error).toBeInstanceOf(BaseApplicationError);
    expect(error.message).toBe(message);
    expect(error.code).toBe(ErrorCode.CONFIG_INVALID);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
    expect(error.isRetryable).toBe(false);
    expect(error.context).toEqual({});
    expect(error.cause).toBeUndefined();
  });

  it('should create an instance with custom context', () => {
    const message = 'Test configuration error';
    const context: ErrorContext = {};
    const error = new ConfigurationError(message, context);

    expect(error.context).toEqual(context);
  });

  it('should create an instance with a cause', () => {
    const message = 'Test configuration error';
    const cause = new Error('Underlying error');
    const error = new ConfigurationError(message, {}, cause);

    expect(error.cause).toBe(cause);
  });

  it('should create an instance with custom context and cause', () => {
    const message = 'Test configuration error';
    const context: ErrorContext = {};
    const cause = new Error('Underlying error');
    const error = new ConfigurationError(message, context, cause);

    expect(error.context).toEqual(context);
    expect(error.cause).toBe(cause);
  });
});
