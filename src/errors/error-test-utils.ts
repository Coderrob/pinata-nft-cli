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

import { BaseApplicationError } from '../errors/base.error';
import { ErrorCode, ErrorSeverity, ErrorContext } from '../types/errors';

/**
 * Helper function to test error creation with different parameters
 */
export function createErrorTests(
  createError: (message: string, context?: ErrorContext, cause?: Error) => BaseApplicationError,
  expectedCode: ErrorCode,
  expectedSeverity: ErrorSeverity,
  expectedIsRetryable: boolean
): void {
  it('should create an instance with message only', () => {
    const message = 'Test error message';
    const error = createError(message);

    expect(error).toBeInstanceOf(BaseApplicationError);
    expect(error.message).toBe(message);
    expect(error.code).toBe(expectedCode);
    expect(error.severity).toBe(expectedSeverity);
    expect(error.context).toEqual({});
    expect(error.isRetryable).toBe(expectedIsRetryable);
    expect(error.cause).toBeUndefined();
  });

  it('should create an instance with message and context', () => {
    const message = 'Test error message';
    const context = { operation: 'test', metadata: { field: 'test' } };
    const error = createError(message, context);

    expect(error.message).toBe(message);
    expect(error.context).toEqual(context);
    expect(error.code).toBe(expectedCode);
    expect(error.severity).toBe(expectedSeverity);
    expect(error.isRetryable).toBe(expectedIsRetryable);
    expect(error.cause).toBeUndefined();
  });

  it('should create an instance with message, context, and cause', () => {
    const message = 'Test error message';
    const context = { operation: 'test', metadata: { field: 'test' } };
    const cause = new Error('Underlying error');
    const error = createError(message, context, cause);

    expect(error.message).toBe(message);
    expect(error.context).toEqual(context);
    expect(error.cause).toBe(cause);
    expect(error.code).toBe(expectedCode);
    expect(error.severity).toBe(expectedSeverity);
    expect(error.isRetryable).toBe(expectedIsRetryable);
  });
}
