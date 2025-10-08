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

import type { BinaryToTextEncoding } from 'crypto';

import { ProcessingOptions } from '../commands';

/**
 * Service interface for file operations
 */
export interface IFileService {
  getFiles(folderPath: string): Promise<string[]>;
  ensureDirectoryExists(dirPath: string): Promise<void>;
  writeJsonFile(filePath: string, data: unknown): Promise<void>;
}

/**
 * Service interface for hash calculations
 */
export interface IHashCalculator {
  calculateHash(filePath: string): Promise<string>;
  calculateHashOfHashes(hashes: string[]): Promise<string>;
}

/**
 * Service interface for CID calculations
 */
export interface ICIDCalculator {
  calculateCID(filePath: string): Promise<string>;
}

/**
 * Generic file processor interface
 */
export interface IFileProcessor<TResult> {
  process(options: ProcessingOptions): Promise<TResult>;
}

/**
 * Strategy interface describing how to produce a digest from file content.
 */
export interface IFileDigestStrategy<TResult> {
  readonly name: string;
  readonly algorithm: string;
  digest(content: Buffer): Promise<TResult> | TResult;
}

/**
 * Hash-specific strategy that provides additional encoding metadata.
 * Implementations must be synchronous to support deterministic aggregation pipelines.
 */
export interface IHashDigestStrategy extends IFileDigestStrategy<string> {
  readonly encoding: BinaryToTextEncoding;
  digest(content: Buffer): string;
}
