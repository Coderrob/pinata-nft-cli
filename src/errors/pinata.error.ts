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

import { BaseApplicationError } from './base.error';
import { ErrorCode, ErrorContext, ErrorSeverity } from '../types/errors';

/**
 * Pinata API specific errors
 */

export class PinataError extends BaseApplicationError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.PINATA_UPLOAD_FAILED,
    context: ErrorContext = {},
    isRetryable: boolean = true,
    cause?: Error
  ) {
    const severity = code === ErrorCode.PINATA_AUTH_FAILED ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;
    super(message, code, severity, context, isRetryable, cause);
  }
}
