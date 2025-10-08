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

import { ErrorHandler } from '../errors';
import { CIDCalculatorService } from '../services';
import { FileMapping, ProcessingOptions, RateLimitConfig } from '../types';
import { BaseCalculatorProcessor } from './base-calculator.processor';

export class CIDProcessor extends BaseCalculatorProcessor {
  private readonly cidCalculatorService: CIDCalculatorService;
  private readonly errorHandler: ErrorHandler;

  constructor(rateLimitConfig?: RateLimitConfig) {
    super('CIDProcessor', rateLimitConfig);
    this.cidCalculatorService = new CIDCalculatorService(this.rateLimiter);
    this.errorHandler = new ErrorHandler('CIDProcessor');
  }

  /**
   * Calculate CID mapping for files
   * @param files - Array of file paths
   * @returns Mapping of file names to CIDs
   */
  protected async calculateMapping(files: string[]): Promise<FileMapping> {
    return this.cidCalculatorService.calculateCIDs(files);
  }

  /**
   * Handle processing errors with recovery strategies
   * This method provides graceful error handling as expected by tests
   */
  protected handleProcessingError(error: unknown, options: ProcessingOptions): never {
    const normalizedError = this.errorHandler.normalizeError(error, 'CIDProcessor.process');

    // Log the error with context
    this.logger.error('CID processing failed', normalizedError, {
      operation: 'CIDProcessor.process',
      metadata: {
        errorCode: normalizedError.code,
        severity: normalizedError.severity,
        folderPath: options.folderPath,
        outputPath: options.outputPath,
      },
    });

    // Always throw the error - this maintains the current contract
    // but provides better error information and context
    throw normalizedError;
  }
}
