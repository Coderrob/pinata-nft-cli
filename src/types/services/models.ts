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

import type { ILogger } from '../commands';
import type { IFileDigestStrategy } from '../file-processing';

/**
 * Minimal contract for synchronous file reading to support digest operations.
 */
export interface FileReader {
  /**
   * Reads file content as a Buffer.
   * @param filePath - Absolute or relative path to the file.
   */
  readFileSync(filePath: string): Buffer;
}

/**
 * Optional dependencies for the rate-limited file mapping service.
 */
export interface RateLimitedFileMappingDependencies {
  /**
   * Custom file reader implementation; defaults to FileService.
   */
  readonly fileReader?: FileReader;

  /**
   * Custom logger instance; defaults to a scoped Logger built from the service name.
   */
  readonly logger?: ILogger;
}

/**
 * Dependencies for CIDCalculatorService allowing custom strategies and collaborators.
 */
export type CIDCalculatorDependencies = RateLimitedFileMappingDependencies & {
  /**
   * Strategy used to produce IPFS compatible content identifiers.
   */
  readonly cidStrategy?: IFileDigestStrategy<string>;
};
