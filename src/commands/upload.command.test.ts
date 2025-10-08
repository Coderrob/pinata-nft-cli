import { Command } from 'commander';
import { UploadCommand } from './upload.command';
import { UploadFilesCommand } from './upload-files.command';
import { UploadFolderCommand } from './upload-folder.command';

// Mock dependencies
jest.mock('./upload-files.command');
jest.mock('./upload-folder.command');

describe('UploadCommand', () => {
  let mockFilesCommand: jest.Mocked<UploadFilesCommand>;
  let mockFolderCommand: jest.Mocked<UploadFolderCommand>;
  let mockProgram: jest.Mocked<Command>;
  let mockSubCommand: jest.Mocked<Command>;

  beforeEach(() => {
    // Initialize mock references with proper jest.Mocked typing
    mockFilesCommand = {
      configure: jest.fn(),
    } as unknown as jest.Mocked<UploadFilesCommand>;

    mockFolderCommand = {
      configure: jest.fn(),
    } as unknown as jest.Mocked<UploadFolderCommand>;

    mockProgram = {
      command: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Command>;

    mockSubCommand = {
      showHelpAfterError: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      hook: jest.fn().mockReturnThis(),
      help: jest.fn(),
    } as unknown as jest.Mocked<Command>;

    // Setup mockProgram.command to return mockSubCommand
    mockProgram.command.mockReturnValue(mockSubCommand);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    // Cleanup to prevent memory leaks
    mockFilesCommand = undefined as any;
    mockFolderCommand = undefined as any;
    mockProgram = undefined as any;
    mockSubCommand = undefined as any;
  });

  describe('constructor', () => {
    it('should initialize with default commands when no arguments provided', () => {
      // Setup mocks to return our mock instances
      (UploadFilesCommand as jest.Mock).mockImplementation(() => mockFilesCommand);
      (UploadFolderCommand as jest.Mock).mockImplementation(() => mockFolderCommand);

      const command = new UploadCommand();
      expect(command).toBeInstanceOf(UploadCommand);
      expect(UploadFilesCommand).toHaveBeenCalledTimes(1);
      expect(UploadFolderCommand).toHaveBeenCalledTimes(1);
    });

    it('should use provided commands when arguments are provided', () => {
      const command = new UploadCommand(mockFilesCommand, mockFolderCommand);
      expect(command).toBeInstanceOf(UploadCommand);
      // When providing arguments, the constructor should not create new instances
      expect(UploadFilesCommand).toHaveBeenCalledTimes(0);
      expect(UploadFolderCommand).toHaveBeenCalledTimes(0);
    });
  });

  describe('configure', () => {
    it('should configure the command with name, description, and hook', () => {
      const command = new UploadCommand(mockFilesCommand, mockFolderCommand);
      command.configure(mockProgram);

      expect(mockProgram.command).toHaveBeenCalledWith('upload');
      expect(mockProgram.command).toHaveBeenCalledTimes(1);
      expect(mockSubCommand.showHelpAfterError).toHaveBeenCalledWith(true);
      expect(mockSubCommand.showHelpAfterError).toHaveBeenCalledTimes(1);
      expect(mockSubCommand.description).toHaveBeenCalledWith('Upload files or folders to Pinata IPFS');
      expect(mockSubCommand.description).toHaveBeenCalledTimes(1);
      expect(mockSubCommand.hook).toHaveBeenCalledWith('preAction', expect.any(Function));
      expect(mockSubCommand.hook).toHaveBeenCalledTimes(1);
    });

    it('should call configure on files and folder commands', () => {
      const command = new UploadCommand(mockFilesCommand, mockFolderCommand);
      command.configure(mockProgram);

      expect(mockFilesCommand.configure).toHaveBeenCalledWith(mockSubCommand);
      expect(mockFilesCommand.configure).toHaveBeenCalledTimes(1);
      expect(mockFolderCommand.configure).toHaveBeenCalledWith(mockSubCommand);
      expect(mockFolderCommand.configure).toHaveBeenCalledTimes(1);
    });

    it('should show help when no subcommand is provided', () => {
      const command = new UploadCommand(mockFilesCommand, mockFolderCommand);
      command.configure(mockProgram);

      const hookCallback = mockSubCommand.hook.mock.calls[0][1];
      hookCallback(mockSubCommand, mockSubCommand);

      expect(mockSubCommand.help).toHaveBeenCalledWith({ error: false });
      expect(mockSubCommand.help).toHaveBeenCalledTimes(1);
    });
  });
});
