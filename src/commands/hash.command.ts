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
import { HashProcessor } from '../core';
import { CommandOptions } from '../types';
import { BaseCommand } from './base.command';
import { CommandBuilder } from './command-builder';

type HashOptions = CommandOptions & { finalOutput?: string };

/**
 * Alternative implementation using CommandBuilder pattern
 * This demonstrates how to use the CommandBuilder for cleaner command setup
 */
export class HashCommand extends BaseCommand {
  constructor() {
    super('hash', 'Calculate SHA-256 hashes for files in a folder (v2)');
  }

  public configure(program: Command): void {
    const command = new CommandBuilder(this.commandName, this.description ?? '')
      .addHashCalculationOptions(OutputPaths.FILES.fileHashes)
      .setAction(async (...args: unknown[]) => {
        const options: HashOptions = args[0] ?? {};
        await this.execute(options);
      })
      .build();

    program.addCommand(command);
  }

  private async execute(options: HashOptions): Promise<void> {
    try {
      this.validateOptions(options);
      this.logger.info('Starting hash calculation process (v2)');

      const processor = new HashProcessor(this.createRateLimitConfig(options));

      const processingOptions = {
        folderPath: options.folder || 'files',
        outputPath: options.output || './output/file-hashes.json',
      };

      if (options.finalOutput) {
        // Calculate both regular hashes and hash of hashes
        const finalHash = await processor.processWithFinalHash(processingOptions, options.finalOutput);
        this.logSuccess(`Hash calculation completed. Final hash: ${finalHash}`);
      } else {
        // Calculate only regular hashes
        const hashMapping = await processor.process(processingOptions);
        const fileCount = Object.keys(hashMapping).length;
        this.logSuccess(`Hash calculation completed for ${fileCount} files`);
      }
    } catch (error) {
      this.handleError(error);
    }
  }
}
