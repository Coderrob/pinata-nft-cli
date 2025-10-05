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
import { PinataService, FileService } from '../services';
import { PinataConfig, ProcessingOptions } from '../types';
import { BaseFileProcessor } from './base.processor';

export interface FolderUploadResult {
  folderName: string;
  cid: string;
  success: boolean;
  error?: string;
}

export class FolderUploadProcessor extends BaseFileProcessor<FolderUploadResult> {
  private readonly pinataService: PinataService;

  constructor(config: PinataConfig) {
    super('FolderUploadProcessor');
    this.pinataService = new PinataService(config);
  }

  /**
   * Processes folder upload to Pinata
   * @param options - Processing options including folder path and output path
   * @param folderName - Display name for the folder in Pinata
   * @returns Upload result
   */
  public async process(options: ProcessingOptions, folderName?: string): Promise<FolderUploadResult> {
    this.validateOptions(options);
    this.logProcessingStart(options);

    const displayName = folderName || options.folderPath.split('/').pop() || 'metadata';

    try {
      const cid = await this.pinataService.uploadFolder(options.folderPath, displayName);

      const result: FolderUploadResult = {
        folderName: displayName,
        cid,
        success: true,
      };

      // Save the result
      await this.saveResult(options.outputPath, result);
      this.logger.info('Folder upload completed successfully', result);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Folder upload failed', error);

      const result: FolderUploadResult = {
        folderName: displayName,
        cid: '',
        success: false,
        error: errorMessage,
      };

      await this.saveResult(options.outputPath, result);
      return result;
    }
  }

  /**
   * Saves the upload result to file
   * @param outputPath - Path to save the result
   * @param result - Upload result to save
   */
  private async saveResult(outputPath: string, result: FolderUploadResult): Promise<void> {
    // For folder uploads, we typically just save the CID
    if (result.success) {
      const service = new FileService();
      await service.saveJson(outputPath, result.cid);
    }
  }
}
