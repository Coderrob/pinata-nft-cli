/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Command } from 'commander';
import { MockLogger, MockConfigProvider, MockErrorHandler } from './test-utils';
import { AppConfig } from '../config';
import { FileUploadProcessor } from '../core';
import { CommandOptions, ProcessingOptions, RateLimitConfig, UploadResult } from '../types';
import { OptionGroups } from './options';
import { UploadFilesCommand } from './upload-files.command';

/**
 * GPLv2.0 License
 * Copyright (c) 2022 Robert Lindley
 */

// Mock dependencies
jest.mock('commander', () => {
  const mockOption = jest.fn().mockImplementation(() => ({
    choices: jest.fn().mockReturnThis(),
    default: jest.fn().mockReturnThis(),
    argParser: jest.fn().mockReturnThis(),
  }));
  Object.setPrototypeOf(mockOption, {});

  const mockCommand = jest.fn().mockImplementation(() => ({
    command: jest.fn().mockReturnThis(),
    description: jest.fn().mockReturnThis(),
    option: mockOption,
    action: jest.fn().mockReturnThis(),
    positional: jest.fn().mockReturnThis(),
    help: jest.fn().mockReturnThis(),
    parse: jest.fn().mockReturnThis(),
    showHelpAfterError: jest.fn().mockReturnThis(),
  }));

  return {
    Command: mockCommand,
    Option: mockOption,
  };
});
jest.mock('../config');
jest.mock('../core');
jest.mock('./options', () => ({
  OptionGroups: {
    uploadFiles: jest.fn().mockReturnValue([]),
  },
}));

describe('UploadFilesCommand', () => {
  let command: UploadFilesCommand;
  let mockLogger: MockLogger;
  let mockConfigProvider: MockConfigProvider;
  let mockErrorHandler: MockErrorHandler;
  let mockProgram: jest.Mocked<Command>;
  let mockFileUploadProcessor: any;
  let mockOptionGroups: any;

  // Test subclass to expose protected methods
  class TestUploadFilesCommand extends UploadFilesCommand {
    public testExecute(options: CommandOptions): Promise<void> {
      return (this as any).execute(options);
    }

    public testBuildRateLimitConfig(options: CommandOptions): RateLimitConfig {
      return (this as any).buildRateLimitConfig(options);
    }

    public testCreateProcessor(rateLimitConfig: RateLimitConfig): FileUploadProcessor {
      return (this as any).createProcessor(rateLimitConfig);
    }

    public testBuildProcessingOptions(options: CommandOptions, rateLimitConfig: RateLimitConfig): ProcessingOptions {
      return (this as any).buildProcessingOptions(options, rateLimitConfig);
    }

    public testReportResults(results: UploadResult[]): void {
      return (this as any).reportResults(results);
    }
  }

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock dependencies
    mockLogger = new MockLogger();
    mockConfigProvider = new MockConfigProvider();
    mockErrorHandler = new MockErrorHandler();

    // Create command with injected dependencies
    command = new TestUploadFilesCommand(mockLogger, mockConfigProvider, mockErrorHandler);

    // Mock external dependencies
    mockProgram = new Command() as jest.Mocked<Command>;
    mockFileUploadProcessor = {
      process: jest.fn(),
    };
    mockOptionGroups = OptionGroups;

    // Setup mock returns
    (AppConfig.getFileProcessingConfig as any).mockReturnValue({
      defaultInputFolder: '/test/input',
    });
    (FileUploadProcessor as any).mockImplementation(() => mockFileUploadProcessor);
  });

  describe('constructor', () => {
    it('should create command with correct name and description', () => {
      expect((command as any).commandName).toBe('files');
      expect((command as any).description).toBe('Upload individual files to Pinata IPFS');
    });
  });

  describe('configure', () => {
    it('should configure the command on parent program', () => {
      command.configure(mockProgram);

      expect(mockProgram.command).toHaveBeenCalledWith('files');
      expect(mockOptionGroups.uploadFiles).toHaveBeenCalledWith('./output/uploaded-files.json');
    });
  });

  describe('execute', () => {
    it('should execute file upload workflow successfully', async () => {
      const options: CommandOptions = { folder: '/test/folder' };
      const results: UploadResult[] = [
        { success: true, fileName: 'file1.txt', cid: 'cid1' },
        { success: true, fileName: 'file2.txt', cid: 'cid2' },
      ];

      mockFileUploadProcessor.process.mockResolvedValue(results as any);

      await (command as TestUploadFilesCommand).testExecute(options);

      expect(mockLogger.infoCalls).toHaveLength(2);
      expect(mockLogger.infoCalls[0].message).toBe('Starting file upload process');
      expect(mockLogger.infoCalls[1].message).toBe('File upload completed: 2 successful, 0 failed');
    });

    it('should handle upload failures', async () => {
      const options: CommandOptions = { folder: '/test/folder' };
      const results: UploadResult[] = [
        { success: true, fileName: 'file1.txt', cid: 'cid1' },
        { success: false, fileName: 'file2.txt', error: 'Upload failed', cid: '' },
      ];

      mockFileUploadProcessor.process.mockResolvedValue(results as any);

      await (command as TestUploadFilesCommand).testExecute(options);

      expect(mockLogger.warnCalls).toHaveLength(1);
      expect(mockLogger.warnCalls[0].message).toBe('Upload completed with 1 failures out of 2 files');
      expect(mockLogger.errorCalls).toHaveLength(1);
      expect(mockLogger.errorCalls[0].message).toBe('Failed to upload file2.txt: Upload failed');
    });

    it('should handle errors during execution', async () => {
      const options: CommandOptions = { folder: '/test/folder' };
      const error = new Error('Processing failed');

      mockFileUploadProcessor.process.mockRejectedValue(error);

      await (command as TestUploadFilesCommand).testExecute(options);

      expect(mockErrorHandler.handledErrors).toContain(error);
    });
  });

  describe('buildRateLimitConfig', () => {
    it('should build rate limit config with provided options', () => {
      const options: CommandOptions = { concurrent: 5, minTime: 1000 };
      const result = (command as TestUploadFilesCommand).testBuildRateLimitConfig(options);

      expect(result).toEqual({ maxConcurrent: 5, minTime: 1000 });
    });

    it('should use defaults when options not provided', () => {
      const options: CommandOptions = {};
      const result = (command as TestUploadFilesCommand).testBuildRateLimitConfig(options);

      expect(result).toEqual({ maxConcurrent: 1, minTime: 3000 });
    });
  });

  describe('buildProcessingOptions', () => {
    it('should build processing options with provided folder', () => {
      const options: CommandOptions = { folder: '/custom/folder', output: '/custom/output' };
      const rateLimitConfig: RateLimitConfig = { maxConcurrent: 5, minTime: 1000 };
      const result = (command as TestUploadFilesCommand).testBuildProcessingOptions(options, rateLimitConfig);

      expect(result).toEqual({
        folderPath: '/custom/folder',
        outputPath: '/custom/output',
        rateLimitConfig,
      });
    });

    it('should use defaults when options not provided', () => {
      const options: CommandOptions = {};
      const rateLimitConfig: RateLimitConfig = { maxConcurrent: 5, minTime: 1000 };
      const result = (command as TestUploadFilesCommand).testBuildProcessingOptions(options, rateLimitConfig);

      expect(result).toEqual({
        folderPath: '/test/input',
        outputPath: './output/uploaded-files.json',
        rateLimitConfig,
      });
    });
  });

  describe('reportResults', () => {
    it('should report successful results', () => {
      const results: UploadResult[] = [
        { success: true, fileName: 'file1.txt', cid: 'cid1' },
        { success: true, fileName: 'file2.txt', cid: 'cid2' },
      ];

      (command as TestUploadFilesCommand).testReportResults(results);

      expect(mockLogger.infoCalls[0].message).toBe('File upload completed: 2 successful, 0 failed');
    });

    it('should report results with failures', () => {
      const results: UploadResult[] = [
        { success: true, fileName: 'file1.txt', cid: 'cid1' },
        { success: false, fileName: 'file2.txt', error: 'Upload failed', cid: '' },
      ];

      (command as TestUploadFilesCommand).testReportResults(results);

      expect(mockLogger.warnCalls).toHaveLength(1);
      expect(mockLogger.errorCalls).toHaveLength(1);
      expect(mockLogger.infoCalls[0].message).toBe('File upload completed: 1 successful, 1 failed');
    });
  });
});
