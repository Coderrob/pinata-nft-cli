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

import { FileSystemError } from './file-system.error';
import { ErrorCode, ErrorSeverity } from '../types/errors';

describe('FileSystemError', () => {
  it('should create an instance with default values', () => {
    const error = new FileSystemError('Test message');
    expect(error).toBeInstanceOf(FileSystemError);
    expect(error.message).toBe('Test message');
    expect(error.code).toBe(ErrorCode.FILE_NOT_FOUND);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.context).toEqual({});
    expect(error.cause).toBeUndefined();
  });

  it('should create an instance with custom code', () => {
    const error = new FileSystemError('Test message', ErrorCode.FILE_ACCESS_DENIED);
    expect(error.code).toBe(ErrorCode.FILE_ACCESS_DENIED);
  });

  it('should create an instance with custom context', () => {
    const context = { filePath: '/test/path' };
    const error = new FileSystemError('Test message', undefined, context);
    expect(error.context).toEqual(context);
  });

  it('should create an instance with custom cause', () => {
    const cause = new Error('Underlying error');
    const error = new FileSystemError('Test message', undefined, undefined, cause);
    expect(error.cause).toBe(cause);
  });

  it('should create an instance with all custom parameters', () => {
    const context = { filePath: '/test/path' };
    const cause = new Error('Underlying error');
    const error = new FileSystemError('Test message', ErrorCode.FILE_ACCESS_DENIED, context, cause);
    expect(error.message).toBe('Test message');
    expect(error.code).toBe(ErrorCode.FILE_ACCESS_DENIED);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.context).toEqual(context);
    expect(error.cause).toBe(cause);
  });
});
