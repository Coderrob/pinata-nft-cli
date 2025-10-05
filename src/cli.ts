#!/usr/bin/env node

/**
 * GPLv2.0 License
 * Copyright (c) 2025 Robert Lindley
 *
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

  // Complexity of this method is warranted by explicit, simple command-code handling
  // eslint-disable-next-line complexity
  private tryHandleCommanderExit(err: unknown): boolean {
    if (typeof err !== 'object' || err === null || !('code' in err)) return false;

    const e = err as { code?: string; exitCode?: number };
    const code = e.code ?? '';
    const isHelp = PinataCLI.HELP_CODES.includes(code);
    const isUser = PinataCLI.USER_CODES.includes(code);

    if (isHelp || isUser) {
      process.exit(isHelp ? e.exitCode || 0 : e.exitCode || 1);
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
      if (isUser) console.error(ce.message);
      process.exit(isHelp ? ce.exitCode || 0 : ce.exitCode || 1);
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
