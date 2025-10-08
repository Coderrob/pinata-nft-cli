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

import { FileService } from '../services';
import { FileMapping, ProcessingOptions, RateLimitConfig } from '../types';
import { ObjectUtils } from '../utils';
import { isEmptyArray } from '../utils/guards';
import { BaseFileProcessor } from './base.processor';

/**
 * Base class for processors that calculate file mappings (hashes, CIDs, etc.)
 * Provides common file processing and mapping calculation patterns
 */
export abstract class BaseCalculatorProcessor extends BaseFileProcessor<FileMapping> {
  protected readonly fileService = new FileService();

  constructor(processorName: string, rateLimitConfig?: RateLimitConfig) {
    super(processorName, rateLimitConfig);
  }

  /**
   * Abstract method to calculate mapping for files
   * @param files - Array of file paths to process
   * @returns Mapping of file names to calculated values
   */
  protected abstract calculateMapping(files: string[]): Promise<FileMapping>;

  /**
   * Common processing logic for calculator processors
   * @param options - Processing options
   * @returns File mapping result
   */
  protected async executeCalculation(options: ProcessingOptions): Promise<FileMapping> {
    const files = await this.fileService.readFiles(options.folderPath);

    if (isEmptyArray(files)) {
      this.logger.warn(`No files found in folder: ${options.folderPath}`);
      return {};
    }

    const mapping = await this.calculateMapping(files);
    const sortedMapping = ObjectUtils.sortObjectByKeys(mapping);

    await this.fileService.saveJson(options.outputPath, sortedMapping);
    this.logProcessingComplete(files.length);

    return sortedMapping;
  }

  /**
   * Processes files to calculate their mappings
   * @param options - Processing options including folder path and output path
   * @returns Object mapping file names to their calculated values
   */
  public async process(options: ProcessingOptions): Promise<FileMapping> {
    this.validateOptions(options);
    this.logProcessingStart(options);

    try {
      return await this.executeCalculation(options);
    } catch (error) {
      return this.handleProcessingError(error, options);
    }
  }

  /**
   * Handle processing errors with recovery strategies
   * Can be overridden by subclasses for custom error handling
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected handleProcessingError(error: unknown, _options: ProcessingOptions): never {
    this.handleError(error, `${this.processorName}.process`);
  }
}
