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

import { BaseApplicationError } from '../base.error';
import { ErrorHandler } from '../error-handler';

/**
 * Utility function to handle errors (for backward compatibility)
 * @param error - Error to handle
 * @param operation - Optional operation name
 * @param context - Optional context name
 */

export function handleError(
  error: Error | BaseApplicationError,
  operation?: string,
  context: string = 'ErrorHandler'
): never {
  const errorHandler = new ErrorHandler(context);
  throw errorHandler.handleError(error, operation);
}
