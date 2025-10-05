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

import { FileMapping, ICIDCalculator, IFileDigestStrategy } from '../types';
import { FileUtils } from '../utils';
import { RateLimitedFileMappingDependencies, RateLimitedFileMappingService } from './rate-limited-file-mapping.service';

/**
 * Dependencies for CIDCalculatorService allowing custom strategies and collaborators.
 */
export type CIDCalculatorDependencies = RateLimitedFileMappingDependencies & {
  /**
   * Strategy used to produce IPFS compatible content identifiers.
   */
  readonly cidStrategy?: IFileDigestStrategy<string>;
};

/**
 * Default digest strategy that delegates to ipfs-only-hash for CID generation.
 */
class IpfsOnlyHashStrategy implements IFileDigestStrategy<string> {
  public readonly name = 'ipfs-only-hash';
  public readonly algorithm = 'ipfs-only-hash';

  /**
   * Generates an IPFS CID for the provided content buffer.
   * @param content - Content to transform into a CID.
   */
  public async digest(content: Buffer): Promise<string> {
    return of(content);
  }
}

export class CIDCalculatorService extends RateLimitedFileMappingService<string, FileMapping> implements ICIDCalculator {
  private readonly cidStrategy: IFileDigestStrategy<string>;

  constructor(rateLimiter: Bottleneck, dependencies: CIDCalculatorDependencies = {}) {
    super(rateLimiter, 'CIDCalculatorService', dependencies);
    this.cidStrategy = dependencies.cidStrategy ?? new IpfsOnlyHashStrategy();
  }

  /**
   * Calculates IPFS CID for a single file
   * @param filePath - Path to the file
   * @returns IPFS CID for the file
   */
  public async calculateCID(filePath: string): Promise<string> {
    const fileName = FileUtils.getFileName(filePath);

    try {
      const fileData = this.readFileContent(filePath);
      const cid = await this.cidStrategy.digest(fileData);
      this.logger.info(`${fileName} CID calculated`, {
        cid,
        algorithm: this.cidStrategy.algorithm,
      });
      return cid;
    } catch (error) {
      this.logger.error(`Failed to calculate CID for file: ${fileName}`, error);
      throw error;
    }
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
