/* eslint-disable dot-notation */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Bottleneck from 'bottleneck';
import { CIDCalculatorService } from './cid-calculator.service';
import { CIDCalculatorDependencies, IFileDigestStrategy } from '../types';
import { ILogger } from '../types/commands';

describe('CIDCalculatorService', () => {
  let rateLimiter: Bottleneck;
  let mockCidStrategy: IFileDigestStrategy<string>;
  let service: CIDCalculatorService;

  beforeEach(() => {
    rateLimiter = new Bottleneck();
    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      startOperation: jest.fn(),
      getStructuredLogger: jest.fn(),
    } as unknown as jest.Mocked<ILogger>;
    mockCidStrategy = {
      name: 'mock',
      algorithm: 'mock',
      digest: jest.fn().mockResolvedValue('mock-cid'),
    };
    const dependencies: CIDCalculatorDependencies = {
      cidStrategy: mockCidStrategy,
      logger: mockLogger,
    };
    service = new CIDCalculatorService(rateLimiter, dependencies);
    // Mock inherited methods
    jest.spyOn(service as any, 'processFiles').mockResolvedValue({ 'test.txt': 'mock-cid' });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    // Cleanup to prevent memory leaks
    rateLimiter = undefined as any;
    service = undefined as any;
  });

  describe('constructor', () => {
    it('should initialize with provided dependencies', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with default dependencies when not provided', () => {
      const defaultService = new CIDCalculatorService(rateLimiter);
      expect(defaultService).toBeDefined();
    });
  });

  describe('calculateCID', () => {
    it('should calculate CID successfully', async () => {
      // Mock the readFileContent method
      jest.spyOn(service as any, 'readFileContent').mockReturnValue(Buffer.from('test content'));

      const result = await service.calculateCID('/path/to/test.txt');
      expect((service as any).readFileContent).toHaveBeenCalledWith('/path/to/test.txt');
      expect(mockCidStrategy.digest).toHaveBeenCalledWith(Buffer.from('test content'));
      expect((service as any).logger.info).toHaveBeenCalledWith('test.txt CID calculated', {
        CID: 'mock-cid',
        algorithm: 'mock',
      });
      expect(result).toBe('mock-cid');
    });

    it('should throw error and log on failure', async () => {
      const error = new Error('Read failed');
      jest.spyOn(service as any, 'readFileContent').mockImplementation(() => {
        throw error;
      });
      await expect(service.calculateCID('/path/to/test.txt')).rejects.toThrow('Read failed');
      expect((service as any).logger.error).toHaveBeenCalledWith('Failed to calculate CID for file: test.txt', error);
    });
  });

  describe('calculateCIDs', () => {
    it('should call processFiles with files', async () => {
      const files = ['/path/to/file1.txt', '/path/to/file2.txt'];
      const result = await service.calculateCIDs(files);
      expect((service as any).processFiles).toHaveBeenCalledWith(files);
      expect(result).toEqual({ 'test.txt': 'mock-cid' });
    });
  });

  describe('protected methods', () => {
    it('getOperationToken should return correct token', () => {
      expect((service as any)['getOperationToken']()).toBe('CID calculation');
    });

    it('computeResult should compute CID', async () => {
      const result = await (service as any)['computeResult']('/path', 'file.txt', Buffer.from('content'));
      expect(mockCidStrategy.digest).toHaveBeenCalledWith(Buffer.from('content'));
      expect((service as any).logger.debug).toHaveBeenCalledWith('file.txt CID computed', { cid: 'mock-cid' });
      expect(result).toBe('mock-cid');
    });

    it('onAfterProcessing should log CID info', () => {
      (service as any).onAfterProcessing('file.txt', 'final-cid');
      expect((service as any).logger.info).toHaveBeenCalledWith('file.txt CID', {
        cid: 'final-cid',
        algorithm: 'mock',
      });
    });
  });
});
