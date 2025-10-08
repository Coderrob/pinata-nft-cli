/* eslint-disable dot-notation */
import { ErrorHandler } from './error-handler';
import { ErrorCode } from '../types/errors';
import { FileSystemError } from './file-system.error';
import { NetworkError } from './network.error';
import { PinataError } from './pinata.error';
import { SystemError } from './system.error';
import { StructuredLogger } from '../observability';

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

// Mock the StructuredLogger
jest.mock('../observability', () => ({
  StructuredLogger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let mockLogger: StructuredLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    errorHandler = new ErrorHandler('TestContext');
    mockLogger = errorHandler['logger'];
  });

  describe('constructor', () => {
    it('should initialize with default context', () => {
      const handler = new ErrorHandler();
      expect(handler).toBeInstanceOf(ErrorHandler);
    });

    it('should initialize with custom context', () => {
      expect(errorHandler).toBeInstanceOf(ErrorHandler);
    });
  });

  describe('handleError', () => {
    it('should log and throw BaseApplicationError', () => {
      const error = new SystemError('Test error', ErrorCode.UNKNOWN_ERROR, { operation: 'test' });
      expect(() => errorHandler.handleError(error, 'testOp')).toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'SystemError: Test error',
        error,
        expect.objectContaining({ operation: 'testOp' })
      );
    });

    it('should log and throw unknown Error', () => {
      const error = new Error('Unknown error');
      expect(() => errorHandler.handleError(error, 'testOp')).toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unhandled error: Unknown error',
        error,
        expect.objectContaining({ operation: 'testOp' })
      );
    });
  });

  describe('handleErrorWithRecovery', () => {
    it('should attempt recovery for retryable error and succeed', async () => {
      const error = new NetworkError('Network error', ErrorCode.NETWORK_UNAVAILABLE, { operation: 'test' }, true);
      const recoveryFn = jest.fn().mockResolvedValue('recovered');
      const result = await errorHandler.handleErrorWithRecovery(error, 'testOp', recoveryFn);
      expect(result).toBe('recovered');
      expect(mockLogger.info).toHaveBeenCalledWith('Attempting error recovery', expect.any(Object));
    });

    it('should attempt recovery and throw original error on recovery failure', async () => {
      const error = new NetworkError('Network error', ErrorCode.NETWORK_UNAVAILABLE, { operation: 'test' }, true);
      const recoveryFn = jest.fn().mockRejectedValue(new Error('Recovery failed'));
      await expect(errorHandler.handleErrorWithRecovery(error, 'testOp', recoveryFn)).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith('Error recovery failed', expect.any(Error), expect.any(Object));
    });

    it('should log and throw unknown Error without recovery', async () => {
      const error = new Error('Unknown error');
      await expect(errorHandler.handleErrorWithRecovery(error, 'testOp')).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('normalizeError', () => {
    it('should return BaseApplicationError as is', () => {
      const error = new SystemError('Test', ErrorCode.UNKNOWN_ERROR, {});
      const result = errorHandler.normalizeError(error);
      expect(result).toBe(error);
    });

    it('should normalize network Error to NetworkError', () => {
      const error = new Error('ECONNREFUSED: Connection refused');
      const result = errorHandler.normalizeError(error, 'testOp');
      expect(result).toBeInstanceOf(NetworkError);
      expect(result.code).toBe(ErrorCode.NETWORK_UNAVAILABLE);
    });

    it('should normalize file system Error to FileSystemError', () => {
      const error = new Error('ENOENT: No such file');
      const result = errorHandler.normalizeError(error, 'testOp');
      expect(result).toBeInstanceOf(FileSystemError);
      expect(result.code).toBe(ErrorCode.FILE_ACCESS_DENIED);
    });

    it('should normalize Pinata Error to PinataError', () => {
      const error = new Error('Pinata upload failed');
      const result = errorHandler.normalizeError(error, 'testOp');
      expect(result).toBeInstanceOf(PinataError);
      expect(result.code).toBe(ErrorCode.PINATA_UPLOAD_FAILED);
    });

    it('should normalize unknown Error to SystemError', () => {
      const error = new Error('Some error');
      const result = errorHandler.normalizeError(error, 'testOp');
      expect(result).toBeInstanceOf(SystemError);
      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
    });

    it('should normalize non-Error to SystemError', () => {
      const result = errorHandler.normalizeError('string error', 'testOp');
      expect(result).toBeInstanceOf(SystemError);
      expect(result.message).toBe('string error');
    });

    it('should normalize unknown object to SystemError', () => {
      const result = errorHandler.normalizeError({}, 'testOp');
      expect(result).toBeInstanceOf(SystemError);
      expect(result.message).toBe('Unknown error occurred');
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await errorHandler.withRetry(operation, 'testOp');
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockLogger.debug).toHaveBeenCalledWith('Executing operation', expect.any(Object));
    });

    it('should retry on failure and succeed', async () => {
      const operation = jest.fn().mockRejectedValueOnce(new Error('Fail')).mockResolvedValueOnce('success');
      const result = await errorHandler.withRetry(operation, 'testOp', 3, 10);
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Retrying after delay', expect.any(Object));
    });

    it('should fail after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent fail'));
      await expect(errorHandler.withRetry(operation, 'testOp', 2, 10)).rejects.toThrow(SystemError);
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Non-retryable'));
      // Mock normalizeError to return non-retryable error
      jest
        .spyOn(errorHandler, 'normalizeError')
        .mockReturnValue(new FileSystemError('Non-retryable', ErrorCode.FILE_NOT_FOUND, {}));
      await expect(errorHandler.withRetry(operation, 'testOp', 3, 10)).rejects.toThrow(FileSystemError);
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });
});
