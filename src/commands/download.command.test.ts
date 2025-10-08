/* eslint-disable @typescript-eslint/no-explicit-any */

import { Command } from 'commander';
import { createMockCommander } from './test-utils';
import { DownloadCommand } from './download.command';
import { OutputPaths } from '../config/output-paths';
import { DownloadProcessor } from '../core';
import { CommandOptions, PinStatus } from '../types';
import { OptionGroups } from './options';

// Mock dependencies
jest.mock('commander', () => createMockCommander());
jest.mock('../config/output-paths');
jest.mock('../core');
jest.mock('../types');
jest.mock('./options');
jest.mock('./base.command');

describe('DownloadCommand', () => {
  let command: DownloadCommand;
  let mockProgram: jest.Mocked<Command>;
  let mockBaseCommand: any;

  // Test subclass to expose protected methods
  class TestDownloadCommand extends DownloadCommand {
    public testExecute(options: CommandOptions & { status?: string }): Promise<void> {
      return this.execute(options);
    }

    public testValidatePinStatus(status: string): PinStatus {
      return this.validatePinStatus(status);
    }
  }

  let testCommand: TestDownloadCommand;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock BaseCommand
    mockBaseCommand = {
      commandName: 'download',
      description: 'Download CID mappings from Pinata',
      validateOptions: jest.fn(),
      getPinataConfig: jest.fn(),
      logger: { info: jest.fn() },
      logSuccess: jest.fn(),
      handleError: jest.fn(),
    };

    // Mock Command
    mockProgram = {
      command: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      addOption: jest.fn().mockReturnThis(),
      action: jest.fn(),
    } as any;

    // Mock OptionGroups
    (OptionGroups.download as jest.Mock).mockReturnValue([]);

    // Create instance
    command = new DownloadCommand();
    // Manually set mocked properties since it's extending BaseCommand
    Object.assign(command, mockBaseCommand);

    // Create test instance
    testCommand = new TestDownloadCommand();
    Object.assign(testCommand, mockBaseCommand);
  });

  describe('constructor', () => {
    it('should initialize with correct command name and description', () => {
      expect((command as any).commandName).toBe('download');
      expect((command as any).description).toBe('Download CID mappings from Pinata');
    });
  });

  describe('configure', () => {
    it('should configure the command with name, description, options, and action', () => {
      command.configure(mockProgram);

      expect(mockProgram.command).toHaveBeenCalledWith('download');
      expect(mockProgram.description).toHaveBeenCalledWith('Download CID mappings from Pinata');
      expect(OptionGroups.download).toHaveBeenCalledWith(OutputPaths.FILES.downloadedCids);
      expect(mockProgram.action).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('execute', () => {
    let mockProcessor: jest.Mocked<DownloadProcessor>;
    let options: CommandOptions & { status?: string };

    beforeEach(() => {
      options = { output: '/path/to/output' };
      mockProcessor = {
        process: jest.fn().mockResolvedValue({ cid1: 'mapping1', cid2: 'mapping2' }),
      } as any;
      (DownloadProcessor as jest.Mock).mockImplementation(() => mockProcessor);
    });

    it('should execute successfully with default status', async () => {
      await testCommand.testExecute(options);

      expect(mockBaseCommand.validateOptions).toHaveBeenCalledWith(options);
      expect(mockBaseCommand.logger.info).toHaveBeenCalledWith('Starting CID download process');
      expect(mockBaseCommand.getPinataConfig).toHaveBeenCalled();
      expect(DownloadProcessor).toHaveBeenCalled();
      expect(mockProcessor.process).toHaveBeenCalledWith(
        { folderPath: '', outputPath: '/path/to/output' },
        PinStatus.ALL
      );
      expect(mockBaseCommand.logSuccess).toHaveBeenCalledWith('Downloaded 2 CID mappings from Pinata');
    });

    it('should execute successfully with pinned status', async () => {
      options.status = 'pinned';
      await testCommand.testExecute(options);

      expect(mockProcessor.process).toHaveBeenCalledWith(
        { folderPath: '', outputPath: '/path/to/output' },
        PinStatus.PINNED
      );
    });

    it('should use default output path if not provided', async () => {
      const optionsWithoutOutput: CommandOptions & { status?: string } =
        options.folder !== undefined ? { folder: options.folder } : {};
      await testCommand.testExecute(optionsWithoutOutput);

      expect(mockProcessor.process).toHaveBeenCalledWith(
        { folderPath: '', outputPath: OutputPaths.FILES.downloadedCids },
        PinStatus.ALL
      );
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      mockBaseCommand.validateOptions.mockImplementation(() => {
        throw error;
      });

      await testCommand.testExecute(options);

      expect(mockBaseCommand.handleError).toHaveBeenCalledWith(error);
    });
  });

  describe('validatePinStatus', () => {
    it('should validate pin status correctly', () => {
      expect(testCommand.testValidatePinStatus('all')).toBe(PinStatus.ALL);
      expect(testCommand.testValidatePinStatus('pinned')).toBe(PinStatus.PINNED);
      expect(testCommand.testValidatePinStatus('unpinned')).toBe(PinStatus.UNPINNED);
      expect(testCommand.testValidatePinStatus('ALL')).toBe(PinStatus.ALL);
      expect(testCommand.testValidatePinStatus('Pinned')).toBe(PinStatus.PINNED);
      expect(() => testCommand.testValidatePinStatus('invalid')).toThrow(
        "Invalid pin status: invalid. Use 'all', 'pinned', or 'unpinned'"
      );
    });
  });
});
