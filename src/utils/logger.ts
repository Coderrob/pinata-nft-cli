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

import { LogContext, LogLevel, StructuredLogger } from '../observability';

/**
 * Enhanced logger that wraps StructuredLogger for backward compatibility
 * while providing improved observability features
 */
export class Logger {
  private readonly structuredLogger: StructuredLogger;

  constructor(context: string) {
    this.structuredLogger = new StructuredLogger(context, LogLevel.INFO);
  }

  /**
   * Logs an info message with context
   * @param message - The message to log
   * @param data - Optional data to include
   * @param logContext - Optional structured context
   */
  public info(message: string, data?: unknown, logContext?: LogContext): void {
    this.structuredLogger.info(message, data, logContext);
  }

  /**
   * Logs a warning message with context
   * @param message - The message to log
   * @param data - Optional data to include
   * @param logContext - Optional structured context
   */
  public warn(message: string, data?: unknown, logContext?: LogContext): void {
    this.structuredLogger.warn(message, data, logContext);
  }

  /**
   * Logs an error message with context
   * @param message - The message to log
   * @param error - Optional error object
   * @param logContext - Optional structured context
   */
  public error(message: string, error?: unknown, logContext?: LogContext): void {
    this.structuredLogger.error(message, error, logContext);
  }

  /**
   * Logs a debug message with context
   * @param message - The message to log
   * @param data - Optional data to include
   * @param logContext - Optional structured context
   */
  public debug(message: string, data?: unknown, logContext?: LogContext): void {
    this.structuredLogger.debug(message, data, logContext);
  }

  /**
   * Start operation timing for performance monitoring
   * @param operation - Operation name
   * @param metadata - Optional metadata
   */
  public startOperation(operation: string, metadata?: Record<string, unknown>) {
    return this.structuredLogger.startOperation(operation, metadata);
  }

  /**
   * Get the underlying structured logger for advanced usage
   */
  public getStructuredLogger(): StructuredLogger {
    return this.structuredLogger;
  }
}
