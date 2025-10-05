/**
 * GPLv2.0 License
 * Copyright (c) 2025 Robert Lindley
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
