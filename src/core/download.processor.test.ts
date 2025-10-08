import { PinataService } from '../services';
import { FileMapping, PinataConfig, ProcessingOptions } from '../types';
import { DownloadProcessor } from './download.processor';

// Mock dependencies
jest.mock('../services/pinata.service');

describe('DownloadProcessor', () => {
  let processor: DownloadProcessor;

  const mockPinataService = new PinataService({} as PinataConfig) as jest.Mocked<PinataService>;
  (PinataService as jest.Mock).mockImplementation(() => mockPinataService);

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    processor = new DownloadProcessor({ apiKey: 'test-key', apiSecret: 'test-secret' });
  });

  describe('constructor', () => {
    it('should initialize with PinataService', () => {
      expect(PinataService).toHaveBeenCalledWith({ apiKey: 'test-key', apiSecret: 'test-secret' });
    });
  });

  describe('process', () => {
    it('should validate options and log start', async () => {
      const mockOptions: ProcessingOptions = { folderPath: '/test/folder', outputPath: '/test/path' };
      const mockMappings: FileMapping = { 'file1.txt': 'cid1' };
      mockPinataService.downloadCIDMappings.mockResolvedValue(mockMappings);

      await processor.process(mockOptions);

      expect(mockPinataService.downloadCIDMappings).toHaveBeenCalledWith('all');
    });

    it('should download CID mappings and return them when not empty', async () => {
      const mockOptions: ProcessingOptions = { folderPath: '/test/folder', outputPath: '/test/path' };
      const mockMappings: FileMapping = { 'file1.txt': 'cid1', 'file2.txt': 'cid2' };
      const consoleTableSpy = jest.spyOn(console, 'table').mockImplementation();
      mockPinataService.downloadCIDMappings.mockResolvedValue(mockMappings);

      const result = await processor.process(mockOptions);

      expect(mockPinataService.downloadCIDMappings).toHaveBeenCalledWith('all');
      expect(consoleTableSpy).toHaveBeenCalledWith(mockMappings);
      expect(result).toEqual(mockMappings);

      consoleTableSpy.mockRestore();
    });

    it('should return empty object and warn when mappings are empty', async () => {
      const mockOptions: ProcessingOptions = { folderPath: '/test/folder', outputPath: '/test/path' };
      const mockMappings: FileMapping = {};
      mockPinataService.downloadCIDMappings.mockResolvedValue(mockMappings);

      const result = await processor.process(mockOptions);

      expect(result).toEqual({});
    });

    it('should handle errors', async () => {
      const mockOptions: ProcessingOptions = { folderPath: '/test/folder', outputPath: '/test/path' };
      const error = new Error('Download failed');
      mockPinataService.downloadCIDMappings.mockRejectedValue(error);

      await expect(processor.process(mockOptions)).rejects.toThrow('Download failed');

      expect(mockPinataService.downloadCIDMappings).toHaveBeenCalledWith('all');
    });
  });
});
