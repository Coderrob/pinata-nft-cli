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

import { SystemError } from './system.error';
import { BaseApplicationError } from './base.error';
import { ErrorCode, ErrorSeverity } from '../types/errors';

describe('SystemError', () => {
  it('should create an instance with default parameters', () => {
    const error = new SystemError('Test message');
    expect(error).toBeInstanceOf(SystemError);
    expect(error).toBeInstanceOf(BaseApplicationError);
    expect(error.message).toBe('Test message');
    expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
    expect(error.context).toEqual({});
    expect(error.cause).toBeUndefined();
  });

  it('should set severity to CRITICAL for INSUFFICIENT_MEMORY code', () => {
    const error = new SystemError('Memory error', ErrorCode.INSUFFICIENT_MEMORY);
    expect(error.severity).toBe(ErrorSeverity.CRITICAL);
  });

  it('should set severity to CRITICAL for DISK_FULL code', () => {
    const error = new SystemError('Disk error', ErrorCode.DISK_FULL);
    expect(error.severity).toBe(ErrorSeverity.CRITICAL);
  });

  it('should set severity to HIGH for other codes', () => {
    const error = new SystemError('Other error', ErrorCode.FILE_NOT_FOUND);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
  });

  it('should accept custom context', () => {
    const context = { operation: 'test' };
    const error = new SystemError('Test', ErrorCode.UNKNOWN_ERROR, context);
    expect(error.context).toEqual(context);
  });

  it('should accept a cause error', () => {
    const cause = new Error('Cause');
    const error = new SystemError('Test', ErrorCode.UNKNOWN_ERROR, {}, cause);
    expect(error.cause).toBe(cause);
  });

  it('should pass all parameters correctly to super', () => {
    const message = 'Custom message';
    const code = ErrorCode.INSUFFICIENT_MEMORY;
    const context = { operation: 'test' };
    const cause = new Error('Root cause');
    const error = new SystemError(message, code, context, cause);
    expect(error.message).toBe(message);
    expect(error.code).toBe(code);
    expect(error.severity).toBe(ErrorSeverity.CRITICAL);
    expect(error.context).toEqual(context);
    expect(error.cause).toBe(cause);
  });
});
