import axios from 'axios';
import basePathConverter from 'base-path-converter';
import FormData from 'form-data';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import PinataSdk from '@pinata/sdk';
import { PinataService } from './pinata.service';
import {
  FileMapping,
  IFileCheck,
  IPinataClient,
  IPinataPin,
  IPinListFilter,
  IPinListResponse,
  PinataConfig,
  PinStatus,
} from '../types';

// Mock dependencies
jest.mock('axios');
jest.mock('base-path-converter');
jest.mock('form-data', () =>
  jest.fn().mockImplementation(() => ({
    append: jest.fn(),
    getBoundary: jest.fn().mockReturnValue('boundary'),
  }))
);
jest.mock('fs');
jest.mock('fs/promises');
jest.mock('path');
jest.mock('@pinata/sdk');
jest.mock('../utils');

describe('PinataService', () => {
  let service: PinataService;
  let mockConfig: PinataConfig;
  let mockPinataClient: jest.Mocked<IPinataClient>;
  let mockedAxios: jest.Mocked<typeof axios>;
  let mockedBasePathConverter: jest.MockedFunction<typeof basePathConverter>;
  let mockedFormData: jest.MockedClass<typeof FormData>;
  let mockedFs: jest.Mocked<typeof fs>;
  let mockedFsPromises: jest.Mocked<typeof fsPromises>;
  let mockedPath: jest.Mocked<typeof path>;
  let mockedPinataSdk: jest.MockedClass<typeof PinataSdk>;

  beforeEach(() => {
    // Initialize mock references
    mockedAxios = axios as jest.Mocked<typeof axios>;
    mockedBasePathConverter = basePathConverter as jest.MockedFunction<typeof basePathConverter>;
    mockedFormData = FormData as jest.MockedClass<typeof FormData>;
    mockedFs = fs as jest.Mocked<typeof fs>;
    mockedFsPromises = fsPromises as jest.Mocked<typeof fsPromises>;
    mockedPath = path as jest.Mocked<typeof path>;
    mockedPinataSdk = PinataSdk as jest.MockedClass<typeof PinataSdk>;

    // Setup mock configuration and client
    mockConfig = { apiKey: 'test-key', apiSecret: 'test-secret' };
    mockPinataClient = {
      pinFileToIPFS: jest.fn(),
      pinList: jest.fn(),
    };
    mockedPinataSdk.mockImplementation(() => mockPinataClient as any);

    // Create instance under test
    service = new PinataService(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    // Cleanup to prevent memory leaks
    service = undefined as any;
    mockPinataClient = undefined as any;
  });

  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      const filePath = '/path/to/file.txt';
      const fileName = 'file.txt';
      const mockStream = {};
      const mockResponse = { IpfsHash: 'QmTestHash' };

      mockedFs.createReadStream.mockReturnValue(mockStream as any);
      mockPinataClient.pinFileToIPFS.mockResolvedValue(mockResponse);

      const result = await service.uploadFile(filePath, fileName);

      expect(mockedFs.createReadStream).toHaveBeenCalledWith(filePath);
      expect(mockPinataClient.pinFileToIPFS).toHaveBeenCalledWith(mockStream, {
        pinataMetadata: { name: fileName },
      });
      expect(result).toBe('QmTestHash');
    });

    it('should throw error on upload failure', async () => {
      const filePath = '/path/to/file.txt';
      const fileName = 'file.txt';
      const mockError = new Error('Upload failed');

      mockedFs.createReadStream.mockReturnValue({} as any);
      mockPinataClient.pinFileToIPFS.mockRejectedValue(mockError);

      await expect(service.uploadFile(filePath, fileName)).rejects.toThrow('Upload failed');
    });
  });

  describe('uploadFolder', () => {
    it('should upload a folder successfully', async () => {
      const folderPath = '/path/to/folder';
      const folderName = 'folder';
      const mockFormData = { append: jest.fn(), getBoundary: jest.fn().mockReturnValue('boundary') };
      const mockResponse = { data: { IpfsHash: 'QmFolderHash' } };

      mockedFsPromises.readdir.mockResolvedValue([
        { name: 'file1.txt', isFile: () => true, isDirectory: () => false },
        { name: 'file2.txt', isFile: () => true, isDirectory: () => false },
      ] as any);
      mockedPath.join.mockImplementation((...args) => args.join('/'));
      mockedFormData.mockImplementation(() => mockFormData as any);
      mockedBasePathConverter.mockReturnValue('relative/path');
      mockedFs.createReadStream.mockReturnValue({} as any);
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.uploadFolder(folderPath, folderName);

      expect(result).toBe('QmFolderHash');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        mockFormData,
        expect.objectContaining({
          headers: expect.objectContaining({
            pinata_api_key: 'test-key',
            pinata_secret_api_key: 'test-secret',
          }),
        })
      );
    });

    it('should throw error if no files in folder', async () => {
      const folderPath = '/path/to/empty';
      const folderName = 'empty';

      // Reset axios mock to default (no implementation)
      mockedAxios.post.mockReset();

      // Mock isEmptyArray to return true for empty array
      const utils = jest.requireMock('../utils');
      (utils.isEmptyArray as jest.Mock).mockReturnValue(true);

      mockedFsPromises.readdir.mockResolvedValue([]);

      await expect(service.uploadFolder(folderPath, folderName)).rejects.toThrow(
        'No files found in folder: /path/to/empty'
      );

      // Ensure axios was not called
      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(utils.isEmptyArray).toHaveBeenCalledWith([]);
    });
  });

  describe('listPins', () => {
    it('should list pins successfully', async () => {
      const filter: IPinListFilter = { status: PinStatus.PINNED, pageOffset: 0, pageLimit: 10 };
      const mockResponse: IPinListResponse = {
        count: 1,
        rows: [
          {
            id: '1',
            ipfs_pin_hash: 'QmHash',
            size: 1024,
            user_id: 'user123',
            date_pinned: '2023-01-01T00:00:00Z',
            date_unpinned: null,
            metadata: { name: 'test.txt' },
            regions: [
              {
                regionId: 'FRA1',
                currentReplicationCount: 1,
                desiredReplicationCount: 1,
              },
            ],
          },
        ],
      };

      mockPinataClient.pinList.mockResolvedValue(mockResponse);

      const result = await service.listPins(filter);

      expect(mockPinataClient.pinList).toHaveBeenCalledWith(filter);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on list failure', async () => {
      const filter: IPinListFilter = { status: PinStatus.PINNED };
      const mockError = new Error('List failed');

      mockPinataClient.pinList.mockRejectedValue(mockError);

      await expect(service.listPins(filter)).rejects.toThrow('List failed');
    });
  });

  describe('downloadCIDMappings', () => {
    it('should download CID mappings', async () => {
      const status: PinStatus = PinStatus.PINNED;
      const mockPins: IPinataPin[] = [
        {
          id: '1',
          ipfs_pin_hash: 'QmHash1',
          size: 1024,
          user_id: 'user123',
          date_pinned: '2023-01-01T00:00:00Z',
          date_unpinned: null,
          metadata: { name: 'file1.txt' },
          regions: [
            {
              regionId: 'FRA1',
              currentReplicationCount: 1,
              desiredReplicationCount: 1,
            },
          ],
        },
        {
          id: '2',
          ipfs_pin_hash: 'QmHash2',
          size: 2048,
          user_id: 'user123',
          date_pinned: '2023-01-01T00:00:00Z',
          date_unpinned: null,
          metadata: { name: 'file2.txt' },
          regions: [
            {
              regionId: 'FRA1',
              currentReplicationCount: 1,
              desiredReplicationCount: 1,
            },
          ],
        },
      ];
      const expectedMapping: FileMapping = { 'file1.txt': 'QmHash1', 'file2.txt': 'QmHash2' };

      // Mock collectPins to return pins
      jest.spyOn(service as any, 'collectPins').mockResolvedValue(mockPins);
      jest.spyOn(service as any, 'mapPinsToFileMapping').mockReturnValue(expectedMapping);

      const result = await service.downloadCIDMappings(status);

      expect(result).toEqual(expectedMapping);
    });
  });

  describe('checkFileExists', () => {
    it('should return exists true if file exists', () => {
      const fileName = 'file.txt';
      const existingCIDs: FileMapping = { 'file.txt': 'QmHash' };

      // Mock isTruthy to return true for truthy values
      const utils = jest.requireMock('../utils');
      (utils.isTruthy as jest.Mock).mockReturnValue(true);

      const result: IFileCheck = service.checkFileExists(fileName, existingCIDs);

      expect(result).toEqual({ exists: true, ipfsHash: 'QmHash' });
      expect(utils.isTruthy).toHaveBeenCalledWith('QmHash');
    });

    it('should return exists false if file does not exist', () => {
      const fileName = 'missing.txt';
      const existingCIDs: FileMapping = { 'file.txt': 'QmHash' };

      // Mock isTruthy to return false for undefined
      const utils = jest.requireMock('../utils');
      (utils.isTruthy as jest.Mock).mockReturnValue(false);

      const result: IFileCheck = service.checkFileExists(fileName, existingCIDs);

      expect(result).toEqual({ exists: false, ipfsHash: undefined });
      expect(utils.isTruthy).toHaveBeenCalledWith(undefined);
    });
  });
});
