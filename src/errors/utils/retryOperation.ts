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

import { ErrorHandler } from '../error-handler';

/**
 * Utility function for retry logic (for backward compatibility)
 * @param operation - Operation to retry
 * @param operationName - Name of the operation
 * @param maxRetries - Maximum retry attempts
 * @param backoffMs - Backoff delay
 * @param context - Optional context name
 */

export async function retryOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3,
  backoffMs: number = 1000,
  context: string = 'ErrorHandler'
): Promise<T> {
  const errorHandler = new ErrorHandler(context);
  return errorHandler.withRetry(operation, operationName, maxRetries, backoffMs);
}
