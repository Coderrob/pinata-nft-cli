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

import { NetworkError } from './network.error';
import { ErrorCode, ErrorSeverity } from '../types/errors';

describe('NetworkError', () => {
  it('should create an instance with default values', () => {
    const error = new NetworkError('Network error occurred');

    expect(error).toBeInstanceOf(NetworkError);
    expect(error.message).toBe('Network error occurred');
    expect(error.code).toBe(ErrorCode.NETWORK_UNAVAILABLE);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.context).toEqual({});
    expect(error.isRetryable).toBe(true);
    expect(error.cause).toBeUndefined();
  });

  it('should create an instance with custom values', () => {
    const context = { operation: 'api-call', metadata: { url: 'https://example.com' } };
    const cause = new Error('Underlying error');
    const error = new NetworkError('Custom network error', ErrorCode.NETWORK_TIMEOUT, context, false, cause);

    expect(error.message).toBe('Custom network error');
    expect(error.code).toBe(ErrorCode.NETWORK_TIMEOUT);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.context).toEqual(context);
    expect(error.isRetryable).toBe(false);
    expect(error.cause).toBe(cause);
  });

  it('should inherit from BaseApplicationError', () => {
    const error = new NetworkError('Test error');

    expect(error).toBeInstanceOf(Error);
  });
});
