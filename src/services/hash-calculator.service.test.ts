import Bottleneck from 'bottleneck';
import { HashCalculatorService, HashCalculatorDependencies } from './hash-calculator.service';
import { Logger, FileUtils } from '../utils';

jest.mock('../utils', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  })),
  FileUtils: {
    getFileName: jest.fn(),
  },
}));

describe('HashCalculatorService', () => {
  let rateLimiter: Bottleneck;
  let service: HashCalculatorService;
  let mockLogger: jest.Mocked<Pick<Logger, 'info' | 'error' | 'debug' | 'warn'>>;
  let mockFileUtilsGetFileName: jest.MockedFunction<typeof FileUtils.getFileName>;

  beforeEach(() => {
    rateLimiter = new Bottleneck();
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    } as jest.Mocked<Pick<Logger, 'info' | 'error' | 'debug' | 'warn'>>;
    mockFileUtilsGetFileName = FileUtils.getFileName as jest.MockedFunction<typeof FileUtils.getFileName>;

    // Setup default mock behaviors
    mockFileUtilsGetFileName.mockReturnValue('file.txt');

    const dependencies: HashCalculatorDependencies = {
      logger: mockLogger,
    };

    service = new HashCalculatorService(rateLimiter, dependencies);

    // Mock inherited methods
    jest.spyOn(service as any, 'readFileContent').mockReturnValue(Buffer.from('test content'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    // Cleanup to prevent memory leaks
    service = undefined as any;
    mockLogger = undefined as any;
    rateLimiter = undefined as any;
  });

  describe('constructor', () => {
    it('should use default NodeCryptoHashStrategy when no dependencies provided', () => {
      const serviceWithoutDeps = new HashCalculatorService(rateLimiter);
      expect((serviceWithoutDeps as any).hashStrategy).toBeDefined();
      expect((serviceWithoutDeps as any).hashStrategy.algorithm).toBe('sha256');
      expect((serviceWithoutDeps as any).hashStrategy.encoding).toBe('hex');
    });

    it('should use custom hashStrategy when provided', () => {
      const customStrategy = {
        algorithm: 'md5',
        encoding: 'base64' as const,
        name: 'test-strategy',
        digest: jest.fn(() => 'test-hash'),
      };
      const dependencies: HashCalculatorDependencies = {
        hashStrategy: customStrategy,
        logger: mockLogger,
      };
      const serviceWithDeps = new HashCalculatorService(rateLimiter, dependencies);
      expect((serviceWithDeps as any).hashStrategy).toBe(customStrategy);
    });
  });

  describe('calculateHash', () => {
    it('should calculate hash for a single file', async () => {
      const filePath = '/path/to/file.txt';
      const expectedHash = '6ae8a75555209fd6c44157c0aed8016e763ff435a19cf186f76863140143ff72'; // SHA-256 of 'test content'

      const result = await service.calculateHash(filePath);

      expect((service as any).readFileContent).toHaveBeenCalledWith(filePath);
      expect(result).toBe(expectedHash);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'file.txt hash calculated',
        expect.objectContaining({ hash: expectedHash })
      );
    });

    it('should throw error and log when file reading fails', async () => {
      const filePath = '/path/to/file.txt';
      const error = new Error('File not found');

      jest.spyOn(service as any, 'readFileContent').mockImplementation(() => {
        throw error;
      });

      await expect(service.calculateHash(filePath)).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to calculate hash for file: file.txt', error);
    });
  });

  describe('calculateHashOfHashes', () => {
    it('should calculate hash of concatenated hashes', async () => {
      const hashes = ['hash1', 'hash2'];
      const expectedHash = 'd8eab8000c5826fbf21e6340c96a911c7cf362c054695b73cb1a80ad0dac1cb0'; // SHA-256 of 'hash1hash2'

      const result = await service.calculateHashOfHashes(hashes);

      expect(result).toBe(expectedHash);
      expect(mockLogger.info).toHaveBeenCalledWith('Calculating hash of concatenated hashes', {
        length: 10,
      });
    });
  });
});
