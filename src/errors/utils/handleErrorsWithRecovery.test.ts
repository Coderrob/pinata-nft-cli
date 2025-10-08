import { handleErrorsWithRecovery } from './handleErrorsWithRecovery';
import { SystemError } from '../system.error';
import { ErrorCode } from '../../types/errors';
import { ErrorRecoveryConfig } from '../error-handler';

// Create shared mock functions
const mockError = jest.fn();
const mockInfo = jest.fn();

// Mock StructuredLogger
jest.mock('../../observability', () => ({
  StructuredLogger: jest.fn().mockImplementation(() => ({
    error: mockError,
    info: mockInfo,
  })),
}));

/**
 * Helper to create a test class with handleErrorsWithRecovery decorator
 */
function createDecoratedTestClass(throwable: unknown, config?: ErrorRecoveryConfig) {
  class TestClass {
    @handleErrorsWithRecovery(config)
    async testMethod(): Promise<unknown> {
      throw throwable;
    }
  }
  return new TestClass();
}

describe('handleErrorsWithRecovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockError.mockClear();
    mockInfo.mockClear();
  });

  it('should return the method result when no error occurs', async () => {
    class TestClass {
      @handleErrorsWithRecovery()
      async testMethod(): Promise<string> {
        return 'success';
      }
    }

    const instance = new TestClass();
    const result = await instance.testMethod();
    expect(result).toBe('success');
  });

  it('should throw SystemError when it is not retryable', async () => {
    const error = new SystemError('Test error', ErrorCode.UNKNOWN_ERROR, {});
    // Set the error as not retryable for this test
    (error as any).isRetryable = false;

    const instance = createDecoratedTestClass(error);
    await expect(instance.testMethod()).rejects.toThrow(error);
    expect(mockError).toHaveBeenCalledWith(
      'SystemError: Test error',
      error,
      expect.objectContaining({
        operation: 'TestClass.testMethod',
      })
    );
  });

  it('should attempt recovery and return result when SystemError is retryable and recovery succeeds', async () => {
    const error = new SystemError('Test error', ErrorCode.UNKNOWN_ERROR, {});
    const recoveryResult = 'recovered';

    const config: ErrorRecoveryConfig = {
      recoveryFn: jest.fn().mockResolvedValue(recoveryResult),
    };

    const instance = createDecoratedTestClass(error, config);
    const result = await instance.testMethod();
    expect(result).toBe(recoveryResult);
    expect(config.recoveryFn).toHaveBeenCalled();
    expect(mockInfo).toHaveBeenCalledWith('Attempting error recovery', {
      operation: 'TestClass.testMethod',
      errorCode: error.code,
      isRetryable: error.isRetryable,
    });
  });

  it('should throw original error when recovery fails', async () => {
    const error = new SystemError('Test error', ErrorCode.UNKNOWN_ERROR, {});
    const recoveryError = new Error('Recovery failed');

    const config: ErrorRecoveryConfig = {
      recoveryFn: jest.fn().mockRejectedValue(recoveryError),
    };

    const instance = createDecoratedTestClass(error, config);
    await expect(instance.testMethod()).rejects.toThrow(error);
    expect(config.recoveryFn).toHaveBeenCalled();
    expect(mockError).toHaveBeenCalledWith('Error recovery failed', recoveryError, {
      operation: 'TestClass.testMethod',
      metadata: { originalError: error.code },
    });
  });

  it('should log and throw unknown error', async () => {
    const error = new Error('Unknown error');

    const instance = createDecoratedTestClass(error);
    await expect(instance.testMethod()).rejects.toThrow(error);
    expect(mockError).toHaveBeenCalledWith(`Unhandled error: ${error.message}`, error, {
      operation: 'TestClass.testMethod',
      metadata: { errorName: error.name, errorType: 'unhandled' },
    });
  });

  it('should use custom context from config', async () => {
    const error = new Error('Test error');
    const config: ErrorRecoveryConfig = { context: 'CustomContext' };

    const instance = createDecoratedTestClass(error, config);
    await expect(instance.testMethod()).rejects.toThrow(error);
    expect(mockError).toHaveBeenCalledWith(`Unhandled error: ${error.message}`, error, {
      operation: 'CustomContext.testMethod',
      metadata: { errorName: error.name, errorType: 'unhandled' },
    });
  });
});
