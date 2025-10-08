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

import { PinataService } from '../services';
import { PinataConfig, ProcessingOptions, RateLimitConfig } from '../types';
import { BaseFileProcessor } from './base.processor';

/**
 * Base class for processors that interact with Pinata service
 * Provides common Pinata service initialization and error handling patterns
 */
export abstract class BasePinataProcessor<TResult> extends BaseFileProcessor<TResult> {
  protected readonly pinataService: PinataService;

  constructor(
    processorName: string,
    config: PinataConfig,
    rateLimitConfig: RateLimitConfig = { maxConcurrent: 1, minTime: 3000 }
  ) {
    super(processorName, rateLimitConfig);
    this.pinataService = new PinataService(config);
  }

  /**
   * Common processing wrapper that handles validation, logging, and error handling
   * @param options - Processing options
   * @param processFn - The actual processing function to execute
   * @returns Processing result
   */
  protected async executeProcessing<T>(options: ProcessingOptions, processFn: () => Promise<T>): Promise<T> {
    this.validateOptions(options);
    this.logProcessingStart(options);

    try {
      return await processFn();
    } catch (error) {
      this.handleError(error);
    }
  }
}
