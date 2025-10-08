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

/**
 * Error codes for application errors
 */
export enum ErrorCode {
  // Configuration errors
  CONFIG_INVALID = 'CONFIG_INVALID',
  CONFIG_MISSING = 'CONFIG_MISSING',

  // File system errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_ACCESS_DENIED = 'FILE_ACCESS_DENIED',
  DIRECTORY_NOT_FOUND = 'DIRECTORY_NOT_FOUND',
  DIRECTORY_ACCESS_DENIED = 'DIRECTORY_ACCESS_DENIED',

  // Network errors
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_UNAVAILABLE = 'NETWORK_UNAVAILABLE',
  API_ERROR = 'API_ERROR',

  // Pinata specific errors
  PINATA_AUTH_FAILED = 'PINATA_AUTH_FAILED',
  PINATA_UPLOAD_FAILED = 'PINATA_UPLOAD_FAILED',
  PINATA_RATE_LIMITED = 'PINATA_RATE_LIMITED',

  // Processing errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  HASH_CALCULATION_FAILED = 'HASH_CALCULATION_FAILED',
  CID_CALCULATION_FAILED = 'CID_CALCULATION_FAILED',

  // System errors
  INSUFFICIENT_MEMORY = 'INSUFFICIENT_MEMORY',
  DISK_FULL = 'DISK_FULL',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error context interface
 */
export interface ErrorContext {
  readonly operation?: string;
  readonly requestId?: string;
  readonly userId?: string;
  readonly fileName?: string;
  readonly filePath?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Application error interface
 */
export interface IApplicationError {
  name: string;
  message: string;
  code: ErrorCode;
  severity: ErrorSeverity;
  context: ErrorContext;
  timestamp: string;
  isRetryable: boolean;
  stack?: string;
}

/**
 * Configuration for error handling decorator
 */
export interface ErrorHandlerConfig {
  /** Context name for logging */
  context?: string;
  /** Whether to re-throw errors after handling */
  rethrow?: boolean;
}

/**
 * Configuration for retry decorator
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Base backoff delay in milliseconds */
  backoffMs?: number;
  /** Context name for logging */
  context?: string;
}

/**
 * Configuration for error recovery decorator
 */
export interface ErrorRecoveryConfig {
  /** Context name for logging */
  context?: string;
  /** Recovery function to call on retryable errors */
  recoveryFn?: () => Promise<unknown>;
}
