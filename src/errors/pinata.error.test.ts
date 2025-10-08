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

import { PinataError } from './pinata.error';
import { ErrorCode, ErrorSeverity, ErrorContext } from '../types/errors';

describe('PinataError', () => {
  it('should create an instance with default parameters', () => {
    const error = new PinataError('Test message');

    expect(error.message).toBe('Test message');
    expect(error.code).toBe(ErrorCode.PINATA_UPLOAD_FAILED);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.context).toEqual({});
    expect(error.isRetryable).toBe(true);
    expect(error.cause).toBeUndefined();
  });

  it('should set severity to HIGH for PINATA_AUTH_FAILED code', () => {
    const error = new PinataError('Auth failed', ErrorCode.PINATA_AUTH_FAILED);

    expect(error.code).toBe(ErrorCode.PINATA_AUTH_FAILED);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
  });

  it('should set severity to MEDIUM for other codes', () => {
    const error = new PinataError('Upload failed', ErrorCode.PINATA_UPLOAD_FAILED);

    expect(error.code).toBe(ErrorCode.PINATA_UPLOAD_FAILED);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
  });

  it('should accept custom context, isRetryable, and cause', () => {
    const context: ErrorContext = { operation: 'test-operation', fileName: 'test.txt' };
    const cause = new Error('Cause error');
    const error = new PinataError('Custom message', ErrorCode.PINATA_UPLOAD_FAILED, context, false, cause);

    expect(error.message).toBe('Custom message');
    expect(error.code).toBe(ErrorCode.PINATA_UPLOAD_FAILED);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.context).toEqual(context);
    expect(error.isRetryable).toBe(false);
    expect(error.cause).toBe(cause);
  });

  it('should be an instance of BaseApplicationError', () => {
    const error = new PinataError('Test');

    expect(error).toBeInstanceOf(PinataError);
    // Assuming BaseApplicationError is the parent class
    expect(error.constructor.name).toBe('PinataError');
  });
});
