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

import { BaseApplicationError } from './base.error';
import { ErrorCode, ErrorSeverity, ErrorContext } from '../types/errors';

// Concrete subclass for testing since BaseApplicationError is abstract
class TestApplicationError extends BaseApplicationError {
  constructor(
    message: string,
    code: ErrorCode,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: ErrorContext = {},
    isRetryable: boolean = false,
    cause?: Error
  ) {
    super(message, code, severity, context, isRetryable, cause);
  }
}

describe('BaseApplicationError', () => {
  const testMessage = 'Test error message';
  const testCode = ErrorCode.UNKNOWN_ERROR;
  const testSeverity = ErrorSeverity.HIGH;
  const testContext: ErrorContext = { operation: 'testOp', fileName: 'test.txt' };
  const testIsRetryable = true;
  const testCause = new Error('Cause error');

  describe('constructor', () => {
    it('should initialize with provided values', () => {
      const error = new TestApplicationError(
        testMessage,
        testCode,
        testSeverity,
        testContext,
        testIsRetryable,
        testCause
      );

      expect(error.message).toBe(testMessage);
      expect(error.name).toBe('TestApplicationError');
      expect(error.code).toBe(testCode);
      expect(error.severity).toBe(testSeverity);
      expect(error.context).toBe(testContext);
      expect(error.isRetryable).toBe(testIsRetryable);
      expect(error.cause).toBe(testCause);
      expect(error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should use default values when not provided', () => {
      const error = new TestApplicationError(testMessage, testCode);

      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.context).toEqual({});
      expect(error.isRetryable).toBe(false);
      expect(error.cause).toBeUndefined();
    });

    it('should extend Error and have proper prototype chain', () => {
      const error = new TestApplicationError(testMessage, testCode);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BaseApplicationError);
      expect(error).toBeInstanceOf(TestApplicationError);
    });

    it('should capture stack trace', () => {
      const error = new TestApplicationError(testMessage, testCode);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('TestApplicationError');
    });
  });

  describe('toJSON', () => {
    it('should return serializable error information', () => {
      const error = new TestApplicationError(
        testMessage,
        testCode,
        testSeverity,
        testContext,
        testIsRetryable,
        testCause
      );

      const json = error.toJSON();

      expect(json).toEqual({
        name: 'TestApplicationError',
        message: testMessage,
        code: testCode,
        severity: testSeverity,
        context: testContext,
        timestamp: error.timestamp,
        isRetryable: testIsRetryable,
        stack: error.stack,
      });
    });

    it('should exclude stack if not present', () => {
      const error = new TestApplicationError(testMessage, testCode);
      // Simulate no stack
      delete error.stack;

      const json = error.toJSON();

      expect(json.stack).toBeUndefined();
    });
  });
});
