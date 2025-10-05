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

import { Option } from 'commander';

import { PathOptions } from './path.options';
import { PinataOptions } from './pinata.options';
import { RateLimitOptions } from './rate-limit.options';

/**
 * Pre-configured option groups for specific command types
 */
export class OptionGroups {
  /**
   * Static file processing options (folder + output)
   * @param outputDefault Optional default output path
   * @returns Array of Option instances
   */
  static fileProcessing(outputDefault?: string): Option[] {
    return [PathOptions.folder, PathOptions.createOutput(outputDefault)];
  }

  /**
   * Upload files options (folder + output + concurrency + rate limiting)
   * @param outputDefault Optional default output path
   * @returns Array of Option instances
   */
  static uploadFiles(outputDefault?: string): Option[] {
    return [
      PathOptions.folder,
      PathOptions.createOutput(outputDefault),
      RateLimitOptions.concurrentUploads,
      RateLimitOptions.minTime,
    ];
  }

  /**
   * Upload folder options (metadata folder + output + name)
   * @param outputDefault Optional default output path
   * @returns Array of Option instances
   */
  static uploadFolder(outputDefault?: string): Option[] {
    return [PathOptions.metadataFolder, PathOptions.createOutput(outputDefault), PinataOptions.displayName];
  }

  /**
   * Batch processing options (folder + output + concurrency)
   * @param outputDefault Optional default output path
   * @returns Array of Option instances
   */
  static batchProcessing(outputDefault?: string): Option[] {
    return [PathOptions.folder, PathOptions.createOutput(outputDefault), RateLimitOptions.concurrent];
  }

  /**
   * Hash calculation options (includes final output for hash of hashes)
   * @param outputDefault Optional default output path
   * @returns Array of Option instances
   */
  static hashCalculation(outputDefault?: string): Option[] {
    return [
      PathOptions.folder,
      PathOptions.createOutput(outputDefault),
      PathOptions.finalOutput,
      RateLimitOptions.concurrent,
    ];
  }

  /**
   * Download options (output + status filter)
   */
  static download(outputDefault?: string): Option[] {
    return [PathOptions.createOutput(outputDefault), PinataOptions.status];
  }
}
