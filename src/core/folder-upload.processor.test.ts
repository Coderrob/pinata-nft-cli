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

import { FolderUploadProcessor } from './folder-upload.processor';
import { PinataService } from '../services';
import { PinataConfig, ProcessingOptions, FolderUploadResult } from '../types';

// Mock dependencies
jest.mock('../services/pinata.service');

describe('FolderUploadProcessor', () => {
  let processor: FolderUploadProcessor;

  const mockPinataService = new PinataService({} as PinataConfig) as jest.Mocked<PinataService>;
  (PinataService as jest.Mock).mockImplementation(() => mockPinataService);

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    processor = new FolderUploadProcessor({ apiKey: 'test-key', apiSecret: 'test-secret' });
  });

  describe('constructor', () => {
    it('should initialize with PinataService', () => {
      expect(PinataService).toHaveBeenCalledWith({ apiKey: 'test-key', apiSecret: 'test-secret' });
    });
  });

  describe('process', () => {
    it('should successfully upload a folder and return the result', async () => {
      const mockOptions: ProcessingOptions = { folderPath: '/test/folder', outputPath: '/test/output.json' };
      const mockCid = 'QmTestCid';
      const displayName = 'folder';
      mockPinataService.uploadFolder.mockResolvedValue(mockCid);

      const result: FolderUploadResult = await processor.process(mockOptions, displayName);

      expect(mockPinataService.uploadFolder).toHaveBeenCalledWith('/test/folder', 'folder');
      expect(result).toEqual({
        folderName: 'folder',
        cid: 'QmTestCid',
        success: true,
      });
    });

    it('should use default folder name when not provided', async () => {
      const mockOptions: ProcessingOptions = { folderPath: '/test/folder', outputPath: '/test/output.json' };
      const mockCid = 'QmTestCid';
      mockPinataService.uploadFolder.mockResolvedValue(mockCid);

      const result: FolderUploadResult = await processor.process(mockOptions);

      expect(mockPinataService.uploadFolder).toHaveBeenCalledWith('/test/folder', 'folder');
      expect(result.folderName).toBe('folder');
    });

    it('should use "metadata" as display name when folderPath has no name', async () => {
      const mockOptionsNoName = { folderPath: '/path/to/', outputPath: '/path/to/output.json' };
      const mockCid = 'QmTestCid';
      mockPinataService.uploadFolder.mockResolvedValue(mockCid);

      const result: FolderUploadResult = await processor.process(mockOptionsNoName);

      expect(mockPinataService.uploadFolder).toHaveBeenCalledWith(mockOptionsNoName.folderPath, 'metadata');
      expect(result.folderName).toBe('metadata');
    });

    it('should handle upload failure and return error result', async () => {
      const mockOptions: ProcessingOptions = { folderPath: '/test/folder', outputPath: '/test/output.json' };
      const mockError = new Error('Upload failed');
      const displayName = 'folder';
      mockPinataService.uploadFolder.mockRejectedValue(mockError);

      const result: FolderUploadResult = await processor.process(mockOptions, displayName);

      expect(mockPinataService.uploadFolder).toHaveBeenCalledWith('/test/folder', displayName);
      expect(result).toEqual({
        folderName: displayName,
        cid: '',
        success: false,
        error: 'Upload failed',
      });
    });

    it('should handle non-Error exceptions', async () => {
      const mockOptions: ProcessingOptions = { folderPath: '/test/folder', outputPath: '/test/output.json' };
      const mockError = 'String error';
      const displayName = 'folder';
      mockPinataService.uploadFolder.mockRejectedValue(mockError);

      const result: FolderUploadResult = await processor.process(mockOptions, displayName);

      expect(result.error).toBe('String error');
    });
  });
});
