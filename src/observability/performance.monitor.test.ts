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

import { monitorFunction, trackBatchOperation } from './performance.monitor';

// Mock dependencies
jest.mock('../observability', () => ({
  StructuredLogger: jest.fn().mockImplementation(() => ({
    startOperation: jest.fn().mockReturnValue({
      complete: jest.fn(),
      getOperationName: jest.fn().mockReturnValue('test-operation'),
    }),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    trace: jest.fn(),
    metrics: jest.fn(),
  })),
  MetricsCollector: {
    getInstance: jest.fn().mockReturnValue({
      recordMetrics: jest.fn(),
    }),
  },
}));

describe('Performance Monitoring Utilities', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('monitorFunction', () => {
    it('should monitor a successful function', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await monitorFunction('testOp', fn, {
        key: 'value',
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalled();
    });

    it('should monitor a synchronous function', async () => {
      const fn = jest.fn().mockReturnValue(42);
      const result = await monitorFunction('syncOp', fn);

      expect(result).toBe(42);
      expect(fn).toHaveBeenCalled();
    });

    it('should handle function errors', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Function error'));
      await expect(monitorFunction('errorOp', fn)).rejects.toThrow('Function error');

      expect(fn).toHaveBeenCalled();
    });
  });

  describe('trackBatchOperation', () => {
    it('should track successful batch operations', () => {
      const onProgress = jest.fn();
      const tracker = trackBatchOperation('batchOp', 3, onProgress);

      tracker.recordSuccess();
      tracker.recordSuccess();
      tracker.recordSuccess();

      const metrics = tracker.complete();

      expect(metrics.operation).toBe('batchOp');
      expect(metrics.success).toBe(true);
      expect(metrics.itemsProcessed).toBe(3);
      expect(metrics.errorCount).toBe(0);
      expect(onProgress).toHaveBeenCalledTimes(3);
      // Note: metricsCollector.recordMetrics is called internally but we don't test it
    });

    it('should track batch operations with errors', () => {
      const tracker = trackBatchOperation('batchOp', 2);

      tracker.recordSuccess();
      tracker.recordError(new Error('Item failed'));

      const metrics = tracker.complete();

      expect(metrics.success).toBe(false);
      expect(metrics.errorCount).toBe(1);
    });

    it('should handle zero total items', () => {
      const tracker = trackBatchOperation('emptyBatch', 0);
      const metrics = tracker.complete();

      expect(metrics.success).toBe(true);
      expect(metrics.successRate).toBe(100);
    });
  });

  describe('decorators', () => {
    it('should export decorator functions', () => {
      // Just check that the functions are exported
      expect(typeof monitorFunction).toBe('function');
      expect(typeof trackBatchOperation).toBe('function');
    });
  });
});
