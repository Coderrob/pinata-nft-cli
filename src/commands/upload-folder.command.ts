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

import { AppConfig, OutputPaths } from '../config';
import { FolderUploadProcessor } from '../core';
import { CommandOptions, ProcessingOptions } from '../types';
import { BaseCommand } from './base.command';
import { ILogger, IConfigProvider, IErrorHandler } from '../types/commands';
import { OptionGroups } from './options';

type FolderUploadOptions = CommandOptions & { name?: string };

/**
 * Configures the `upload folder` subcommand that coordinates recursive folder uploads.
 */
export class UploadFolderCommand extends BaseCommand {
  constructor(logger?: ILogger, configProvider?: IConfigProvider, errorHandler?: IErrorHandler) {
    super('folder', 'Upload an entire folder to Pinata IPFS', logger, configProvider, errorHandler);
  }

  /**
   * Registers the `upload folder` subcommand on the provided parent command.
   * @param program - Commander command acting as the parent (typically the `upload` command).
   */
  public configure(program: Command): void {
    const command = program.command(this.commandName);
    if (this.description) {
      command.description(this.description);
    }
    // Add reusable options with default output path
    OptionGroups.uploadFolder(OutputPaths.FILES.folderCid).forEach(option => {
      command.addOption(option);
    });

    command.action(async (options: FolderUploadOptions) => {
      await this.execute(options);
    });
  }

  /**
   * Executes the folder upload workflow while handling validation and logging concerns.
   * @param options - Parsed command-line options inclusive of optional display name.
   */
  private async execute(options: FolderUploadOptions): Promise<void> {
    try {
      this.validateOptions(options);
      this.logger.info('Starting folder upload process');

      const config = this.getPinataConfig();
      const processor = new FolderUploadProcessor(config);

      const processingOptions: ProcessingOptions = {
        folderPath: options.folder || AppConfig.getFileProcessingConfig().defaultMetadataFolder,
        outputPath: options.output || OutputPaths.FILES.folderCid,
      };

      const { cid, error, folderName, success } = await processor.process(processingOptions, options.name);

      if (success) {
        this.logSuccess(`Folder '${folderName}' uploaded successfully. CID: ${cid}`);
      } else {
        throw new Error(`Folder upload failed: ${error}`);
      }
    } catch (error) {
      this.handleError(error);
    }
  }
}
