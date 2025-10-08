import Bottleneck from 'bottleneck';
import { RateLimitedFileMappingService } from './rate-limited-file-mapping.service';
import { RateLimitedFileMappingDependencies, FileReader } from '../types/services';
import { Logger } from '../utils/logger';

// Mock Bottleneck
jest.mock('bottleneck');
const MockBottleneck = Bottleneck as jest.MockedClass<typeof Bottleneck>;

// Mock FileReader
const mockFileReader: jest.Mocked<FileReader> = {
  readFileSync: jest.fn(),
};

// Mock Logger class
jest.mock('../utils/logger');
const MockLogger = Logger as jest.MockedClass<typeof Logger>;

const mockLoggerInstance = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  startOperation: jest.fn(),
  getStructuredLogger: jest.fn(),
} as unknown as jest.Mocked<Logger>;

MockLogger.mockImplementation(() => mockLoggerInstance);

// Concrete implementation for testing
class TestRateLimitedFileMappingService extends RateLimitedFileMappingService<string, Record<string, string>> {
  constructor(rateLimiter: Bottleneck, serviceName: string, dependencies?: RateLimitedFileMappingDependencies) {
    super(rateLimiter, serviceName, dependencies);
  }

  protected getOperationToken(): string {
    return 'test-operation';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected computeResult(_filePath: string, fileName: string, _fileContent: Buffer): string {
    return `result-${fileName}`;
  }
}

describe('RateLimitedFileMappingService', () => {
  let service: TestRateLimitedFileMappingService;
  let mockRateLimiter: jest.Mocked<Bottleneck>;

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    mockRateLimiter = new MockBottleneck() as jest.Mocked<Bottleneck>;
    mockRateLimiter.schedule = jest.fn().mockImplementation(fn => fn());

    service = new TestRateLimitedFileMappingService(mockRateLimiter, 'TestService', {
      fileReader: mockFileReader,
      logger: mockLoggerInstance,
    });
  });

  describe('processFiles', () => {
    it('should process files successfully and return sorted mapping', async () => {
      const files = ['/path/to/file1.txt', '/path/to/file2.txt'];
      mockFileReader.readFileSync
        .mockReturnValueOnce(Buffer.from('content1'))
        .mockReturnValueOnce(Buffer.from('content2'));

      const result = await service.processFiles(files);

      expect(mockRateLimiter.schedule).toHaveBeenCalledTimes(2);
      expect(mockFileReader.readFileSync).toHaveBeenCalledWith('/path/to/file1.txt');
      expect(mockFileReader.readFileSync).toHaveBeenCalledWith('/path/to/file2.txt');
      expect(mockLoggerInstance.info).toHaveBeenCalledWith('file1.txt test-operation started');
      expect(mockLoggerInstance.info).toHaveBeenCalledWith('file1.txt test-operation completed', {
        result: 'result-file1.txt',
      });
      expect(mockLoggerInstance.info).toHaveBeenCalledWith('file2.txt test-operation started');
      expect(mockLoggerInstance.info).toHaveBeenCalledWith('file2.txt test-operation completed', {
        result: 'result-file2.txt',
      });
      expect(result).toEqual({
        'file1.txt': 'result-file1.txt',
        'file2.txt': 'result-file2.txt',
      });
    });

    it('should handle errors during processing and rethrow', async () => {
      const files = ['/path/to/file1.txt'];
      mockFileReader.readFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });

      await expect(service.processFiles(files)).rejects.toThrow('Read error');
      expect(mockLoggerInstance.error).toHaveBeenCalledWith(
        'Failed to process test-operation for file: file1.txt',
        expect.any(Error)
      );
    });

    it('should call transformMapping with sorted mapping', async () => {
      const files = ['/path/to/z.txt', '/path/to/a.txt'];
      mockFileReader.readFileSync
        .mockReturnValueOnce(Buffer.from('contentZ'))
        .mockReturnValueOnce(Buffer.from('contentA'));

      const result = await service.processFiles(files);

      // Assuming ObjectUtils.sortObjectByKeys sorts by keys
      expect(result).toEqual({
        'a.txt': 'result-a.txt',
        'z.txt': 'result-z.txt',
      });
    });
  });
});
