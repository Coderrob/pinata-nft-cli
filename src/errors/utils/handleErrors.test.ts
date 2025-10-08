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

import { handleErrors } from './handleErrors';
import { SystemError } from '../system.error';
import { ErrorCode } from '../../types/errors';

// Create shared mock function
const mockLoggerError = jest.fn();

// Mock StructuredLogger
jest.mock('../../observability', () => ({
  StructuredLogger: jest.fn().mockImplementation(() => ({
    error: mockLoggerError,
  })),
}));

describe('handleErrors', () => {
  afterEach(() => {
    jest.clearAllMocks();
    mockLoggerError.mockClear();
  });

  describe('synchronous methods', () => {
    class TestClass {
      @handleErrors()
      syncMethodThrowsBaseError() {
        throw new SystemError('Test error', ErrorCode.UNKNOWN_ERROR, {}, new Error());
      }

      @handleErrors()
      syncMethodThrowsUnknownError() {
        throw new Error('Unknown error');
      }

      @handleErrors()
      syncMethodSucceeds() {
        return 'success';
      }

      @handleErrors({ context: 'CustomContext' })
      syncMethodWithCustomContext() {
        throw new SystemError('Test error', ErrorCode.UNKNOWN_ERROR, {}, new Error());
      }
    }

    it('should log and re-throw SystemError for sync method', () => {
      const instance = new TestClass();
      expect(() => instance.syncMethodThrowsBaseError()).toThrow(SystemError);
      expect(mockLoggerError).toHaveBeenCalledWith(
        'SystemError: Test error',
        expect.any(SystemError),
        expect.objectContaining({
          operation: 'TestClass.syncMethodThrowsBaseError',
          metadata: expect.objectContaining({ code: ErrorCode.UNKNOWN_ERROR }),
        })
      );
    });

    it('should log and re-throw unknown Error for sync method', () => {
      const instance = new TestClass();
      expect(() => instance.syncMethodThrowsUnknownError()).toThrow(Error);
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Unhandled error: Unknown error',
        expect.any(Error),
        expect.objectContaining({
          operation: 'TestClass.syncMethodThrowsUnknownError',
          metadata: { errorName: 'Error', errorType: 'unhandled' },
        })
      );
    });

    it('should return result for sync method without error', () => {
      const instance = new TestClass();
      const result = instance.syncMethodSucceeds();
      expect(result).toBe('success');
      expect(mockLoggerError).not.toHaveBeenCalled();
    });

    it('should use custom context for sync method', () => {
      const instance = new TestClass();
      expect(() => instance.syncMethodWithCustomContext()).toThrow(SystemError);
      expect(mockLoggerError).toHaveBeenCalledWith(
        'SystemError: Test error',
        expect.any(SystemError),
        expect.objectContaining({
          operation: 'CustomContext.syncMethodWithCustomContext',
        })
      );
    });
  });

  describe('asynchronous methods', () => {
    class TestClass {
      @handleErrors()
      async asyncMethodThrowsBaseError() {
        throw new SystemError('Test error', ErrorCode.UNKNOWN_ERROR, {}, new Error());
      }

      @handleErrors()
      async asyncMethodThrowsUnknownError() {
        throw new Error('Unknown error');
      }

      @handleErrors()
      async asyncMethodSucceeds() {
        return 'success';
      }

      @handleErrors({ context: 'CustomContext' })
      async asyncMethodWithCustomContext() {
        throw new SystemError('Test error', ErrorCode.UNKNOWN_ERROR, {}, new Error());
      }
    }

    it('should log and re-throw SystemError for async method', async () => {
      const instance = new TestClass();
      await expect(instance.asyncMethodThrowsBaseError()).rejects.toThrow(SystemError);
      expect(mockLoggerError).toHaveBeenCalledWith(
        'SystemError: Test error',
        expect.any(SystemError),
        expect.objectContaining({
          operation: 'TestClass.asyncMethodThrowsBaseError',
          metadata: expect.objectContaining({ code: ErrorCode.UNKNOWN_ERROR }),
        })
      );
    });

    it('should log and re-throw unknown Error for async method', async () => {
      const instance = new TestClass();
      await expect(instance.asyncMethodThrowsUnknownError()).rejects.toThrow(Error);
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Unhandled error: Unknown error',
        expect.any(Error),
        expect.objectContaining({
          operation: 'TestClass.asyncMethodThrowsUnknownError',
          metadata: { errorName: 'Error', errorType: 'unhandled' },
        })
      );
    });

    it('should return result for async method without error', async () => {
      const instance = new TestClass();
      const result = await instance.asyncMethodSucceeds();
      expect(result).toBe('success');
      expect(mockLoggerError).not.toHaveBeenCalled();
    });

    it('should use custom context for async method', async () => {
      const instance = new TestClass();
      await expect(instance.asyncMethodWithCustomContext()).rejects.toThrow(SystemError);
      expect(mockLoggerError).toHaveBeenCalledWith(
        'SystemError: Test error',
        expect.any(SystemError),
        expect.objectContaining({
          operation: 'CustomContext.asyncMethodWithCustomContext',
        })
      );
    });
  });
});
