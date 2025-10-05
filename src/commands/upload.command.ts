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

import { BaseCommand } from './base.command';
import { UploadFilesCommand } from './upload-files.command';
import { UploadFolderCommand } from './upload-folder.command';

/**
 * Composite command that groups upload-oriented subcommands under a single entry point.
 */
export class UploadCommand extends BaseCommand {
  constructor(
    private readonly filesCommand: UploadFilesCommand = new UploadFilesCommand(),
    private readonly folderCommand: UploadFolderCommand = new UploadFolderCommand()
  ) {
    super('upload', 'Upload files or folders to Pinata IPFS');
  }

  /**
   * Registers the `upload` command and delegates registration of child subcommands.
   * @param program - Root commander program that will host the `upload` composite.
   */
  public configure(program: Command): void {
    const command = program.command(this.commandName).showHelpAfterError(true);
    if (this.description) {
      command.description(this.description);
    }
    command.hook('preAction', (thisCommand, actionCommand) => {
      if (thisCommand === actionCommand) {
        thisCommand.help({ error: false });
      }
    });

    this.filesCommand.configure(command);
    this.folderCommand.configure(command);
  }
}
