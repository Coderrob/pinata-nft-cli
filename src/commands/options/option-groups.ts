/**
 * GPLv2.0 License
 * Copyright (c) 2025 Robert Lindley
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
