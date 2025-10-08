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

/* eslint-disable func-names */

import { StructuredLogger } from '../../observability';
import { BaseApplicationError } from '../base.error';
import { ErrorRecoveryConfig } from '../error-handler';
import { logApplicationError, logUnknownError } from './error-logging.utils';

/**
 * Handles errors with recovery attempt
 */
async function handleErrorWithRecovery<T>(
  error: Error | BaseApplicationError,
  operation: string,
  context: string,
  recoveryFn?: () => Promise<T>
): Promise<T> {
  const logger = new StructuredLogger(context);

  if (error instanceof BaseApplicationError) {
    logApplicationError(error, operation, logger);

    if (error.isRetryable && recoveryFn) {
      logger.info('Attempting error recovery', {
        operation,
        errorCode: error.code,
        isRetryable: error.isRetryable,
      });

      try {
        return await recoveryFn();
      } catch (recoveryError) {
        logger.error('Error recovery failed', recoveryError as Error, {
          operation,
          metadata: { originalError: error.code },
        });
        throw error; // Throw original error
      }
    }
  } else {
    logUnknownError(error, operation, logger);
  }

  throw error;
}

/**
 * Decorator that handles errors with recovery attempts
 * @param config - Configuration for error recovery
 */
export function handleErrorsWithRecovery(
  config: ErrorRecoveryConfig = {}
): (target: object, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor {
  return function (target: object, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const context = config.context || target.constructor.name;

    descriptor.value = async function descriptorValue(...args: unknown[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        return handleErrorWithRecovery(
          error as Error | BaseApplicationError,
          `${context}.${propertyKey}`,
          context,
          config.recoveryFn
        );
      }
    };

    return descriptor;
  };
}
