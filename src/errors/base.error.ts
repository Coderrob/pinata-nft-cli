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

import { ErrorCode, ErrorSeverity, ErrorContext, IApplicationError } from '../types/errors';

/**
 * Base application error class
 */
export abstract class BaseApplicationError extends Error implements IApplicationError {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly timestamp: string;
  public readonly isRetryable: boolean;
  public readonly cause?: Error;

  constructor(
    message: string,
    code: ErrorCode,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: ErrorContext = {},
    isRetryable: boolean = false,
    cause?: Error
  ) {
    super(message);

    this.name = this.constructor.name;
    this.code = code;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.isRetryable = isRetryable;

    if (cause) {
      this.cause = cause;
    }

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get serializable error information
   */
  public toJSON(): IApplicationError {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: IApplicationError = {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      context: this.context,
      ...(this.stack && { stack: this.stack }),
      timestamp: this.timestamp,
      isRetryable: this.isRetryable,
    };

    return result;
  }
}
