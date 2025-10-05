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

import { Command } from 'commander';

import { OutputPaths } from '../config/output-paths';
import { DownloadProcessor } from '../core';
import { CommandOptions, PinStatus } from '../types';
import { BaseCommand } from './base.command';
import { OptionGroups } from './options';

export class DownloadCommand extends BaseCommand {
  constructor() {
    super('download', 'Download CID mappings from Pinata');
  }

  public configure(program: Command): void {
    const command = program.command(this.commandName);
    if (this.description) {
      command.description(this.description);
    }
    // Add reusable options with default output path
    OptionGroups.download(OutputPaths.FILES.downloadedCids).forEach(option => {
      command.addOption(option);
    });

    command.action(async (options: CommandOptions & { status?: string }) => {
      await this.execute(options);
    });
  }

  private async execute(options: CommandOptions & { status?: string }): Promise<void> {
    try {
      this.validateOptions(options);
      this.logger.info('Starting CID download process');

      const config = this.getPinataConfig();
      const processor = new DownloadProcessor(config);

      // Validate and convert status
      const status = this.validatePinStatus(options.status || 'all');

      const processingOptions = {
        folderPath: '', // Not used for download
        outputPath: options.output || './output/downloaded-cids.json',
      };

      const cidMappings = await processor.process(processingOptions, status);
      const count = Object.keys(cidMappings).length;

      this.logSuccess(`Downloaded ${count} CID mappings from Pinata`);
    } catch (error) {
      this.handleError(error);
    }
  }

  private validatePinStatus(status: string): PinStatus {
    const normalizedStatus = status.toLowerCase();

    switch (normalizedStatus) {
      case 'all':
        return PinStatus.ALL;
      case 'pinned':
        return PinStatus.PINNED;
      case 'unpinned':
        return PinStatus.UNPINNED;
      default:
        throw new Error(`Invalid pin status: ${status}. Use 'all', 'pinned', or 'unpinned'`);
    }
  }
}
