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

import { ConfigurationError } from './configuration.error';
import { BaseApplicationError } from './base.error';
import { ErrorCode, ErrorContext, ErrorSeverity } from '../types/errors';

describe('ConfigurationError', () => {
  it('should create an instance with default context and no cause', () => {
    const message = 'Test configuration error';
    const error = new ConfigurationError(message);

    expect(error).toBeInstanceOf(ConfigurationError);
    expect(error).toBeInstanceOf(BaseApplicationError);
    expect(error.message).toBe(message);
    expect(error.code).toBe(ErrorCode.CONFIG_INVALID);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
    expect(error.isRetryable).toBe(false);
    expect(error.context).toEqual({});
    expect(error.cause).toBeUndefined();
  });

  it('should create an instance with custom context', () => {
    const message = 'Test configuration error';
    const context: ErrorContext = {};
    const error = new ConfigurationError(message, context);

    expect(error.context).toEqual(context);
  });

  it('should create an instance with a cause', () => {
    const message = 'Test configuration error';
    const cause = new Error('Underlying error');
    const error = new ConfigurationError(message, {}, cause);

    expect(error.cause).toBe(cause);
  });

  it('should create an instance with custom context and cause', () => {
    const message = 'Test configuration error';
    const context: ErrorContext = {};
    const cause = new Error('Underlying error');
    const error = new ConfigurationError(message, context, cause);

    expect(error.context).toEqual(context);
    expect(error.cause).toBe(cause);
  });
});
