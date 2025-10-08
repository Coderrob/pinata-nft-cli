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

import { normalizeError } from './normalizeError';
import { SystemError } from '../system.error';
import { ErrorHandler } from '../error-handler';

// Mock ErrorHandler to control its behavior in tests
jest.mock('../error-handler');

describe('normalizeError', () => {
  const mockNormalizeError = jest.fn();
  const mockErrorHandler = {
    normalizeError: mockNormalizeError,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    (ErrorHandler as jest.MockedClass<typeof ErrorHandler>).mockImplementation(() => mockErrorHandler as any);
  });

  it('should create ErrorHandler with default context and call normalizeError', () => {
    const error = new Error('Test error');
    const operation = 'testOp';
    const expectedResult = new SystemError('Normalized error');
    mockNormalizeError.mockReturnValue(expectedResult);

    const result = normalizeError(error, operation);

    expect(ErrorHandler).toHaveBeenCalledWith('ErrorHandler');
    expect(mockNormalizeError).toHaveBeenCalledWith(error, operation);
    expect(result).toBe(expectedResult);
  });

  it('should create ErrorHandler with custom context and call normalizeError', () => {
    const error = 'String error';
    const context = 'CustomContext';
    const expectedResult = new SystemError('Normalized string error');
    mockNormalizeError.mockReturnValue(expectedResult);

    const result = normalizeError(error, undefined, context);

    expect(ErrorHandler).toHaveBeenCalledWith(context);
    expect(mockNormalizeError).toHaveBeenCalledWith(error, undefined);
    expect(result).toBe(expectedResult);
  });

  it('should handle unknown error types', () => {
    const error = { custom: 'error' };
    const expectedResult = new SystemError('Normalized unknown error');
    mockNormalizeError.mockReturnValue(expectedResult);

    const result = normalizeError(error);

    expect(ErrorHandler).toHaveBeenCalledWith('ErrorHandler');
    expect(mockNormalizeError).toHaveBeenCalledWith(error, undefined);
    expect(result).toBe(expectedResult);
  });

  it('should handle null and undefined errors', () => {
    const error = null;
    const expectedResult = new SystemError('Normalized null error');
    mockNormalizeError.mockReturnValue(expectedResult);

    const result = normalizeError(error, 'op');

    expect(mockNormalizeError).toHaveBeenCalledWith(error, 'op');
    expect(result).toBe(expectedResult);
  });
});
