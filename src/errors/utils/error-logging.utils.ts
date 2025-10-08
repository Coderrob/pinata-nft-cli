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

import { StructuredLogger } from '../../observability';
import { LogContext } from '../../types';
import { BaseApplicationError } from '../base.error';

/**
 * Logs an application error with structured context
 */
export function logApplicationError(error: BaseApplicationError, operation: string, logger: StructuredLogger): void {
  const logContext: LogContext = {
    operation,
    ...(error.context.requestId && { requestId: error.context.requestId }),
    metadata: {
      code: error.code,
      severity: error.severity,
      isRetryable: error.isRetryable,
      timestamp: error.timestamp,
      context: error.context,
    },
  };
  logger.error(`${error.constructor.name}: ${error.message}`, error, logContext);
}

/**
 * Logs an unknown error
 */
export function logUnknownError(error: Error, operation: string, logger: StructuredLogger): void {
  logger.error(`Unhandled error: ${error.message}`, error, {
    operation,
    metadata: { errorName: error.name, errorType: 'unhandled' },
  });
}
