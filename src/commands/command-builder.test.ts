import { Option } from 'commander';
import { CommandBuilder } from './command-builder';
import { OptionGroups } from './options';

jest.mock('./options', () => ({
  OptionGroups: {
    fileProcessing: jest.fn(),
    batchProcessing: jest.fn(),
    uploadFiles: jest.fn(),
    uploadFolder: jest.fn(),
    hashCalculation: jest.fn(),
    download: jest.fn(),
  },
}));

describe('CommandBuilder', () => {
  const mockedGroups = jest.mocked(OptionGroups);
  let builder: CommandBuilder;

  beforeEach(() => {
    builder = new CommandBuilder('test', 'description');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const optionGroup = () => [new Option('--flag <value>', 'test option')];

  describe('addOptionGroup', () => {
    it('adds each option from the group to the underlying command', () => {
      const command = builder.addOptionGroup(optionGroup()).build();
      expect(command.options).toHaveLength(1);
      expect(command.options[0].flags).toBe('--flag <value>');
    });
  });

  describe('addFileProcessingOptions', () => {
    it('delegates to OptionGroups.fileProcessing', () => {
      mockedGroups.fileProcessing.mockReturnValueOnce(optionGroup());
      const command = builder.addFileProcessingOptions('default.json').build();

      expect(mockedGroups.fileProcessing).toHaveBeenCalledTimes(1);
      expect(mockedGroups.fileProcessing).toHaveBeenCalledWith('default.json');
      expect(command.options).toHaveLength(1);
    });
  });

  describe('addBatchProcessingOptions', () => {
    it('delegates to OptionGroups.batchProcessing', () => {
      mockedGroups.batchProcessing.mockReturnValueOnce(optionGroup());
      builder.addBatchProcessingOptions();
      expect(mockedGroups.batchProcessing).toHaveBeenCalledWith(undefined);
    });
  });

  describe('addUploadFilesOptions', () => {
    it('delegates to OptionGroups.uploadFiles', () => {
      mockedGroups.uploadFiles.mockReturnValueOnce(optionGroup());
      builder.addUploadFilesOptions();
      expect(mockedGroups.uploadFiles).toHaveBeenCalledWith(undefined);
    });
  });

  describe('addUploadFolderOptions', () => {
    it('delegates to OptionGroups.uploadFolder', () => {
      mockedGroups.uploadFolder.mockReturnValueOnce(optionGroup());
      builder.addUploadFolderOptions('default.json');
      expect(mockedGroups.uploadFolder).toHaveBeenCalledWith('default.json');
    });
  });

  describe('addHashCalculationOptions', () => {
    it('delegates to OptionGroups.hashCalculation', () => {
      mockedGroups.hashCalculation.mockReturnValueOnce(optionGroup());
      builder.addHashCalculationOptions();
      expect(mockedGroups.hashCalculation).toHaveBeenCalledWith(undefined);
    });
  });

  describe('addDownloadOptions', () => {
    it('delegates to OptionGroups.download', () => {
      mockedGroups.download.mockReturnValueOnce(optionGroup());
      builder.addDownloadOptions('default.json');
      expect(mockedGroups.download).toHaveBeenCalledWith('default.json');
    });
  });

  describe('addOption', () => {
    it('adds the provided option to the command', () => {
      const option = new Option('--flag', 'custom option');
      const command = builder.addOption(option).build();
      expect(command.options.some(opt => opt === option)).toBe(true);
    });
  });

  describe('setAction', () => {
    it('registers the provided action handler', async () => {
      const action = jest.fn();
      const command = builder.setAction(action).build();

      await command.parseAsync(['node', 'cli'], { from: 'node' });

      expect(action).toHaveBeenCalledTimes(1);
    });
  });

  describe('build', () => {
    it('returns the same command instance across calls', () => {
      const first = builder.build();
      const second = builder.build();
      expect(first).toBe(second);
    });
  });
});
