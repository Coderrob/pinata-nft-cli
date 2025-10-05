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

import Bottleneck from 'bottleneck';

import { IFileProcessor, ProcessingOptions, RateLimitConfig } from '../types';
import { isNonEmptyString, Logger } from '../utils';

export abstract class BaseFileProcessor<TResult> implements IFileProcessor<TResult> {
  protected readonly logger: Logger;
  protected readonly rateLimiter: Bottleneck;

  constructor(
    protected readonly processorName: string,
    rateLimitConfig: RateLimitConfig = { maxConcurrent: 5 }
  ) {
    this.logger = new Logger(processorName);
    this.rateLimiter = new Bottleneck(rateLimitConfig);
  }

  /**
   * Abstract method to be implemented by concrete processors
   */
  public abstract process(options: ProcessingOptions): Promise<TResult>;

  /**
   * Validates processing options
   * @param options - The processing options to validate
   */
  protected validateOptions(options: ProcessingOptions): void {
    if (!isNonEmptyString(options.folderPath)) {
      throw new Error('Folder path is required');
    }

    if (!isNonEmptyString(options.outputPath)) {
      throw new Error('Output path is required');
    }
  }

  /**
   * Logs the start of processing
   * @param options - The processing options
   */
  protected logProcessingStart(options: ProcessingOptions): void {
    this.logger.info(`Starting ${this.processorName} processing`, {
      folderPath: options.folderPath,
      outputPath: options.outputPath,
    });
  }

  /**
   * Logs the completion of processing
   * @param fileCount - Number of files processed
   */
  protected logProcessingComplete(fileCount: number): void {
    this.logger.info(`${this.processorName} processing completed`, {
      filesProcessed: fileCount,
    });
  }

  /**
   * Handles processing errors
   * @param error - The error that occurred
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected handleError(error: any): never {
    this.logger.error(`${this.processorName} processing failed`, error);
    throw error;
  }
}
