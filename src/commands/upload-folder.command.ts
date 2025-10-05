/**
 * GPLv2.0 License
 * Copyright (c) 2025 Robert Lindley
 */

import { Command } from 'commander';

import { OutputPaths } from '../config/output-paths';
import { FolderUploadProcessor } from '../core';
import { CommandOptions, ProcessingOptions } from '../types';
import { BaseCommand } from './base.command';
import { OptionGroups } from './options';

type FolderUploadOptions = CommandOptions & { name?: string };

/**
 * Configures the `upload folder` subcommand that coordinates recursive folder uploads.
 */
export class UploadFolderCommand extends BaseCommand {
  constructor() {
    super('folder', 'Upload an entire folder to Pinata IPFS');
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
        folderPath: options.folder || 'metadata',
        outputPath: options.output || './output/folder-cid.json',
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
