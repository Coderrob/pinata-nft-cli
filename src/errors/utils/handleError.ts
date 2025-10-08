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
