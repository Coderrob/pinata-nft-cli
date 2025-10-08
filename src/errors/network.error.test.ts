import { NetworkError } from './network.error';
import { ErrorCode, ErrorSeverity } from '../types/errors';

describe('NetworkError', () => {
  it('should create an instance with default values', () => {
    const error = new NetworkError('Network error occurred');

    expect(error).toBeInstanceOf(NetworkError);
    expect(error.message).toBe('Network error occurred');
    expect(error.code).toBe(ErrorCode.NETWORK_UNAVAILABLE);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.context).toEqual({});
    expect(error.isRetryable).toBe(true);
    expect(error.cause).toBeUndefined();
  });

  it('should create an instance with custom values', () => {
    const context = { operation: 'api-call', metadata: { url: 'https://example.com' } };
    const cause = new Error('Underlying error');
    const error = new NetworkError('Custom network error', ErrorCode.NETWORK_TIMEOUT, context, false, cause);

    expect(error.message).toBe('Custom network error');
    expect(error.code).toBe(ErrorCode.NETWORK_TIMEOUT);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.context).toEqual(context);
    expect(error.isRetryable).toBe(false);
    expect(error.cause).toBe(cause);
  });

  it('should inherit from BaseApplicationError', () => {
    const error = new NetworkError('Test error');

    expect(error).toBeInstanceOf(Error);
  });
});
