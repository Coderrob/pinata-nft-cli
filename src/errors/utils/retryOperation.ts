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
