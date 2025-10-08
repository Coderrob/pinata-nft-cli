import { FileService } from './file.service';
import { FileSystemError } from '../errors';
import { Logger } from '../utils';
import { FileUtils } from '../utils/file.utils';

// Mock dependencies
jest.mock('../utils/file.utils');
jest.mock('../utils', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
  isEmptyArray: jest.fn(arr => !arr || arr.length === 0),
}));

describe('FileService', () => {
  let fileService: FileService;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    fileService = new FileService();
    mockLogger = (Logger as jest.Mock).mock.results[0].value;
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
      (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);

      await fileService.ensureDirectoryExists(dirPath);

      expect(fs.ensureDir).toHaveBeenCalledWith(dirPath);
      expect(mockLogger.debug).toHaveBeenCalledWith(`Ensured directory exists: ${dirPath}`);
    });

    it('should throw FileSystemError on failure', async () => {
      const dirPath = '/test/dir';
      const error = new Error('Permission denied');
      (fs.ensureDir as jest.Mock).mockRejectedValue(error);

      await expect(fileService.ensureDirectoryExists(dirPath)).rejects.toThrow(FileSystemError);
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
      (read as jest.Mock).mockResolvedValue({ files });

      const result = await (fileService as any).readFiles(folderPath);

      expect(read).toHaveBeenCalledWith(folderPath);
      expect(result).toEqual(files);
      expect(mockLogger.info).toHaveBeenCalledWith(`Reading files from folder: ${folderPath}`);
      expect(mockLogger.info).toHaveBeenCalledWith(`Found ${files.length} files in ${folderPath}`);
    });

    it('should return empty array when no files found', async () => {
      const folderPath = '/test/folder';
      (read as jest.Mock).mockResolvedValue({ files: [] });

      const result = await (fileService as any).readFiles(folderPath);

      expect(result).toEqual([]);
      expect(mockLogger.warn).toHaveBeenCalledWith(`No files found in folder: ${folderPath}`);
    });

    it('should throw FileSystemError on directory not found', async () => {
      const folderPath = '/test/folder';
      const error = new Error('ENOENT: no such file or directory');
      (read as jest.Mock).mockRejectedValue(error);

      await expect((fileService as any).readFiles(folderPath)).rejects.toThrow(FileSystemError);
      expect(mockLogger.error).toHaveBeenCalledWith(`Failed to read files from ${folderPath}`, error);
    });

    it('should throw FileSystemError on access denied', async () => {
      const folderPath = '/test/folder';
      const error = new Error('EACCES: permission denied');
      (read as jest.Mock).mockRejectedValue(error);

      await expect((fileService as any).readFiles(folderPath)).rejects.toThrow(FileSystemError);
    });
  });

  describe('saveJson', () => {
    it('should save JSON successfully', async () => {
      const filePath = '/test/file.json';
      const data = { key: 'value' };
      (fs.outputJsonSync as jest.Mock).mockImplementation(() => {});

      await (fileService as any).saveJson(filePath, data);

      expect(fs.outputJsonSync).toHaveBeenCalledWith(filePath, data);
      expect(mockLogger.info).toHaveBeenCalledWith(`Saving JSON to: ${filePath}`);
      expect(mockLogger.info).toHaveBeenCalledWith(`Successfully saved JSON to: ${filePath}`);
    });

    it('should throw FileSystemError on failure', async () => {
      const filePath = '/test/file.json';
      const data = { key: 'value' };
      const error = new Error('EACCES: permission denied');
      (fs.outputJsonSync as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect((fileService as any).saveJson(filePath, data)).rejects.toThrow(FileSystemError);
      expect(mockLogger.error).toHaveBeenCalledWith(`Failed to save JSON to ${filePath}`, error);
    });
  });

  describe('readJson', () => {
    it('should read and return JSON data', async () => {
      const filePath = '/test/file.json';
      const data = { key: 'value' };
      (fs.readJsonSync as jest.Mock).mockReturnValue(data);

      const result = await fileService.readJson(filePath);

      expect(fs.readJsonSync).toHaveBeenCalledWith(filePath);
      expect(result).toEqual(data);
      expect(mockLogger.info).toHaveBeenCalledWith(`Reading JSON from: ${filePath}`);
      expect(mockLogger.info).toHaveBeenCalledWith(`Successfully read JSON from: ${filePath}`);
    });

    it('should throw error on failure', async () => {
      const filePath = '/test/file.json';
      const error = new Error('File not found');
      (fs.readJsonSync as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(fileService.readJson(filePath)).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith(`Failed to read JSON from ${filePath}`, error);
    });
  });

  describe('readFileSync', () => {
    it('should return file content as Buffer', () => {
      const filePath = '/test/file.txt';
      const buffer = Buffer.from('content');
      (fs.readFileSync as jest.Mock).mockReturnValue(buffer);

      const result = fileService.readFileSync(filePath);

      expect(fs.readFileSync).toHaveBeenCalledWith(filePath);
      expect(result).toEqual(buffer);
    });

    it('should throw error on failure', () => {
      const filePath = '/test/file.txt';
      const error = new Error('File not found');
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw error;
      });

      expect(() => fileService.readFileSync(filePath)).toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith(`Failed to read file: ${filePath}`, error);
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', () => {
      const filePath = '/test/file.txt';
      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('content'));

      const result = fileService.fileExists(filePath);

      expect(result).toBe(true);
      expect(fs.readFileSync).toHaveBeenCalledWith(filePath);
    });

    it('should return false if file does not exist', () => {
      const filePath = '/test/file.txt';
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('ENOENT');
      });

      const result = fileService.fileExists(filePath);

      expect(result).toBe(false);
    });
  });
});
