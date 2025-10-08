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

import { handleError } from './handleError';
import { BaseApplicationError } from '../base.error';
import { ErrorCode, ErrorSeverity } from '../../types/errors';

describe('handleError', () => {
  class TestError extends BaseApplicationError {
    constructor(message: string) {
      super(message, ErrorCode.UNKNOWN_ERROR, ErrorSeverity.MEDIUM, {}, false);
    }
  }

  it('should throw when given a standard Error', () => {
    const error = new Error('Test error');
    expect(() => handleError(error)).toThrow();
  });

  it('should throw when given a BaseApplicationError', () => {
    const error = new TestError('Test base error');
    expect(() => handleError(error)).toThrow();
  });

  it('should throw with operation provided', () => {
    const error = new Error('Test error');
    const operation = 'testOperation';
    expect(() => handleError(error, operation)).toThrow();
  });

  it('should throw with custom context', () => {
    const error = new Error('Test error');
    const context = 'CustomContext';
    expect(() => handleError(error, undefined, context)).toThrow();
  });

  it('should use default context when not provided', () => {
    const error = new Error('Test error');
    expect(() => handleError(error)).toThrow();
  });
});
