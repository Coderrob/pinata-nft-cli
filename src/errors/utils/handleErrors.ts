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
import { ErrorHandlerConfig } from '../error-handler';
import { logApplicationError, logUnknownError } from './error-logging.utils';

/**
 * Handles and logs errors, then re-throws
 */
function handleError(error: Error | BaseApplicationError, operation: string, context: string): never {
  const logger = new StructuredLogger(context);

  if (error instanceof BaseApplicationError) {
    logApplicationError(error, operation, logger);
  } else {
    logUnknownError(error, operation, logger);
  }

  throw error;
}

/**
 * Decorator that handles errors thrown by the decorated method
 * @param config - Configuration for error handling
 */
export function handleErrors(
  config: ErrorHandlerConfig = {}
): (target: object, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor {
  return function (target: object, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const context = config.context || target.constructor.name;

    descriptor.value = function descriptorValue(...args: unknown[]) {
      try {
        const result = originalMethod.apply(this, args);

        // Handle both sync and async methods
        if (result instanceof Promise) {
          return result.catch((error: unknown) => {
            handleError(error as Error | BaseApplicationError, `${context}.${propertyKey}`, context);
          });
        }

        return result;
      } catch (error) {
        handleError(error as Error | BaseApplicationError, `${context}.${propertyKey}`, context);
      }
    };

    return descriptor;
  };
}
