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

import { ProcessingError } from './processing.error';
import { ErrorCode, ErrorSeverity } from '../types/errors';
import { createErrorTests } from './error-test-utils';

describe('ProcessingError', () => {
  createErrorTests(
    (message, context, cause) => new ProcessingError(message, ErrorCode.PROCESSING_FAILED, context, cause),
    ErrorCode.PROCESSING_FAILED,
    ErrorSeverity.MEDIUM,
    false
  );

  it('should create an instance with custom code and context', () => {
    const context = { operation: 'test' };
    const error = new ProcessingError('Test message', ErrorCode.VALIDATION_ERROR, context);
    expect(error.message).toBe('Test message');
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.context).toEqual(context);
    expect(error.isRetryable).toBe(false);
    expect(error.cause).toBeUndefined();
  });

  it('should be an instance of BaseApplicationError', () => {
    const error = new ProcessingError('Test message');
    expect(error).toBeInstanceOf(Error);
  });
});
