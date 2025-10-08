import axios from 'axios';
import * as os from 'os';
import { HealthStatus } from '../types';
import { HealthMonitor } from './health.monitor';
import { MetricsCollector } from './metrics.collector';
import { FileUtils } from '../utils/file.utils';

// Mock dependencies
jest.mock('axios');
jest.mock('os');
jest.mock('./metrics.collector');
jest.mock('./structured.logger');
jest.mock('../utils/file.utils');

describe('HealthMonitor', () => {
  let healthMonitor: HealthMonitor;
  let mockAxiosGet: jest.MockedFunction<typeof axios.get>;
  let mockFileUtilsAccess: jest.MockedFunction<typeof FileUtils.access>;
  let mockFileUtilsEnsureDir: jest.MockedFunction<typeof FileUtils.ensureDir>;
  let mockFileUtilsWriteFile: jest.MockedFunction<typeof FileUtils.writeFile>;
  let mockFileUtilsRemove: jest.MockedFunction<typeof FileUtils.remove>;
  let mockOsTotalmem: jest.MockedFunction<typeof os.totalmem>;
  let mockOsFreemem: jest.MockedFunction<typeof os.freemem>;
  let mockOsLoadavg: jest.MockedFunction<typeof os.loadavg>;
  let mockOsCpus: jest.MockedFunction<typeof os.cpus>;
  let mockOsUptime: jest.MockedFunction<typeof os.uptime>;
  let mockRecordHealthCheck: jest.MockedFunction<() => void>;

  beforeEach(() => {
    // Initialize mock references
    mockAxiosGet = axios.get as jest.MockedFunction<typeof axios.get>;
    mockFileUtilsAccess = FileUtils.access as jest.MockedFunction<typeof FileUtils.access>;
    mockFileUtilsEnsureDir = FileUtils.ensureDir as jest.MockedFunction<typeof FileUtils.ensureDir>;
    mockFileUtilsWriteFile = FileUtils.writeFile as jest.MockedFunction<typeof FileUtils.writeFile>;
    mockFileUtilsRemove = FileUtils.remove as jest.MockedFunction<typeof FileUtils.remove>;
    mockOsTotalmem = os.totalmem as jest.MockedFunction<typeof os.totalmem>;
    mockOsFreemem = os.freemem as jest.MockedFunction<typeof os.freemem>;
    mockOsLoadavg = os.loadavg as jest.MockedFunction<typeof os.loadavg>;
    mockOsCpus = os.cpus as jest.MockedFunction<typeof os.cpus>;
    mockOsUptime = os.uptime as jest.MockedFunction<typeof os.uptime>;

    // Setup MetricsCollector mock
    mockRecordHealthCheck = jest.fn();
    (MetricsCollector.getInstance as jest.Mock).mockReturnValue({
      recordHealthCheck: mockRecordHealthCheck,
    });

    // Setup default successful mocks for FileUtils
    mockFileUtilsAccess.mockResolvedValue(undefined);
    mockFileUtilsEnsureDir.mockResolvedValue(undefined);
    mockFileUtilsWriteFile.mockResolvedValue(undefined);
    mockFileUtilsRemove.mockResolvedValue(undefined);

    // Setup default successful mocks for OS
    mockOsTotalmem.mockReturnValue(1000000000);
    mockOsFreemem.mockReturnValue(900000000);
    mockOsLoadavg.mockReturnValue([1, 1, 1]);
    mockOsCpus.mockReturnValue([
      { model: 'CPU1', speed: 2000, times: { user: 100, nice: 0, sys: 50, idle: 200, irq: 0 } },
      { model: 'CPU2', speed: 2000, times: { user: 100, nice: 0, sys: 50, idle: 200, irq: 0 } },
    ]);
    mockOsUptime.mockReturnValue(3600);

    // Create fresh instance
    healthMonitor = new HealthMonitor();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('checkPinataHealth', () => {
    it('should return healthy status on successful API call', async () => {
      const mockResponse = {
        status: 200,
        data: { message: 'Congratulations! You are communicating with the Pinata API!' },
      };
      mockAxiosGet.mockResolvedValue(mockResponse);

      const result = await healthMonitor.checkPinataHealth('apiKey', 'apiSecret');

      expect(result.service).toBe('pinata-api');
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.details?.authenticated).toBe(true);
      expect(mockRecordHealthCheck).toHaveBeenCalledWith(result);
    });

    it('should return degraded status on non-200 response', async () => {
      const mockResponse = { status: 500 };
      mockAxiosGet.mockResolvedValue(mockResponse);

      const result = await healthMonitor.checkPinataHealth('apiKey', 'apiSecret');

      expect(result.status).toBe(HealthStatus.DEGRADED);
      expect(mockRecordHealthCheck).toHaveBeenCalledWith(result);
    });

    it('should return unhealthy status on error', async () => {
      const error = new Error('Network error');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).code = 'ECONNREFUSED';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).response = { status: 500 };
      mockAxiosGet.mockRejectedValue(error);

      const result = await healthMonitor.checkPinataHealth('apiKey', 'apiSecret');

      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.error).toBe('Network error');
      expect(result.details?.errorCode).toBe('ECONNREFUSED');
      expect(mockRecordHealthCheck).toHaveBeenCalledWith(result);
    });
  });

  describe('checkSystemHealth', () => {
    it('should return healthy status when system is fine', async () => {
      const result = await healthMonitor.checkSystemHealth();

      expect(result.service).toBe('system-resources');
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.details?.memoryUsagePercent).toBe(10);
      expect(mockRecordHealthCheck).toHaveBeenCalledWith(result);
    });

    it('should return degraded status on high memory or load', async () => {
      mockOsFreemem.mockReturnValue(50000000);
      mockOsLoadavg.mockReturnValue([5, 1, 1]);

      const result = await healthMonitor.checkSystemHealth();

      expect(result.status).toBe(HealthStatus.DEGRADED);
    });

    it('should return unhealthy status on very high memory or no disk access', async () => {
      mockOsFreemem.mockReturnValue(10000000);
      mockFileUtilsAccess.mockRejectedValue(new Error('Access denied'));

      const result = await healthMonitor.checkSystemHealth();

      expect(result.status).toBe(HealthStatus.UNHEALTHY);
    });

    it('should handle errors gracefully', async () => {
      mockOsTotalmem.mockImplementation(() => {
        throw new Error('OS error');
      });

      const result = await healthMonitor.checkSystemHealth();

      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.error).toBe('OS error');
    });
  });

  describe('checkFileSystemHealth', () => {
    it('should return healthy status on successful file operations', async () => {
      const result = await healthMonitor.checkFileSystemHealth('./test');

      expect(result.service).toBe('file-system');
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.details?.writable).toBe(true);
      expect(mockRecordHealthCheck).toHaveBeenCalledWith(result);
    });

    it('should return unhealthy status on file operation failure', async () => {
      mockFileUtilsEnsureDir.mockRejectedValue(new Error('Permission denied'));

      const result = await healthMonitor.checkFileSystemHealth('./test');

      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.error).toBe('Permission denied');
      expect(result.details?.writable).toBe(false);
    });
  });

  describe('runHealthCheck', () => {
    it('should run all checks and return overall healthy', async () => {
      const result = await healthMonitor.runHealthCheck();

      expect(result.overall).toBe(HealthStatus.HEALTHY);
      expect(result.checks).toHaveLength(2);
      expect(result.checks[0].service).toBe('system-resources');
      expect(result.checks[1].service).toBe('file-system');
    });

    it('should include Pinata check when config provided', async () => {
      const mockResponse = {
        status: 200,
        data: { message: 'Congratulations! You are communicating with the Pinata API!' },
      };
      mockAxiosGet.mockResolvedValue(mockResponse);

      const result = await healthMonitor.runHealthCheck({
        pinataApiKey: 'key',
        pinataApiSecret: 'secret',
      });

      expect(result.checks).toHaveLength(3);
      expect(result.checks[2].service).toBe('pinata-api');
    });

    it('should return degraded overall if any check is degraded', async () => {
      mockOsFreemem.mockReturnValue(50000000); // High memory usage

      const result = await healthMonitor.runHealthCheck();

      expect(result.overall).toBe(HealthStatus.DEGRADED);
    });

    it('should return unhealthy overall if any check is unhealthy', async () => {
      mockFileUtilsEnsureDir.mockRejectedValue(new Error('Error'));

      const result = await healthMonitor.runHealthCheck();

      expect(result.overall).toBe(HealthStatus.UNHEALTHY);
    });

    it('should return unhealthy overall if Pinata check fails', async () => {
      const error = new Error('Network error');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).code = 'ECONNREFUSED';
      mockAxiosGet.mockRejectedValue(error);

      const result = await healthMonitor.runHealthCheck({
        pinataApiKey: 'key',
        pinataApiSecret: 'secret',
      });

      expect(result.overall).toBe(HealthStatus.UNHEALTHY);
      expect(result.checks).toHaveLength(3);
      expect(result.checks[2].status).toBe(HealthStatus.UNHEALTHY);
    });

    it('should return degraded overall if Pinata check is degraded', async () => {
      const mockResponse = { status: 500 };
      mockAxiosGet.mockResolvedValue(mockResponse);

      const result = await healthMonitor.runHealthCheck({
        pinataApiKey: 'key',
        pinataApiSecret: 'secret',
      });

      expect(result.overall).toBe(HealthStatus.DEGRADED);
      expect(result.checks).toHaveLength(3);
      expect(result.checks[2].status).toBe(HealthStatus.DEGRADED);
    });

    it('should not include Pinata check if only one credential is provided', async () => {
      const result = await healthMonitor.runHealthCheck({
        pinataApiKey: 'key',
      });

      expect(result.checks).toHaveLength(2);
      expect(result.checks.some(c => c.service === 'pinata-api')).toBe(false);
    });

    it('should handle custom testPath in file system check', async () => {
      const result = await healthMonitor.runHealthCheck({
        testPath: './custom',
      });

      expect(result.checks[1].details?.testPath).toBe('./custom');
    });
  });
});
