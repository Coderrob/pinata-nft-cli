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
import { CIDProcessor } from '../core';
import { CommandOptions } from '../types';
import { BaseCommand } from './base.command';
import { OptionGroups } from './options';

export class CIDCommand extends BaseCommand {
  /**
   * CIDCommand - CLI command wrapper to calculate IPFS CIDs for files in a folder.
   *
   * Description:
   * This class wires the `cid` subcommand into the provided Commander `program` and
   * delegates the actual CID calculation work to the core `CIDProcessor`.
   *
   * Usage (CLI):
   *   node ./dist/cli.js cid --folder ./my-files --output ./out/file-cids.json
   *
   * Usage (programmatic):
   *   import { Command } from 'commander';
   *   const program = new Command();
   *   const cmd = new CIDCommand();
   *   cmd.configure(program);
   *
   * Note: this command expects folder and output options (see OptionGroups)
   * and will use sensible defaults when they are not provided.
   */
  constructor() {
    super('cid', 'Calculate IPFS CIDs for files in a folder');
  }

  /**
   * Configure the `cid` subcommand on the provided Commander program.
   *
   * @param program - The Commander program instance to attach the `cid` command to.
   * @returns void
   *
   * Example:
   *   const program = new Command();
   *   new CIDCommand().configure(program);
   *   program.parse(process.argv);
   */
  public configure(program: Command): void {
    const command = program.command(this.commandName);
    if (this.description) {
      command.description(this.description);
    }
    // Add reusable options with default output path
    OptionGroups.batchProcessing(OutputPaths.FILES.fileCids).forEach(option => {
      command.addOption(option);
    });

    // Require two positional arguments: folderPath and outputPath
    command.argument('<folder>', 'Folder path to read files from');
    command.argument('<output>', 'Output file path for CID mapping');

    command.action(async (folder: string, output: string, options: CommandOptions) => {
      // Merge positional args into options so downstream code can remain option-driven
      const merged: CommandOptions = { ...(options ?? {}), folder, output } as CommandOptions;
      await this.execute(merged);
    });
  }

  /**
   * Execute the CID calculation process.
   *
   * This method validates incoming options, creates a `CIDProcessor` with
   * the configured rate limits, and runs the processing which writes a mapping
   * of filenames to IPFS CIDs to the configured output path.
   *
   * @param options - Parsed command options supplied by Commander. Expected shape:
   *   { folder?: string; output?: string; rateLimit?: { ... } }
   * @returns Promise<void> - resolves when processing completes successfully.
   *
   * Error handling: any thrown error will be forwarded to the command's
   * centralized error handler (`handleError`).
   */
  private async execute(options: CommandOptions): Promise<void> {
    try {
      this.validateOptions(options);
      this.logger.info('Starting CID calculation process');

      const processor = new CIDProcessor(this.createRateLimitConfig(options));

      const processingOptions = {
        folderPath: options.folder || 'files',
        outputPath: options.output || './output/file-cids.json',
      };

      const cidMapping = await processor.process(processingOptions);
      const fileCount = Object.keys(cidMapping).length;

      this.logSuccess(`CID calculation completed for ${fileCount} files`);
    } catch (error) {
      this.handleError(error);
    }
  }
}
