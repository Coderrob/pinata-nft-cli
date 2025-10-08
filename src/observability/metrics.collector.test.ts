import { MetricsCollector } from './metrics.collector';
import { HealthCheckResult, HealthStatus, PerformanceMetrics } from '../types';

// Mock StructuredLogger
jest.mock('./structured.logger', () => ({
  StructuredLogger: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  })),
}));

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    // Reset singleton instance for each test
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (MetricsCollector as any).instance = null;
    collector = MetricsCollector.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    // Reset singleton instance to prevent memory leaks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (MetricsCollector as any).instance = null;
    collector = undefined as any;
  });

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = MetricsCollector.getInstance();
      const instance2 = MetricsCollector.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('recordMetrics', () => {
    it('should record metrics for a new operation', () => {
      const metrics: PerformanceMetrics = {
        operation: 'testOp',
        success: true,
        duration: 100,
        timestamp: new Date().toISOString(),
      };
      collector.recordMetrics(metrics);
      const result = collector.getOperationMetrics('testOp');
      expect(result).toEqual({
        totalCalls: 1,
        successRate: 100,
        averageDuration: 100,
        errorCount: 0,
        lastUpdated: metrics.timestamp,
      });
    });

    it('should limit metrics to 100 per operation', () => {
      const operation = 'testOp';
      for (let i = 0; i < 101; i += 1) {
        collector.recordMetrics({
          operation,
          success: true,
          duration: 100,
          timestamp: new Date().toISOString(),
        });
      }
      const result = collector.getOperationMetrics(operation);
      expect(result?.totalCalls).toBe(100);
    });
  });

  describe('recordHealthCheck', () => {
    it('should record health check result', () => {
      const result: HealthCheckResult = {
        service: 'testService',
        status: HealthStatus.HEALTHY,
        responseTime: 50,
        timestamp: '2023-01-01T00:00:00.000Z',
      };
      collector.recordHealthCheck(result);
      const healthStatus = collector.getHealthStatus();
      expect(healthStatus.testService).toEqual(result);
    });
  });

  describe('getOperationMetrics', () => {
    it('should return null for non-existent operation', () => {
      expect(collector.getOperationMetrics('nonExistent')).toBeNull();
    });

    it('should calculate metrics correctly', () => {
      const operation = 'testOp';
      collector.recordMetrics({ operation, success: true, duration: 100, timestamp: '2023-01-01T00:00:00Z' });
      collector.recordMetrics({ operation, success: false, duration: 200, timestamp: '2023-01-01T00:01:00Z' });
      const result = collector.getOperationMetrics(operation);
      expect(result).toEqual({
        totalCalls: 2,
        successRate: 50,
        averageDuration: 150,
        errorCount: 1,
        lastUpdated: '2023-01-01T00:01:00Z',
      });
    });
  });

  describe('getOperationNames', () => {
    it('should return all operation names', () => {
      collector.recordMetrics({ operation: 'op1', success: true, duration: 100, timestamp: '2023-01-01T00:00:00Z' });
      collector.recordMetrics({ operation: 'op2', success: true, duration: 100, timestamp: '2023-01-01T00:00:00Z' });
      expect(collector.getOperationNames()).toEqual(['op1', 'op2']);
    });
  });

  describe('getHealthStatus', () => {
    it('should return all health checks', () => {
      const result1: HealthCheckResult = {
        service: 's1',
        status: HealthStatus.HEALTHY,
        responseTime: 10,
        timestamp: '2023-01-01T00:00:00.000Z',
      };
      const result2: HealthCheckResult = {
        service: 's2',
        status: HealthStatus.UNHEALTHY,
        responseTime: 20,
        timestamp: '2023-01-01T00:00:00.000Z',
      };
      collector.recordHealthCheck(result1);
      collector.recordHealthCheck(result2);
      expect(collector.getHealthStatus()).toEqual({ s1: result1, s2: result2 });
    });
  });

  describe('getOverallHealth', () => {
    it('should return HEALTHY if no health checks', () => {
      expect(collector.getOverallHealth()).toBe(HealthStatus.HEALTHY);
    });

    it('should return UNHEALTHY if any unhealthy', () => {
      collector.recordHealthCheck({
        service: 's1',
        status: HealthStatus.UNHEALTHY,
        responseTime: 10,
        timestamp: '2023-01-01T00:00:00.000Z',
      });
      collector.recordHealthCheck({
        service: 's2',
        status: HealthStatus.HEALTHY,
        responseTime: 10,
        timestamp: '2023-01-01T00:00:00.000Z',
      });
      expect(collector.getOverallHealth()).toBe(HealthStatus.UNHEALTHY);
    });

    it('should return DEGRADED if any degraded and no unhealthy', () => {
      collector.recordHealthCheck({
        service: 's1',
        status: HealthStatus.DEGRADED,
        responseTime: 10,
        timestamp: '2023-01-01T00:00:00.000Z',
      });
      collector.recordHealthCheck({
        service: 's2',
        status: HealthStatus.HEALTHY,
        responseTime: 10,
        timestamp: '2023-01-01T00:00:00.000Z',
      });
      expect(collector.getOverallHealth()).toBe(HealthStatus.DEGRADED);
    });

    it('should return HEALTHY if all healthy', () => {
      collector.recordHealthCheck({
        service: 's1',
        status: HealthStatus.HEALTHY,
        responseTime: 10,
        timestamp: '2023-01-01T00:00:00.000Z',
      });
      expect(collector.getOverallHealth()).toBe(HealthStatus.HEALTHY);
    });
  });

  describe('generateMetricsReport', () => {
    it('should generate a complete report', () => {
      collector.recordMetrics({
        operation: 'op1',
        success: true,
        duration: 100,
        timestamp: '2023-01-01T00:00:00Z',
      });
      collector.recordHealthCheck({
        service: 's1',
        status: HealthStatus.HEALTHY,
        responseTime: 10,
        timestamp: '2023-01-01T00:00:00.000Z',
      });
      const report = collector.generateMetricsReport();
      expect(report).toHaveProperty('timestamp');
      expect(report.overallHealth).toBe(HealthStatus.HEALTHY);
      expect(report.operations).toHaveLength(1);
      expect(report.healthChecks).toEqual({
        s1: {
          service: 's1',
          status: HealthStatus.HEALTHY,
          responseTime: 10,
          timestamp: '2023-01-01T00:00:00.000Z',
        },
      });
    });
  });

  describe('clearOldMetrics', () => {
    it('should clear metrics older than specified hours', () => {
      const now = Date.now();
      collector.recordMetrics({
        operation: 'op1',
        success: true,
        duration: 100,
        timestamp: new Date(now - 25 * 60 * 60 * 1000).toISOString(),
      });
      collector.recordMetrics({
        operation: 'op1',
        success: true,
        duration: 100,
        timestamp: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
      });
      collector.clearOldMetrics(24);
      const result = collector.getOperationMetrics('op1');
      expect(result?.totalCalls).toBe(1);
    });
  });
});
