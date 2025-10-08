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

import { FileUploadProcessor } from './file-upload.processor';
import { FileService, PinataService } from '../services';
import { PinataConfig, ProcessingOptions, UploadResult } from '../types';

// Mock dependencies
jest.mock('../services/file.service');
jest.mock('../services/pinata.service');

describe('FileUploadProcessor', () => {
  let processor: FileUploadProcessor;
  const mockFileService = new FileService() as jest.Mocked<FileService>;
  const mockPinataService = new PinataService({} as PinataConfig) as jest.Mocked<PinataService>;

  (FileService as jest.Mock).mockImplementation(() => mockFileService);
  (PinataService as jest.Mock).mockImplementation(() => mockPinataService);

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    processor = new FileUploadProcessor({ apiKey: 'test-key', apiSecret: 'test-secret' });
  });

  describe('constructor', () => {
    it('should initialize with PinataService', () => {
      expect(PinataService).toHaveBeenCalledWith({ apiKey: 'test-key', apiSecret: 'test-secret' });
    });
  });

  describe('process', () => {
    it('should process files and return upload results', async () => {
      const mockOptions: ProcessingOptions = { folderPath: '/test/folder', outputPath: '/test/output.json' };
      const mockFiles = ['/test/file1.txt'];
      const mockResults: UploadResult[] = [{ fileName: 'file1.txt', cid: 'cid1', success: true }];

      mockFileService.readFiles.mockResolvedValue(mockFiles);
      mockFileService.readJson.mockResolvedValue({});
      mockPinataService.checkFileExists.mockReturnValue({ exists: false });
      mockPinataService.uploadFile.mockResolvedValue('cid1');
      mockFileService.saveJson.mockResolvedValue();

      const result = await processor.process(mockOptions);

      expect(mockFileService.readFiles).toHaveBeenCalledWith(mockOptions.folderPath);
      expect(mockPinataService.checkFileExists).toHaveBeenCalledWith('file1.txt', {});
      expect(mockPinataService.uploadFile).toHaveBeenCalledWith('/test/file1.txt', 'file1.txt');
      expect(mockFileService.saveJson).toHaveBeenCalledWith(mockOptions.outputPath, { 'file1.txt': 'cid1' });
      expect(result).toEqual(mockResults);
    });

    it('should return empty array when no files found', async () => {
      const mockOptions: ProcessingOptions = { folderPath: '/test/folder', outputPath: '/test/output.json' };
      mockFileService.readFiles.mockResolvedValue([]);

      const result = await processor.process(mockOptions);

      expect(result).toEqual([]);
    });

    it('should handle errors', async () => {
      const mockOptions: ProcessingOptions = { folderPath: '/test/folder', outputPath: '/test/output.json' };
      const mockError = new Error('Test error');
      mockFileService.readFiles.mockRejectedValue(mockError);

      await expect(processor.process(mockOptions)).rejects.toThrow('Test error');
    });
  });
});
