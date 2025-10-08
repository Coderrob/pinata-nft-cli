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
import { BinaryToTextEncoding, createHash } from 'crypto';

import { FileMapping, IHashCalculator, IHashDigestStrategy } from '../types';
import { RateLimitedFileMappingDependencies } from '../types/services';
import { RateLimitedFileMappingService } from './rate-limited-file-mapping.service';

/**
 * Dependencies for HashCalculatorService allowing custom strategies and collaborators.
 */
export type HashCalculatorDependencies = RateLimitedFileMappingDependencies & {
  /**
   * Strategy used to convert file content into a hash digest.
   */
  readonly hashStrategy?: IHashDigestStrategy;
};

/**
 * Default hashing strategy that leverages Node's crypto implementation.
 */
class NodeCryptoHashStrategy implements IHashDigestStrategy {
  public readonly name: string;

  constructor(
    public readonly algorithm: string = 'sha256',
    public readonly encoding: BinaryToTextEncoding = 'hex'
  ) {
    this.name = `crypto:${algorithm}:${encoding}`;
  }

  /**
   * Generates a digest for the provided content.
   * @param content - Content to hash.
   */
  public digest(content: Buffer): string {
    return createHash(this.algorithm).update(content).digest(this.encoding);
  }
}

export class HashCalculatorService
  extends RateLimitedFileMappingService<string, FileMapping>
  implements IHashCalculator
{
  private readonly hashStrategy: IHashDigestStrategy;

  constructor(rateLimiter: Bottleneck, dependencies: HashCalculatorDependencies = {}) {
    super(rateLimiter, 'HashCalculatorService', dependencies);
    this.hashStrategy = dependencies.hashStrategy ?? new NodeCryptoHashStrategy();
  }

  /**
   * Calculates SHA-256 hash for a single file (interface method)
   * @param filePath - Path to the file
   * @returns SHA-256 hash of the file
   */
  public async calculateHash(filePath: string): Promise<string> {
    return this.processSingleFile(filePath, fileData => this.hashStrategy.digest(fileData), 'hash', {
      algorithm: this.hashStrategy.algorithm,
      encoding: this.hashStrategy.encoding,
    });
  }

  /**
   * Calculates SHA-256 hashes for all files in the provided array
   * @param files - Array of file paths
   * @returns Object mapping file names to their SHA-256 hashes
   */
  public async calculateHashes(files: string[]): Promise<FileMapping> {
    return this.processFiles(files);
  }

  /**
   * Calculates hash of all hashes concatenated (interface method)
   * @param hashes - Array of hash strings
   * @returns Single hash representing all file hashes
   */
  public async calculateHashOfHashes(hashes: string[]): Promise<string> {
    return this.calculateHashOfHashesInternal(hashes.join(''));
  }

  /**
   * Calculates hash of all hashes concatenated from FileMapping
   * @param hashes - Object containing file name to hash mappings
   * @returns Single hash representing all file hashes
   */
  public calculateHashOfHashesFromMapping(hashes: FileMapping): string {
    return this.calculateHashOfHashesInternal(Object.values(hashes).join(''));
  }

  /**
   * Internal method to calculate hash of concatenated hashes
   * @param concatenated - Concatenated hash string
   * @returns Single hash representing all file hashes
   */
  private calculateHashOfHashesInternal(concatenated: string): string {
    this.logger.info('Calculating hash of concatenated hashes', {
      length: concatenated.length,
    });

    return this.computeAggregateHash(concatenated);
  }

  /**
   * Computes the hash for the provided file content.
   * @param filePath - Path to the file being processed.
   * @param fileName - Name of the file being processed.
   * @param fileContent - File content buffer.
   */
  protected async computeResult(_: string, fileName: string, fileContent: Buffer): Promise<string> {
    const hash = this.hashStrategy.digest(fileContent);
    this.logger.debug(`${fileName} hash computed`, { hash });
    return hash;
  }

  /**
   * Logs final hash information once processing completes.
   * @param fileName - Name of the file processed.
   * @param result - Resulting hash for the file.
   */
  protected override onAfterProcessing(fileName: string, result: string): void {
    this.logger.info(`${fileName} SHA-256`, {
      hash: result,
      algorithm: this.hashStrategy.algorithm,
      encoding: this.hashStrategy.encoding,
    });
  }

  /**
   * Provides a descriptive token for log messages.
   */
  protected getOperationToken(): string {
    return 'hashing';
  }

  /**
   * Computes a final aggregated hash using the configured strategy.
   * @param concatenated - Concatenated string of hashes.
   * @returns Aggregated hash value.
   */
  private computeAggregateHash(concatenated: string): string {
    const finalHash = this.hashStrategy.digest(Buffer.from(concatenated, 'utf8'));
    this.logger.info('Hash of hashes calculated', {
      finalHash,
      algorithm: this.hashStrategy.algorithm,
      encoding: this.hashStrategy.encoding,
    });
    return finalHash;
  }
}
