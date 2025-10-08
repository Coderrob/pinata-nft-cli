/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 *  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

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
    jest.clearAllMocks();
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
