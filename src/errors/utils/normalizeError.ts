import { BaseApplicationError } from '../base.error';
import { ErrorHandler } from '../error-handler';

/**
 * Error handling decorators for centralized error processing
 */
/**
 * Utility function to normalize errors (for backward compatibility)
 * @param error - Error to normalize
 * @param operation - Optional operation name
 * @param context - Optional context name
 */

export function normalizeError(
  error: unknown,
  operation?: string,
  context: string = 'ErrorHandler'
): BaseApplicationError {
  const errorHandler = new ErrorHandler(context);
  return errorHandler.normalizeError(error, operation);
}
