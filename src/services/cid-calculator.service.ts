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
import { of } from 'ipfs-only-hash';

import { FileMapping, ICIDCalculator, IFileDigestStrategy, CIDCalculatorDependencies } from '../types';
import { RateLimitedFileMappingService } from './rate-limited-file-mapping.service';

/**
 * Default digest strategy that uses ipfs-unixfs-importer (via ipfs-only-hash wrapper) for CID generation.
 * This provides full IPFS UnixFS compatibility with proper chunking and DAG creation.
 *
 * Note: ipfs-only-hash is a CommonJS-compatible wrapper around ipfs-unixfs-importer that provides
 * the same CID generation functionality. It uses the UnixFS importer internally with onlyHash=true
 * to generate CIDs without storing blocks, which is exactly what we need for content addressing.
 *
 * The generated CIDs are compatible with IPFS and use the dag-pb codec with the sha2-256 hash function.
 */
class IpfsUnixFsStrategy implements IFileDigestStrategy<string> {
  public readonly name = 'ipfs-unixfs-importer';
  public readonly algorithm = 'dag-pb';

  /**
   * Generates an IPFS CID for the provided content buffer using ipfs-unixfs-importer.
   * The ipfs-only-hash library provides a CommonJS-compatible interface to ipfs-unixfs-importer
   * and handles the UnixFS encoding, chunking, and DAG creation automatically.
   *
   * @param content - Content to transform into a CID.
   * @returns Promise resolving to the CID string (base58btc encoded CIDv0 by default).
   */
  public async digest(content: Buffer): Promise<string> {
    return of(content);
  }
}

export class CIDCalculatorService extends RateLimitedFileMappingService<string, FileMapping> implements ICIDCalculator {
  private readonly cidStrategy: IFileDigestStrategy<string>;

  constructor(rateLimiter: Bottleneck, dependencies: CIDCalculatorDependencies = {}) {
    super(rateLimiter, 'CIDCalculatorService', dependencies);
    this.cidStrategy = dependencies.cidStrategy ?? new IpfsUnixFsStrategy();
  }

  /**
   * Calculates IPFS CID for a single file
   * @param filePath - Path to the file
   * @returns IPFS CID for the file
   */
  public async calculateCID(filePath: string): Promise<string> {
    return this.processSingleFile(filePath, fileData => this.cidStrategy.digest(fileData), 'CID', {
      algorithm: this.cidStrategy.algorithm,
    });
  }

  /**
   * Calculates IPFS CIDs for all files in the provided array
   * @param files - Array of file paths
   * @returns Object mapping file names to their IPFS CIDs
   */
  public async calculateCIDs(files: string[]): Promise<FileMapping> {
    return this.processFiles(files);
  }

  /**
   * Provides a descriptive token for log messages.
   */
  protected getOperationToken(): string {
    return 'CID calculation';
  }

  /**
   * Computes the CID for the provided file content.
   * @param filePath - Path to the file being processed.
   * @param fileName - Name of the file being processed.
   * @param fileContent - File content buffer.
   */
  protected async computeResult(_: string, fileName: string, fileContent: Buffer): Promise<string> {
    const cid = await this.cidStrategy.digest(fileContent);
    this.logger.debug(`${fileName} CID computed`, { cid });
    return cid;
  }

  /**
   * Logs final CID information once processing completes.
   * @param fileName - Name of the file processed.
   * @param result - Resulting CID for the file.
   */
  protected override onAfterProcessing(fileName: string, result: string): void {
    this.logger.info(`${fileName} CID`, {
      cid: result,
      algorithm: this.cidStrategy.algorithm,
    });
  }
}
