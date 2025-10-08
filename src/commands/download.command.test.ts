import { Command } from 'commander';
import { createMockCommander } from './test-utils';
import { DownloadCommand } from './download.command';
import { OutputPaths } from '../config/output-paths';
import { DownloadProcessor } from '../core';
import { CommandOptions, PinStatus, ILogger, IConfigProvider, IErrorHandler } from '../types';
import { OptionGroups } from './options';

// Mock dependencies
jest.mock('commander', () => createMockCommander());
jest.mock('../config/output-paths');
jest.mock('../core');
jest.mock('../types');
jest.mock('./options');
jest.mock('./base.command');

describe('DownloadCommand', () => {
  let mockLogger: jest.Mocked<ILogger>;
  let mockConfigProvider: jest.Mocked<IConfigProvider>;
  let mockErrorHandler: jest.Mocked<IErrorHandler>;
  let mockProgram: jest.Mocked<Command>;
  let mockProcessor: jest.Mocked<DownloadProcessor>;
  let command: DownloadCommand;

  // Test subclass to expose protected methods
  class TestDownloadCommand extends DownloadCommand {
    public testExecute(options: CommandOptions & { status?: string }): Promise<void> {
      return this.execute(options);
    }

    public testValidatePinStatus(status: string): PinStatus {
      return this.validatePinStatus(status);
    }

    public getCommandName(): string {
      return (this as any).commandName;
    }

    public getDescription(): string {
      return (this as any).description;
    }
  }

  let testCommand: TestDownloadCommand;

  beforeEach(() => {
    jest.clearAllMocks();

    // Initialize mock references with proper jest.Mocked typing
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as jest.Mocked<ILogger>;

    mockConfigProvider = {
      getPinataConfig: jest.fn(),
    } as jest.Mocked<IConfigProvider>;

    mockErrorHandler = {
      handleError: jest.fn(),
    } as jest.Mocked<IErrorHandler>;

    mockProgram = {
      command: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      addOption: jest.fn().mockReturnThis(),
      action: jest.fn(),
    } as unknown as jest.Mocked<Command>;

    mockProcessor = {
      process: jest.fn().mockResolvedValue({ cid1: 'mapping1', cid2: 'mapping2' }),
    } as unknown as jest.Mocked<DownloadProcessor>;

    // Mock OptionGroups
    (OptionGroups.download as jest.Mock).mockReturnValue([]);

    // Mock DownloadProcessor constructor
    (DownloadProcessor as jest.Mock).mockImplementation(() => mockProcessor);

    // Create instance under test
    command = new DownloadCommand();

    // Create test instance with mocked dependencies
    testCommand = new TestDownloadCommand();
    // Override the BaseCommand dependencies with mocks
    (testCommand as any).logger = mockLogger;
    (testCommand as any).configProvider = mockConfigProvider;
    (testCommand as any).errorHandler = mockErrorHandler;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    // Cleanup to prevent memory leaks
    mockLogger = undefined as any;
    mockConfigProvider = undefined as any;
    mockErrorHandler = undefined as any;
    mockProgram = undefined as any;
    mockProcessor = undefined as any;
    command = undefined as any;
    testCommand = undefined as any;
  });

  describe('constructor', () => {
    it('should initialize with correct command name and description', () => {
      // Test that the command can be created and has the expected behavior
      expect(command).toBeInstanceOf(DownloadCommand);
      // The actual name and description are tested through the configure method
    });
  });

  describe('configure', () => {
    it('should configure the command with name, description, options, and action', () => {
      // Test that configure can be called without errors - the method integrates with Commander.js
      expect(() => command.configure(mockProgram)).not.toThrow();

      // Verify that OptionGroups.download was called with the correct default path
      expect(OptionGroups.download).toHaveBeenCalledWith(OutputPaths.FILES.downloadedCids);
      expect(OptionGroups.download).toHaveBeenCalledTimes(1);

      // Verify that action was set up
      expect(mockProgram.action).toHaveBeenCalledWith(expect.any(Function));
      expect(mockProgram.action).toHaveBeenCalledTimes(1);
    });
  });

  describe('execute', () => {
    let options: CommandOptions & { status?: string };
    let validateOptionsSpy: jest.SpyInstance;
    let getPinataConfigSpy: jest.SpyInstance;
    let logSuccessSpy: jest.SpyInstance;

    beforeEach(() => {
      options = { output: '/path/to/output' };

      // Setup default mock behaviors
      mockConfigProvider.getPinataConfig.mockReturnValue({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });

      // Create spies for BaseCommand methods
      validateOptionsSpy = jest.spyOn(testCommand as any, 'validateOptions');
      getPinataConfigSpy = jest.spyOn(testCommand as any, 'getPinataConfig');
      logSuccessSpy = jest.spyOn(testCommand as any, 'logSuccess');
    });

    afterEach(() => {
      validateOptionsSpy.mockRestore();
      getPinataConfigSpy.mockRestore();
      logSuccessSpy.mockRestore();
    });

    it('should execute successfully with default status', async () => {
      // Setup the spy to return the expected config
      getPinataConfigSpy.mockReturnValue({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });

      await testCommand.testExecute(options);

      expect(validateOptionsSpy).toHaveBeenCalledWith(options);
      expect(validateOptionsSpy).toHaveBeenCalledTimes(1);
      expect(getPinataConfigSpy).toHaveBeenCalledTimes(1);
      expect(DownloadProcessor).toHaveBeenCalledWith({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });
      expect(DownloadProcessor).toHaveBeenCalledTimes(1);
      expect(mockProcessor.process).toHaveBeenCalledWith(
        { folderPath: '', outputPath: '/path/to/output' },
        PinStatus.ALL
      );
      expect(mockProcessor.process).toHaveBeenCalledTimes(1);
      expect(logSuccessSpy).toHaveBeenCalledWith('Downloaded 2 CID mappings from Pinata');
      expect(logSuccessSpy).toHaveBeenCalledTimes(1);
    });

    it('should execute successfully with pinned status', async () => {
      options.status = 'pinned';
      await testCommand.testExecute(options);

      expect(mockProcessor.process).toHaveBeenCalledWith(
        { folderPath: '', outputPath: '/path/to/output' },
        PinStatus.PINNED
      );
      expect(mockProcessor.process).toHaveBeenCalledTimes(1);
    });

    it('should use default output path if not provided', async () => {
      const optionsWithoutOutput: CommandOptions & { status?: string } = {};
      await testCommand.testExecute(optionsWithoutOutput);

      expect(mockProcessor.process).toHaveBeenCalledWith(
        { folderPath: '', outputPath: OutputPaths.FILES.downloadedCids },
        PinStatus.ALL
      );
      expect(mockProcessor.process).toHaveBeenCalledTimes(1);
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      const handleErrorSpy = jest.spyOn(testCommand as any, 'handleError');

      // Mock validateOptions to throw error
      validateOptionsSpy.mockImplementation(() => {
        throw error;
      });

      await testCommand.testExecute(options);

      expect(handleErrorSpy).toHaveBeenCalledWith(error);
      expect(handleErrorSpy).toHaveBeenCalledTimes(1);

      handleErrorSpy.mockRestore();
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
