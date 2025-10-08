#!/usr/bin/env node

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

/**
 * Pinata IPFS CLI - A TypeScript-based command-line interface for NFT operations with Pinata
 */

import 'dotenv/config';

import { Command, CommanderError } from 'commander';

import { CIDCommand, DownloadCommand, HashCommand, UploadCommand } from './commands';

class PinataCLI {
  private readonly program: Command;
  private readonly commands: Array<{ configure: (cmd: Command) => void }>;

  constructor() {
    this.program = new Command();
    this.commands = [new HashCommand(), new CIDCommand(), new UploadCommand(), new DownloadCommand()];
  }

  public init(): void {
    this.configureProgram();
    this.registerCommands();
    this.addGlobalOptions();
    this.handleErrors();
  }

  public run(): void {
    this.program.parse();
  }

  private configureProgram(): void {
    this.program
      .name('pinata-cli')
      .version('2.0.0')
      .description('CLI tool for managing NFT files and metadata with Pinata IPFS')
      .configureHelp({
        sortSubcommands: true,
        subcommandTerm: (cmd: Command) => cmd.name(),
      });
  }

  private registerCommands(): void {
    this.commands.forEach(command => {
      command.configure(this.program);
    });
  }

  private addGlobalOptions(): void {
    this.program
      .option('--verbose', 'Enable verbose logging')
      .option('--dry-run', 'Show what would be done without executing')
      .hook('preAction', (cmd: Command) => {
        const opts = cmd.opts();
        if (opts.verbose) {
          process.env.NODE_ENV = 'development';
        }
        if (opts.dryRun) {
          console.log('[DRY-RUN] Dry run mode enabled - no operations will be executed');
        }
      });
  }

  private handleErrors(): void {
    this.program.exitOverride(this.handleExitOverride.bind(this));

    process.on('uncaughtException', this.handleUncaughtException.bind(this));

    process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));
  }

  // Commander code groups used for exit/error handling
  private static readonly HELP_CODES = ['commander.help', 'commander.helpDisplayed', 'commander.version'];
  private static readonly USER_CODES = ['commander.unknownCommand', 'commander.invalidArgument'];

  /**
   * Centralized handler for commander exit override events.
   * Extracted to reduce complexity of the caller.
   */
  private handleExitOverride(err: unknown): void {
    if (this.tryHandleCommanderExit(err)) {
      return;
    }

    // Other commander errors
    throw err;
  }

  /**
   * Determines the appropriate exit code based on the error type
   */
  private getCommanderExitCode(isHelp: boolean, exitCode: number): number {
    return isHelp ? exitCode || 0 : exitCode || 1;
  }

  /**
   * Common logic for handling Commander errors/exits
   */
  private handleCommanderCode(code: string, exitCode: number, errorMessage?: string): void {
    const isHelp = PinataCLI.HELP_CODES.includes(code);
    const isUser = PinataCLI.USER_CODES.includes(code);

    if (!isHelp && !isUser) return;

    if (isUser && errorMessage) {
      console.error(errorMessage);
    }

    process.exit(this.getCommanderExitCode(isHelp, exitCode));
  }

  // Complexity of this method is warranted by explicit, simple command-code handling
  // eslint-disable-next-line complexity
  private tryHandleCommanderExit(err: unknown): boolean {
    if (typeof err !== 'object' || err === null || !('code' in err)) return false;

    const e = err as { code?: string; exitCode?: number };
    const code = e.code ?? '';
    const isHelp = PinataCLI.HELP_CODES.includes(code);
    const isUser = PinataCLI.USER_CODES.includes(code);

    if (isHelp || isUser) {
      this.handleCommanderCode(code, e.exitCode || 0);
      return true;
    }

    return false;
  }

  /**
   * Centralized uncaught exception handler. Kept small by moving logic here.
   */
  private handleUncaughtException(error: unknown): void {
    if (this.tryHandleCommanderError(error)) {
      return;
    }

    console.error('[ERROR] Uncaught Exception:', error);
    process.exit(1);
  }

  // Complexity of this method is warranted by explicit, simple command-code handling
  // eslint-disable-next-line complexity
  private tryHandleCommanderError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('name' in error)) return false;
    const maybeName = (error as { name?: unknown }).name;
    if (maybeName !== 'CommanderError') return false;

    const ce = error as CommanderError;
    const code = ce.code ?? '';
    const isHelp = PinataCLI.HELP_CODES.includes(code);
    const isUser = PinataCLI.USER_CODES.includes(code);

    if (isHelp || isUser) {
      this.handleCommanderCode(code, ce.exitCode || 0, isUser ? ce.message : undefined);
      return true;
    }

    return false;
  }

  /**
   * Handler for unhandled promise rejections.
   */
  private handleUnhandledRejection(reason: unknown): void {
    console.error('[ERROR] Unhandled Rejection:', reason);
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  const cli = new PinataCLI();
  cli.init();
  cli.run();
}

export { PinataCLI };
