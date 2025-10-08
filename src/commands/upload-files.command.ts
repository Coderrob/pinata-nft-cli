/**
 * GPLv2.0 License
 * Copyright (c) 2022 Robert Lindley
 */

import { Command } from 'commander';

import { AppConfig, OutputPaths } from '../config';
import { FileUploadProcessor } from '../core';
import { CommandOptions, ProcessingOptions, RateLimitConfig, UploadResult } from '../types';
import { isFailure } from '../utils';
import { BaseCommand } from './base.command';
import { ILogger, IConfigProvider, IErrorHandler } from '../types/commands';
import { OptionGroups } from './options';

/**
 * Configures the `upload files` subcommand that is authored as part of the upload composite.
 */
export class UploadFilesCommand extends BaseCommand {
  constructor(logger?: ILogger, configProvider?: IConfigProvider, errorHandler?: IErrorHandler) {
    super('files', 'Upload individual files to Pinata IPFS', logger, configProvider, errorHandler);
  }

  /**
   * Registers the `upload files` subcommand on the provided parent command.
   * @param program - Commander command acting as the parent (typically the `upload` command).
   */
  public configure(program: Command): void {
    const command = program.command(this.commandName);
    if (this.description) {
      command.description(this.description);
    }
    // Add reusable options with default output path
    OptionGroups.uploadFiles(OutputPaths.FILES.uploadedFiles).forEach(option => {
      command.addOption(option);
    });

    command.action(async (...args: unknown[]) => {
      const options: CommandOptions = args[0] ?? {};
      await this.execute(options);
    });
  }

  /**
   * Executes the file upload workflow and coordinates validation, processing, and reporting.
   * @param options - Parsed command-line options.
   */
  private async execute(options: CommandOptions): Promise<void> {
    try {
      this.validateOptions(options);
      this.logger.info('Starting file upload process');

      const rateLimitConfig = this.buildRateLimitConfig(options);
      const processor = this.createProcessor(rateLimitConfig);
      const processingOptions = this.buildProcessingOptions(options, rateLimitConfig);

      const results = await processor.process(processingOptions);
      this.reportResults(results);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Constructs rate limit configuration for the upload processor.
   * @param options - User supplied command options.
   * @returns Rate limiting configuration object.
   */
  private buildRateLimitConfig(options: CommandOptions): RateLimitConfig {
    return {
      maxConcurrent: options.concurrent ?? 1,
      minTime: options.minTime ?? 3000,
    };
  }

  /**
   * Creates the file upload processor with resolved dependencies.
   * @param rateLimitConfig - Rate limiting configuration.
   * @returns Configured file upload processor instance.
   */
  private createProcessor(rateLimitConfig: RateLimitConfig) {
    const config = this.getPinataConfig();
    return new FileUploadProcessor(config, rateLimitConfig);
  }

  /**
   * Generates processing options consumed by the file upload processor.
   * @param options - Command options provided by the user.
   * @param rateLimitConfig - Rate limiting configuration.
   * @returns Processing options ready for execution.
   */
  private buildProcessingOptions(options: CommandOptions, rateLimitConfig: RateLimitConfig): ProcessingOptions {
    return {
      folderPath: options.folder ?? AppConfig.getFileProcessingConfig().defaultInputFolder,
      outputPath: options.output ?? OutputPaths.FILES.uploadedFiles,
      rateLimitConfig,
    };
  }

  /**
   * Summarises results and emits structured logs for successes and failures.
   * @param results - Result set returned by the processor.
   */
  private reportResults(results: UploadResult[]): void {
    const successCount = results.filter(result => result.success).length;
    const failureCount = results.length - successCount;

    if (failureCount > 0) {
      this.logFailureDetails(results, failureCount);
    }

    this.logSuccess(`File upload completed: ${successCount} successful, ${failureCount} failed`);
  }

  /**
   * Logs detailed failure information for unsuccessful uploads.
   * @param results - Result set returned by the processor.
   * @param failureCount - Number of failed uploads.
   */
  private logFailureDetails(results: UploadResult[], failureCount: number): void {
    this.logger.warn(`Upload completed with ${failureCount} failures out of ${results.length} files`);
    results.filter(isFailure).forEach(result => {
      this.logger.error(`Failed to upload ${result.fileName}: ${result.error}`);
    });
  }
}
