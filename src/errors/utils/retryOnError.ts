/* eslint-disable func-names */
import { StructuredLogger } from '../../observability';
import { BaseApplicationError } from '../base.error';
import { ErrorCode } from '../../types/errors';
import { FileSystemError } from '../file-system.error';
import { NetworkError } from '../network.error';
import { PinataError } from '../pinata.error';
import { SystemError } from '../system.error';
import { RetryConfig } from '../../types';

/**
 * Core error handling functions for decorators
 */

/**
 * Normalizes errors into BaseApplicationError
 */
function normalizeError(error: unknown, operation: string): BaseApplicationError {
  if (error instanceof BaseApplicationError) return error;
  if (error instanceof Error) return normalizeFromErrorInstance(error, operation);

  const message = typeof error === 'string' ? error : 'Unknown error occurred';
  return new SystemError(message, ErrorCode.UNKNOWN_ERROR, { operation });
}

/**
 * Normalizes Error instances into application errors
 */
function normalizeFromErrorInstance(error: Error, operation: string): BaseApplicationError {
  const context = { operation };

  if (isNetworkError(error)) {
    return new NetworkError(error.message, ErrorCode.NETWORK_UNAVAILABLE, context, true, error);
  }
  if (isFileSystemError(error)) {
    return new FileSystemError(error.message, ErrorCode.FILE_ACCESS_DENIED, context, error);
  }
  if (isPinataError(error)) {
    return new PinataError(error.message, ErrorCode.PINATA_UPLOAD_FAILED, context, true, error);
  }

  return new SystemError(error.message, ErrorCode.UNKNOWN_ERROR, context, error);
}

/**
 * Implements retry logic with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number,
  backoffMs: number,
  context: string
): Promise<T> {
  const logger = new StructuredLogger(context);
  let lastError: BaseApplicationError | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      logger.debug('Executing operation', { operation: operationName, attempt, maxRetries });
      return await operation();
    } catch (error) {
      const normalizedError = normalizeError(error, operationName);
      lastError = normalizedError;

      logRetryFailure(normalizedError, operationName, attempt, maxRetries, logger);

      if (!shouldRetry(normalizedError, attempt, maxRetries)) break;

      await delayWithBackoff(backoffMs, attempt, operationName, logger);
    }
  }

  if (!lastError) {
    throw new SystemError('Operation failed without captured error', ErrorCode.UNKNOWN_ERROR, {
      operation: operationName,
    });
  }

  throw lastError;
}

/**
 * Logs retry failure telemetry
 */
function logRetryFailure(
  error: BaseApplicationError,
  operationName: string,
  attempt: number,
  maxRetries: number,
  logger: StructuredLogger
): void {
  logger.warn('Operation failed', undefined, {
    operation: operationName,
    metadata: {
      attempt,
      maxRetries,
      errorCode: error.code,
      isRetryable: error.isRetryable,
      willRetry: shouldRetry(error, attempt, maxRetries),
    },
  });
}

/**
 * Determines whether the operation should be retried
 */
function shouldRetry(error: BaseApplicationError, attempt: number, maxRetries: number): boolean {
  return error.isRetryable && attempt < maxRetries;
}

/**
 * Waits for exponential backoff delay
 */
async function delayWithBackoff(
  backoffMs: number,
  attempt: number,
  operationName: string,
  logger: StructuredLogger
): Promise<void> {
  const delay = backoffMs * 2 ** (attempt - 1);
  logger.debug('Retrying after delay', { operation: operationName, delay, nextAttempt: attempt + 1 });
  return new Promise<void>(resolve => {
    setTimeout(resolve, delay);
  });
}

/**
 * Error type detection functions
 */
function isNetworkError(error: Error): boolean {
  const patterns = [/ECONNREFUSED/, /ENOTFOUND/, /ETIMEDOUT/, /ECONNRESET/, /timeout/i, /network/i];
  return patterns.some(pattern => pattern.test(error.message) || pattern.test(error.name));
}

function isFileSystemError(error: Error): boolean {
  const patterns = [/ENOENT/, /EACCES/, /EPERM/, /EMFILE/, /ENFILE/, /no such file/i, /permission denied/i];
  return patterns.some(pattern => pattern.test(error.message) || pattern.test(error.name));
}

function isPinataError(error: Error): boolean {
  const patterns = [/pinata/i, /ipfs/i, /unauthorized/i, /401/, /403/, /429/];
  return patterns.some(pattern => pattern.test(error.message) || pattern.test(error.name));
}

/**
 * Decorator that provides retry logic for the decorated method
 * @param config - Configuration for retry behavior
 */
export function retryOnError(config: RetryConfig = {}) {
  return function (target: object, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const context = config.context || target.constructor.name;
    const maxRetries = config.maxRetries || 3;
    const backoffMs = config.backoffMs || 1000;

    descriptor.value = async function retryOnErrorWrapper(...args: unknown[]) {
      return withRetry(
        () => originalMethod.apply(this, args),
        `${context}.${propertyKey}`,
        maxRetries,
        backoffMs,
        context
      );
    };

    return descriptor;
  };
}
