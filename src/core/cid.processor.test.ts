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

import { CIDProcessor } from './cid.processor';
import { CIDCalculatorService, FileService } from '../services';
import { ProcessingOptions } from '../types';
import { ObjectUtils } from '../utils';
import { isEmptyArray } from '../utils/guards';

// Mock dependencies
jest.mock('../services');
// Mock utils but preserve the guards we need for validation
jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
}));
// Mock specific guard functions
jest.mock('../utils/guards', () => ({
  ...jest.requireActual('../utils/guards'),
  isEmptyArray: jest.fn(),
}));

// Mock the mocked modules to get proper typing
const mockFileService = FileService as jest.MockedClass<typeof FileService>;
const mockCIDCalculatorService = CIDCalculatorService as jest.MockedClass<typeof CIDCalculatorService>;
const mockIsEmptyArray = jest.mocked(isEmptyArray);

describe('CIDProcessor', () => {
  let processor: CIDProcessor;
  let fileServiceInstance: jest.Mocked<FileService>;
  let cidCalculatorInstance: jest.Mocked<CIDCalculatorService>;

  // Test data
  let mockOptions: ProcessingOptions;
  let mockFiles: string[];
  let mockCIDMapping: Record<string, string>;
  let sortedMapping: Record<string, string>;

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    // Initialize fresh test data for each test
    mockOptions = {
      folderPath: '/test/folder',
      outputPath: '/test/output.json',
    } as ProcessingOptions;
    mockFiles = ['file1.txt', 'file2.txt'];
    mockCIDMapping = { 'file1.txt': 'QmCID1', 'file2.txt': 'QmCID2' };
    sortedMapping = { 'file1.txt': 'QmCID1', 'file2.txt': 'QmCID2' };

    // Create fresh mock instances with partial implementation
    fileServiceInstance = {
      readFiles: jest.fn(),
      saveJson: jest.fn(),
    } as unknown as jest.Mocked<FileService>;

    cidCalculatorInstance = {
      calculateCIDs: jest.fn(),
    } as unknown as jest.Mocked<CIDCalculatorService>;

    // Mock constructors to return our instances
    mockFileService.mockImplementation(() => fileServiceInstance);
    mockCIDCalculatorService.mockImplementation(() => cidCalculatorInstance);

    // Mock static method on ObjectUtils
    jest.spyOn(ObjectUtils, 'sortObjectByKeys').mockImplementation(jest.fn());

    processor = new CIDProcessor();
  });

  describe('constructor', () => {
    it('should initialize with default rate limit config', () => {
      expect(processor).toBeInstanceOf(CIDProcessor);
    });

    it('should initialize with custom rate limit config', () => {
      const customConfig = { maxConcurrent: 10 };
      const customProcessor = new CIDProcessor(customConfig);
      expect(customProcessor).toBeInstanceOf(CIDProcessor);
    });
  });

  describe('process', () => {
    it('should process files successfully and return sorted CID mapping', async () => {
      // Setup mocks
      fileServiceInstance.readFiles.mockResolvedValue(mockFiles);
      mockIsEmptyArray.mockReturnValue(false);
      cidCalculatorInstance.calculateCIDs.mockResolvedValue(mockCIDMapping);
      jest.mocked(ObjectUtils.sortObjectByKeys).mockReturnValue(sortedMapping);
      fileServiceInstance.saveJson.mockResolvedValue();

      const result = await processor.process(mockOptions);

      // Verify interactions
      expect(fileServiceInstance.readFiles).toHaveBeenCalledWith(mockOptions.folderPath);
      expect(mockIsEmptyArray).toHaveBeenCalledWith(mockFiles);
      expect(cidCalculatorInstance.calculateCIDs).toHaveBeenCalledWith(mockFiles);
      expect(ObjectUtils.sortObjectByKeys).toHaveBeenCalledWith(mockCIDMapping);
      expect(fileServiceInstance.saveJson).toHaveBeenCalledWith(mockOptions.outputPath, sortedMapping);
      expect(result).toEqual(sortedMapping);
    });

    it('should return empty object when no files are found', async () => {
      // Setup mocks for empty file list
      fileServiceInstance.readFiles.mockResolvedValue([]);
      mockIsEmptyArray.mockReturnValue(true);

      const result = await processor.process(mockOptions);

      expect(fileServiceInstance.readFiles).toHaveBeenCalledWith(mockOptions.folderPath);
      expect(mockIsEmptyArray).toHaveBeenCalledWith([]);
      expect(result).toEqual({});
      expect(cidCalculatorInstance.calculateCIDs).not.toHaveBeenCalled();
      expect(fileServiceInstance.saveJson).not.toHaveBeenCalled();
    });

    it('should handle errors during processing', async () => {
      const testError = new Error('Test processing error');
      fileServiceInstance.readFiles.mockRejectedValue(testError);

      // The processor should throw a structured error with proper context
      await expect(processor.process(mockOptions)).rejects.toThrow();

      expect(fileServiceInstance.readFiles).toHaveBeenCalledWith(mockOptions.folderPath);
    });

    it('should handle errors during CID calculation', async () => {
      const testError = new Error('CID calculation failed');
      fileServiceInstance.readFiles.mockResolvedValue(mockFiles);
      mockIsEmptyArray.mockReturnValue(false);
      cidCalculatorInstance.calculateCIDs.mockRejectedValue(testError);

      // The processor should throw a structured error with proper context
      await expect(processor.process(mockOptions)).rejects.toThrow();

      expect(cidCalculatorInstance.calculateCIDs).toHaveBeenCalledWith(mockFiles);
    });

    it('should handle errors during file saving', async () => {
      const testError = new Error('File save failed');
      fileServiceInstance.readFiles.mockResolvedValue(mockFiles);
      mockIsEmptyArray.mockReturnValue(false);
      cidCalculatorInstance.calculateCIDs.mockResolvedValue(mockCIDMapping);
      jest.mocked(ObjectUtils.sortObjectByKeys).mockReturnValue(sortedMapping);
      fileServiceInstance.saveJson.mockRejectedValue(testError);

      // The processor should throw a structured error with proper context
      await expect(processor.process(mockOptions)).rejects.toThrow();

      expect(fileServiceInstance.saveJson).toHaveBeenCalledWith(mockOptions.outputPath, sortedMapping);
    });
  });
});
