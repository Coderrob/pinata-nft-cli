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

import { PinataService } from '../services';
import { FileMapping, PinataConfig, PinStatus, ProcessingOptions } from '../types';
import { isEmptyObject } from '../utils/guards';
import { BaseFileProcessor } from './base.processor';

export class DownloadProcessor extends BaseFileProcessor<FileMapping> {
  private readonly pinataService: PinataService;

  constructor(config: PinataConfig) {
    super('DownloadProcessor');
    this.pinataService = new PinataService(config);
  }

  /**
   * Downloads CID mappings from Pinata
   * @param options - Processing options including output path
   * @param status - Pin status filter (default: ALL)
   * @returns Object mapping file names to their CIDs
   */
  public async process(options: ProcessingOptions, status: PinStatus = PinStatus.ALL): Promise<FileMapping> {
    this.validateOptions(options);
    this.logProcessingStart(options);

    try {
      const cidMappings = await this.pinataService.downloadCIDMappings(status);

      if (isEmptyObject(cidMappings)) {
        this.logger.warn('No CID mappings found');
        return {};
      }

      // Log the mappings in table format
      console.table(cidMappings);

      // Save the mappings
      const { FileService } = await import('../services');
      const fileService = new FileService();
      await fileService.saveJson(options.outputPath, cidMappings);

      this.logProcessingComplete(Object.keys(cidMappings).length);
      return cidMappings;
    } catch (error) {
      this.handleError(error);
    }
  }
}
