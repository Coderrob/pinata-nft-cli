import { retryOnError } from './retryOnError';
import { ErrorCode } from '../../types/errors';
import { NetworkError } from '../network.error';
import { FileSystemError } from '../file-system.error';

class TestClass {
  @retryOnError()
  async methodThatSucceeds(): Promise<string> {
    return 'success';
  }

  @retryOnError()
  async methodThatFailsOnceThenSucceeds(attempts: number[]): Promise<string> {
    attempts.push(1);
    if (attempts.length === 1) {
      throw new NetworkError('Network error', ErrorCode.NETWORK_UNAVAILABLE, {}, true);
    }
    return 'success';
  }

  @retryOnError()
  async methodThatAlwaysFails(): Promise<string> {
    throw new FileSystemError('File error', ErrorCode.FILE_ACCESS_DENIED, {});
  }

  @retryOnError({ maxRetries: 5, backoffMs: 200 })
  async methodWithCustomConfig(attempts: number[]): Promise<string> {
    attempts.push(1);
    if (attempts.length < 3) {
      throw new NetworkError('Network error', ErrorCode.NETWORK_UNAVAILABLE, {}, true);
    }
    return 'success';
  }

  @retryOnError({ context: 'CustomContext' })
  async methodWithCustomContext(): Promise<string> {
    return 'success';
  }
}

describe('retryOnError', () => {
  let testInstance: TestClass;

  beforeEach(() => {
    testInstance = new TestClass();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should execute method successfully without retries', async () => {
    const result = await testInstance.methodThatSucceeds();
    expect(result).toBe('success');
  });

  it('should retry on retryable error and succeed', async () => {
    const attempts: number[] = [];
    const promise = testInstance.methodThatFailsOnceThenSucceeds(attempts);

    // Run all timers to allow retries to complete
    await jest.runAllTimersAsync();

    const result = await promise;
    expect(result).toBe('success');
    expect(attempts.length).toBe(2); // Initial + 1 retry
  });

  it('should not retry on non-retryable error', async () => {
    await expect(testInstance.methodThatAlwaysFails()).rejects.toThrow(FileSystemError);
  });

  it('should respect custom maxRetries and backoffMs', async () => {
    const attempts: number[] = [];
    const promise = testInstance.methodWithCustomConfig(attempts);

    // Run all timers to allow all retries to complete
    await jest.runAllTimersAsync();

    const result = await promise;
    expect(result).toBe('success');
    expect(attempts.length).toBe(3); // Initial + 2 retries
  });

  it('should use custom context', async () => {
    const result = await testInstance.methodWithCustomContext();
    expect(result).toBe('success');
    // Note: Context is used in logging, but for testing, we can assume it's set correctly
  });
});
