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

import { HashCalculatorService } from '../services';
import { FileMapping, ProcessingOptions } from '../types';
import { BaseCalculatorProcessor } from './base-calculator.processor';

export class HashProcessor extends BaseCalculatorProcessor {
  private readonly hashCalculatorService: HashCalculatorService;

  constructor(rateLimitConfig = { maxConcurrent: 5 }) {
    super('HashProcessor', rateLimitConfig);
    this.hashCalculatorService = new HashCalculatorService(this.rateLimiter);
  }

  /**
   * Calculate hash mapping for files
   * @param files - Array of file paths
   * @returns Mapping of file names to hashes
   */
  protected async calculateMapping(files: string[]): Promise<FileMapping> {
    return this.hashCalculatorService.calculateHashes(files);
  }

  /**
   * Processes files and calculates hash of all hashes
   * @param options - Processing options
   * @param finalOutputPath - Path for the final hash output
   * @returns The final hash of all hashes
   */
  public async processWithFinalHash(options: ProcessingOptions, finalOutputPath: string): Promise<string> {
    const hashMapping = await this.process(options);
    const hashValues = Object.values(hashMapping);
    const finalHash = await this.hashCalculatorService.calculateHashOfHashes(hashValues);

    await this.fileService.saveJson(finalOutputPath, finalHash);
    this.logger.info('Final hash calculated and saved', {
      hash: finalHash,
      path: finalOutputPath,
    });

    return finalHash;
  }
}
