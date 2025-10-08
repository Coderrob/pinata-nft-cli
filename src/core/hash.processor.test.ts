/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 *  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import Bottleneck from 'bottleneck';
import { HashProcessor } from './hash.processor';
import { FileService, HashCalculatorService } from '../services';
import { FileMapping, ProcessingOptions } from '../types';

// Mock dependencies
jest.mock('../services/file.service');
jest.mock('../services/hash-calculator.service');

describe('HashProcessor', () => {
  let processor: HashProcessor;

  const mockFileService = new FileService() as jest.Mocked<FileService>;
  const mockHashCalculatorService = new HashCalculatorService(
    new Bottleneck(),
    {}
  ) as jest.Mocked<HashCalculatorService>;

  (FileService as jest.Mock).mockImplementation(() => mockFileService);
  (HashCalculatorService as jest.Mock).mockImplementation(() => mockHashCalculatorService);

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    processor = new HashProcessor();
  });

  describe('constructor', () => {
    it('should initialize with default rateLimitConfig', () => {
      expect(processor).toBeDefined();
    });

    it('should initialize with custom rateLimitConfig', () => {
      const customConfig = { maxConcurrent: 10 };
      processor = new HashProcessor(customConfig);
      expect(processor).toBeDefined();
    });
  });

  describe('process', () => {
    it('should process files and return sorted hash mapping', async () => {
      const mockOptions: ProcessingOptions = { folderPath: '/test/folder', outputPath: '/test/output.json' };
      const mockFiles = ['/test/file1.txt'];
      const mockHashMapping = { 'file1.txt': 'hash1' };
      const mockSortedMapping = { 'file1.txt': 'hash1' };

      mockFileService.readFiles.mockResolvedValue(mockFiles);
      mockHashCalculatorService.calculateHashes.mockResolvedValue(mockHashMapping);
      mockFileService.saveJson.mockResolvedValue();

      const result = await processor.process(mockOptions);

      expect(mockFileService.readFiles).toHaveBeenCalledWith(mockOptions.folderPath);
      expect(mockHashCalculatorService.calculateHashes).toHaveBeenCalledWith(mockFiles);
      expect(mockFileService.saveJson).toHaveBeenCalledWith(mockOptions.outputPath, mockSortedMapping);
      expect(result).toEqual(mockSortedMapping);
    });

    it('should return empty object when no files found', async () => {
      const mockOptions: ProcessingOptions = { folderPath: '/test/folder', outputPath: '/test/output.json' };
      mockFileService.readFiles.mockResolvedValue([]);

      const result = await processor.process(mockOptions);

      expect(result).toEqual({});
    });

    it('should handle errors', async () => {
      const mockOptions: ProcessingOptions = { folderPath: '/test/folder', outputPath: '/test/output.json' };
      const mockError = new Error('Test error');
      mockFileService.readFiles.mockRejectedValue(mockError);

      await expect(processor.process(mockOptions)).rejects.toThrow('Test error');
    });
  });

  describe('processWithFinalHash', () => {
    it('should process files, calculate final hash, and save it', async () => {
      const mockOptions: ProcessingOptions = { folderPath: '/test/folder', outputPath: '/test/output.json' };
      const mockHashMapping: FileMapping = { 'file1.txt': 'hash1', 'file2.txt': 'hash2' };
      const mockFinalHash = 'finalHash';
      const finalOutputPath = '/test/final.json';

      jest.spyOn(processor, 'process').mockResolvedValue(mockHashMapping);
      mockHashCalculatorService.calculateHashOfHashes.mockResolvedValue(mockFinalHash);
      mockFileService.saveJson.mockResolvedValue();

      const result = await processor.processWithFinalHash(mockOptions, finalOutputPath);

      expect(processor.process).toHaveBeenCalledWith(mockOptions);
      expect(mockHashCalculatorService.calculateHashOfHashes).toHaveBeenCalledWith(['hash1', 'hash2']);
      expect(mockFileService.saveJson).toHaveBeenCalledWith(finalOutputPath, mockFinalHash);
      expect(result).toEqual(mockFinalHash);
    });
  });
});
