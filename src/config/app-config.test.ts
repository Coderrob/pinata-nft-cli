import { AppConfig } from './app-config';

type MockedManager = {
  loadFromEnvironment: jest.Mock;
  validateRequired: jest.Mock;
  getRequiredString: jest.Mock;
  getString: jest.Mock;
  getBoolean: jest.Mock;
  getNumber: jest.Mock;
};

jest.mock('./configuration-manager', () => {
  const instance: MockedManager = {
    loadFromEnvironment: jest.fn(),
    validateRequired: jest.fn(),
    getRequiredString: jest.fn(),
    getString: jest.fn(),
    getBoolean: jest.fn(),
    getNumber: jest.fn(),
  };

  return {
    ConfigurationManager: {
      getInstance: jest.fn(() => instance),
    },
    __mockInstance: instance,
    __esModule: true,
  };
});

const configurationModule = jest.requireMock('./configuration-manager') as {
  ConfigurationManager: { getInstance: jest.Mock<MockedManager> };
  __mockInstance: MockedManager;
};

// eslint-disable-next-line no-underscore-dangle
const mockInstance = configurationModule.__mockInstance;
const getInstanceMock = configurationModule.ConfigurationManager.getInstance;

describe('AppConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(mockInstance).forEach(mock => mock.mockReset());
    getInstanceMock.mockReturnValue(mockInstance);
  });

  const get = <K extends keyof MockedManager>(key: K) => mockInstance[key];

  describe('initialize', () => {
    it('loads configuration from environment', () => {
      AppConfig.initialize();
      expect(get('loadFromEnvironment')).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPinataConfig', () => {
    it('validates required keys and returns config', () => {
      get('getRequiredString').mockReturnValueOnce('key').mockReturnValueOnce('secret');

      expect(AppConfig.getPinataConfig()).toStrictEqual({ apiKey: 'key', apiSecret: 'secret' });
      expect(get('validateRequired')).toHaveBeenCalledWith(['PINATA_API_KEY', 'PINATA_API_SECRET']);
    });
  });

  describe('getLoggingConfig', () => {
    it('reads logging configuration with defaults', () => {
      get('getString').mockReturnValueOnce('debug').mockReturnValueOnce('/tmp/log.txt');
      get('getBoolean').mockReturnValueOnce(true).mockReturnValueOnce(false);

      expect(AppConfig.getLoggingConfig()).toStrictEqual({
        level: 'debug',
        enableConsole: true,
        enableFile: false,
        filePath: '/tmp/log.txt',
      });
    });
  });

  describe('getRateLimitConfig', () => {
    it('returns rate limit values', () => {
      get('getNumber').mockReturnValueOnce(10).mockReturnValueOnce(50).mockReturnValueOnce(2).mockReturnValueOnce(1000);

      expect(AppConfig.getRateLimitConfig()).toStrictEqual({
        maxConcurrent: 10,
        minTime: 50,
        uploadConcurrent: 2,
        uploadMinTime: 1000,
      });
    });
  });

  describe('getFileProcessingConfig', () => {
    it('returns file processing configuration with parsed extensions', () => {
      get('getString')
        .mockReturnValueOnce('input') // defaultInputFolder
        .mockReturnValueOnce('metadata') // defaultMetadataFolder
        .mockReturnValueOnce('output') // defaultOutputFolder
        .mockReturnValueOnce('.jpg,.png'); // supportedExtensions
      get('getNumber').mockReturnValueOnce(200);

      expect(AppConfig.getFileProcessingConfig()).toStrictEqual({
        defaultInputFolder: 'input',
        defaultMetadataFolder: 'metadata',
        defaultOutputFolder: 'output',
        maxFileSize: 200,
        supportedExtensions: ['.jpg', '.png'],
      });
    });
  });

  describe('getHealthCheckConfig', () => {
    it('returns health check configuration', () => {
      get('getBoolean').mockReturnValueOnce(true);
      get('getNumber').mockReturnValueOnce(1000).mockReturnValueOnce(500);

      expect(AppConfig.getHealthCheckConfig()).toStrictEqual({
        enabled: true,
        interval: 1000,
        timeout: 500,
      });
    });
  });

  describe('getPerformanceConfig', () => {
    it('returns performance configuration', () => {
      get('getBoolean').mockReturnValueOnce(false);
      get('getNumber').mockReturnValueOnce(12).mockReturnValueOnce(256);

      expect(AppConfig.getPerformanceConfig()).toStrictEqual({
        enableMetrics: false,
        metricsRetentionHours: 12,
        memoryThresholdMB: 256,
      });
    });
  });

  describe('getRetryConfig', () => {
    it('returns retry configuration', () => {
      get('getNumber').mockReturnValueOnce(5).mockReturnValueOnce(100).mockReturnValueOnce(1000);
      get('getBoolean').mockReturnValueOnce(true);

      expect(AppConfig.getRetryConfig()).toStrictEqual({
        maxRetries: 5,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        exponentialBackoff: true,
      });
    });
  });

  describe('validate', () => {
    it('validates required keys', () => {
      AppConfig.validate();
      expect(get('validateRequired')).toHaveBeenCalledWith(['PINATA_API_KEY', 'PINATA_API_SECRET']);
    });
  });
});
