import { Command } from 'commander';
import { UploadCommand } from './upload.command';
import { UploadFilesCommand } from './upload-files.command';
import { UploadFolderCommand } from './upload-folder.command';

jest.mock('./upload-files.command');
jest.mock('./upload-folder.command');

describe('UploadCommand', () => {
  let mockFilesCommand: jest.Mocked<UploadFilesCommand>;
  let mockFolderCommand: jest.Mocked<UploadFolderCommand>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default commands when no arguments provided', () => {
      const command = new UploadCommand();
      expect(command).toBeInstanceOf(UploadCommand);
      expect(UploadFilesCommand).toHaveBeenCalledTimes(1);
      expect(UploadFolderCommand).toHaveBeenCalledTimes(1);
    });

    it('should use provided commands when arguments are provided', () => {
      mockFilesCommand = new UploadFilesCommand() as jest.Mocked<UploadFilesCommand>;
      mockFolderCommand = new UploadFolderCommand() as jest.Mocked<UploadFolderCommand>;
      const command = new UploadCommand(mockFilesCommand, mockFolderCommand);
      expect(command).toBeInstanceOf(UploadCommand);
      expect(UploadFilesCommand).toHaveBeenCalledTimes(1);
      expect(UploadFolderCommand).toHaveBeenCalledTimes(1);
    });
  });

  describe('configure', () => {
    let mockProgram: jest.Mocked<Command>;
    let mockSubCommand: jest.Mocked<Command>;

    beforeEach(() => {
      mockProgram = {
        command: jest.fn().mockReturnThis(),
      } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      mockSubCommand = {
        showHelpAfterError: jest.fn().mockReturnThis(),
        description: jest.fn().mockReturnThis(),
        hook: jest.fn().mockReturnThis(),
        help: jest.fn(),
      } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      mockProgram.command.mockReturnValue(mockSubCommand);
    });

    it('should configure the command with name, description, and hook', () => {
      const command = new UploadCommand(mockFilesCommand, mockFolderCommand);
      command.configure(mockProgram);

      expect(mockProgram.command).toHaveBeenCalledWith('upload');
      expect(mockSubCommand.showHelpAfterError).toHaveBeenCalledWith(true);
      expect(mockSubCommand.description).toHaveBeenCalledWith('Upload files or folders to Pinata IPFS');
      expect(mockSubCommand.hook).toHaveBeenCalledWith('preAction', expect.any(Function));
    });

    it('should call configure on files and folder commands', () => {
      const command = new UploadCommand(mockFilesCommand, mockFolderCommand);
      command.configure(mockProgram);

      expect(mockFilesCommand.configure).toHaveBeenCalledWith(mockSubCommand);
      expect(mockFolderCommand.configure).toHaveBeenCalledWith(mockSubCommand);
    });

    it('should show help when no subcommand is provided', () => {
      const command = new UploadCommand(mockFilesCommand, mockFolderCommand);

      command.configure(mockProgram);

      const hookCallback = mockSubCommand.hook.mock.calls[0][1];
      hookCallback(mockSubCommand, mockSubCommand);

      expect(mockSubCommand.help).toHaveBeenCalledWith({ error: false });
    });
  });
});
