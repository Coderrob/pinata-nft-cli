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

import { FileService } from './file.service';
import { FileSystemError } from '../errors';
import { Logger } from '../utils';
import { FileUtils } from '../utils/file.utils';

// Mock dependencies
jest.mock('../utils', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    startOperation: jest.fn(),
    getStructuredLogger: jest.fn(),
  })),
  isEmptyArray: jest.fn(arr => !arr || arr.length === 0),
}));
jest.mock('../utils/file.utils', () => ({
  FileUtils: {
    ensureDir: jest.fn(),
    outputJsonSync: jest.fn(),
    readJsonSync: jest.fn(),
    readFileSync: jest.fn(),
  },
}));

describe('FileService', () => {
  let fileService: FileService;
  let mockLogger: jest.Mocked<Logger>;
  let mockFileUtils: jest.Mocked<typeof FileUtils>;

  beforeEach(() => {
    // Initialize mock references
    mockFileUtils = FileUtils as jest.Mocked<typeof FileUtils>;

    // Get the mock logger instance created by the constructor
    fileService = new FileService();
    mockLogger = (Logger as jest.MockedClass<typeof Logger>).mock.results[0].value;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    // Cleanup to prevent memory leaks
    fileService = undefined as any;
    mockLogger = undefined as any;
    mockFileUtils = undefined as any;
  });

  describe('getFiles', () => {
    it('should call readFiles and return the result', async () => {
      const folderPath = '/test/folder';
      const expectedFiles = ['file1.txt', 'file2.txt'];
      jest.spyOn(fileService as any, 'readFiles').mockResolvedValue(expectedFiles);

      const result = await fileService.getFiles(folderPath);

      expect((fileService as any).readFiles).toHaveBeenCalledWith(folderPath);
      expect(result).toEqual(expectedFiles);
    });
  });

  describe('ensureDirectoryExists', () => {
    it('should ensure directory exists successfully', async () => {
      const dirPath = '/test/dir';
      mockFileUtils.ensureDir.mockResolvedValue(undefined);

      await fileService.ensureDirectoryExists(dirPath);

      expect(mockFileUtils.ensureDir).toHaveBeenCalledWith(dirPath);
      expect(mockFileUtils.ensureDir).toHaveBeenCalledTimes(1);
      expect(mockLogger.debug).toHaveBeenCalledWith(`Ensured directory exists: ${dirPath}`);
    });

    it('should throw FileSystemError on failure', async () => {
      const dirPath = '/test/dir';
      const error = new Error('Permission denied');
      mockFileUtils.ensureDir.mockRejectedValue(error);

      await expect(fileService.ensureDirectoryExists(dirPath)).rejects.toThrow(FileSystemError);
      expect(mockFileUtils.ensureDir).toHaveBeenCalledWith(dirPath);
      expect(mockFileUtils.ensureDir).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith(`Failed to ensure directory exists: ${dirPath}`, error);
    });
  });

  describe('writeJsonFile', () => {
    it('should call saveJson', async () => {
      const filePath = '/test/file.json';
      const data = { key: 'value' };
      jest.spyOn(fileService as any, 'saveJson').mockResolvedValue(undefined);

      await fileService.writeJsonFile(filePath, data);

      expect((fileService as any).saveJson).toHaveBeenCalledWith(filePath, data);
    });
  });

  describe('readFiles', () => {
    it('should return files when found', async () => {
      const folderPath = '/test/folder';
      const files = ['file1.txt', 'file2.txt'];
      jest.spyOn(fileService as any, 'readFilesRecursively').mockResolvedValue(files);

      const result = await (fileService as any).readFiles(folderPath);

      expect((fileService as any).readFilesRecursively).toHaveBeenCalledWith(folderPath);
      expect((fileService as any).readFilesRecursively).toHaveBeenCalledTimes(1);
      expect(result).toEqual(files);
      expect(mockLogger.info).toHaveBeenCalledWith(`Reading files from folder: ${folderPath}`);
      expect(mockLogger.info).toHaveBeenCalledWith(`Found ${files.length} files in ${folderPath}`);
    });

    it('should return empty array when no files found', async () => {
      const folderPath = '/test/folder';
      jest.spyOn(fileService as any, 'readFilesRecursively').mockResolvedValue([]);

      const result = await (fileService as any).readFiles(folderPath);

      expect(result).toEqual([]);
      expect(mockLogger.warn).toHaveBeenCalledWith(`No files found in folder: ${folderPath}`);
    });

    it('should throw FileSystemError on directory not found', async () => {
      const folderPath = '/test/folder';
      const error = new Error('ENOENT: no such file or directory');
      jest.spyOn(fileService as any, 'readFilesRecursively').mockRejectedValue(error);

      await expect((fileService as any).readFiles(folderPath)).rejects.toThrow(FileSystemError);
      expect(mockLogger.error).toHaveBeenCalledWith(`Failed to read files from ${folderPath}`, error);
    });

    it('should throw FileSystemError on access denied', async () => {
      const folderPath = '/test/folder';
      const error = new Error('EACCES: permission denied');
      jest.spyOn(fileService as any, 'readFilesRecursively').mockRejectedValue(error);

      await expect((fileService as any).readFiles(folderPath)).rejects.toThrow(FileSystemError);
    });
  });

  describe('saveJson', () => {
    it('should save JSON successfully', async () => {
      const filePath = '/test/file.json';
      const data = { key: 'value' };
      mockFileUtils.outputJsonSync.mockImplementation(() => undefined);

      await (fileService as any).saveJson(filePath, data);

      expect(mockFileUtils.outputJsonSync).toHaveBeenCalledWith(filePath, data);
      expect(mockFileUtils.outputJsonSync).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(`Saving JSON to: ${filePath}`);
      expect(mockLogger.info).toHaveBeenCalledWith(`Successfully saved JSON to: ${filePath}`);
    });

    it('should throw FileSystemError on failure', async () => {
      const filePath = '/test/file.json';
      const data = { key: 'value' };
      const error = new Error('EACCES: permission denied');
      mockFileUtils.outputJsonSync.mockImplementation(() => {
        throw error;
      });

      await expect((fileService as any).saveJson(filePath, data)).rejects.toThrow(FileSystemError);
      expect(mockFileUtils.outputJsonSync).toHaveBeenCalledWith(filePath, data);
      expect(mockFileUtils.outputJsonSync).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith(`Failed to save JSON to ${filePath}`, error);
    });
  });

  describe('readJson', () => {
    it('should read and return JSON data', async () => {
      const filePath = '/test/file.json';
      const data = { key: 'value' };
      mockFileUtils.readJsonSync.mockReturnValue(data);

      const result = await fileService.readJson(filePath);

      expect(mockFileUtils.readJsonSync).toHaveBeenCalledWith(filePath);
      expect(mockFileUtils.readJsonSync).toHaveBeenCalledTimes(1);
      expect(result).toEqual(data);
      expect(mockLogger.info).toHaveBeenCalledWith(`Reading JSON from: ${filePath}`);
      expect(mockLogger.info).toHaveBeenCalledWith(`Successfully read JSON from: ${filePath}`);
    });

    it('should throw error on failure', async () => {
      const filePath = '/test/file.json';
      const error = new Error('File not found');
      mockFileUtils.readJsonSync.mockImplementation(() => {
        throw error;
      });

      await expect(fileService.readJson(filePath)).rejects.toThrow(error);
      expect(mockFileUtils.readJsonSync).toHaveBeenCalledWith(filePath);
      expect(mockFileUtils.readJsonSync).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith(`Failed to read JSON from ${filePath}`, error);
    });
  });

  describe('readFileSync', () => {
    it('should return file content as Buffer', () => {
      const filePath = '/test/file.txt';
      const buffer = Buffer.from('content');
      mockFileUtils.readFileSync.mockReturnValue(buffer);

      const result = fileService.readFileSync(filePath);

      expect(mockFileUtils.readFileSync).toHaveBeenCalledWith(filePath);
      expect(mockFileUtils.readFileSync).toHaveBeenCalledTimes(1);
      expect(result).toEqual(buffer);
    });

    it('should throw error on failure', () => {
      const filePath = '/test/file.txt';
      const error = new Error('File not found');
      mockFileUtils.readFileSync.mockImplementation(() => {
        throw error;
      });

      expect(() => fileService.readFileSync(filePath)).toThrow(error);
      expect(mockFileUtils.readFileSync).toHaveBeenCalledWith(filePath);
      expect(mockFileUtils.readFileSync).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith(`Failed to read file: ${filePath}`, error);
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', () => {
      const filePath = '/test/file.txt';
      mockFileUtils.readFileSync.mockReturnValue(Buffer.from('content'));

      const result = fileService.fileExists(filePath);

      expect(result).toBe(true);
      expect(mockFileUtils.readFileSync).toHaveBeenCalledWith(filePath);
      expect(mockFileUtils.readFileSync).toHaveBeenCalledTimes(1);
    });

    it('should return false if file does not exist', () => {
      const filePath = '/test/file.txt';
      mockFileUtils.readFileSync.mockImplementation(() => {
        throw new Error('ENOENT');
      });

      const result = fileService.fileExists(filePath);

      expect(result).toBe(false);
      expect(mockFileUtils.readFileSync).toHaveBeenCalledWith(filePath);
      expect(mockFileUtils.readFileSync).toHaveBeenCalledTimes(1);
    });
  });
});
