/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Command } from 'commander';
import { MockLogger, MockConfigProvider, MockErrorHandler } from './test-utils';
import { AppConfig } from '../config';
import { FolderUploadProcessor } from '../core';
import { CommandOptions } from '../types';
import { OptionGroups } from './options';
import { UploadFolderCommand } from './upload-folder.command';

/**
 * Copyright (C) 2025 Robert Lindley
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
jest.mock('../config', () => ({
  AppConfig: {
    getFileProcessingConfig: jest.fn(),
  },
  OutputPaths: {
    FILES: {
      folderCid: './output/folder-cid.json',
    },
  },
}));
jest.mock('../core');
jest.mock('./options', () => ({
  OptionGroups: {
    uploadFolder: jest.fn().mockReturnValue([]),
  },
}));

describe('UploadFolderCommand', () => {
  let command: UploadFolderCommand;
  let mockLogger: MockLogger;
  let mockConfigProvider: MockConfigProvider;
  let mockErrorHandler: MockErrorHandler;
  let mockProgram: jest.Mocked<Command>;
  let mockFolderUploadProcessor: any;
  let mockOptionGroups: any;

  // Test subclass to expose protected methods
  class TestUploadFolderCommand extends UploadFolderCommand {
    public testExecute(options: CommandOptions): Promise<void> {
      return (this as any).execute(options);
    }

    public testCreateProcessor(): FolderUploadProcessor {
      return (this as any).createProcessor();
    }
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    // Create mock dependencies
    mockLogger = new MockLogger();
    mockConfigProvider = new MockConfigProvider();
    mockErrorHandler = new MockErrorHandler();

    // Create command with injected dependencies
    command = new TestUploadFolderCommand(mockLogger, mockConfigProvider, mockErrorHandler);

    // Mock external dependencies
    mockProgram = new Command() as jest.Mocked<Command>;
    mockFolderUploadProcessor = {
      process: jest.fn(),
    };
    mockOptionGroups = OptionGroups;

    // Setup mock returns
    (AppConfig.getFileProcessingConfig as any).mockReturnValue({
      defaultInputFolder: '/test/input',
    });
    (FolderUploadProcessor as any).mockImplementation(() => mockFolderUploadProcessor);
  });

  describe('constructor', () => {
    it('should create command with correct name and description', () => {
      expect((command as any).commandName).toBe('folder');
      expect((command as any).description).toBe('Upload an entire folder to Pinata IPFS');
    });
  });

  describe('configure', () => {
    it('should configure the command on parent program', () => {
      command.configure(mockProgram);

      expect(mockProgram.command).toHaveBeenCalledWith('folder');
      expect(mockOptionGroups.uploadFolder).toHaveBeenCalledWith('./output/folder-cid.json');
    });
  });

  describe('execute', () => {
    it('should execute folder upload workflow successfully', async () => {
      const options: CommandOptions = { folder: '/test/folder' };
      const result = {
        success: true,
        cid: 'folder-cid',
        name: 'test-folder',
        folderName: 'test-folder',
        error: undefined,
      };

      mockFolderUploadProcessor.process.mockResolvedValue(result);

      await (command as TestUploadFolderCommand).testExecute(options);

      expect(mockLogger.infoCalls).toHaveLength(2);
      expect(mockLogger.infoCalls[0].message).toBe('Starting folder upload process');
      expect(mockLogger.infoCalls[1].message).toBe("Folder 'test-folder' uploaded successfully. CID: folder-cid");
    });

    it('should handle errors during execution', async () => {
      const options: CommandOptions = { folder: '/test/folder' };
      const error = new Error('Processing failed');

      mockFolderUploadProcessor.process.mockRejectedValue(error);

      await (command as TestUploadFolderCommand).testExecute(options);

      expect(mockErrorHandler.handledErrors).toContain(error);
    });
  });
});
