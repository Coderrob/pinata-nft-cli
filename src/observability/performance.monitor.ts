/* eslint-disable @typescript-eslint/no-explicit-any */
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

import { MetricsCollector } from './metrics.collector';
import { StructuredLogger } from './structured.logger';
import { LogLevel } from '../types/observability';

/**
 * Performance monitoring decorators for functions and methods.
 * These decorators provide timing, memory monitoring, and batch operation tracking.
 */

const logger = new StructuredLogger('PerformanceMonitor');
const metricsCollector = MetricsCollector.getInstance();

/* eslint-disable complexity */
/**
 * Extracts batch metrics from a result object
 */
function extractBatchMetrics(result: any) {
  const resultsLen = result.results?.length ?? 0;
  const errorsLen = result.errors?.length ?? 0;
  const total = result.totalItems || resultsLen + errorsLen || 0;
  const processed = result.processedCount || resultsLen || 0;
  const errors = result.errorCount || errorsLen || 0;

  return {
    totalItems: total,
    processedCount: processed,
    errorCount: errors,
    successCount: processed - errors,
    successRate: calculateSuccessRate(total, processed - errors),
  };
}
/* eslint-enable complexity */

/**
 * Calculates success rate for batch operations
 */
function calculateSuccessRate(totalItems: number, successCount: number): number {
  if (totalItems === 0) return 100;
  const rate = (successCount / totalItems) * 100;
  return Math.round(rate * 100) / 100;
}

/**
 * Executes a function with timer tracking, completing the timer on success or failure.
 * @param timer - The operation timer to track
 * @param fn - The function to execute
 * @returns The result of the function
 */
async function executeWithTimer<T>(
  timer: ReturnType<StructuredLogger['startOperation']>,
  fn: () => Promise<T> | T
): Promise<T> {
  try {
    const result = await fn();
    timer.complete(true);
    return result;
  } catch (error) {
    timer.complete(false, { error: (error as Error).message });
    throw error;
  }
}

/**
 * Logs batch completion metrics with appropriate log level based on error count.
 * @param operation - Name of the operation
 * @param duration - Duration in milliseconds
 * @param totalItems - Total items to process
 * @param processedCount - Number of items processed
 * @param errorCount - Number of errors encountered
 */
function logBatchCompletion(
  operation: string,
  duration: number,
  totalItems: number,
  processedCount: number,
  errorCount: number
): void {
  const successCount = processedCount - errorCount;
  const successRate = totalItems > 0 ? (successCount / totalItems) * 100 : 100;

  const metrics = {
    operation,
    duration,
    success: errorCount === 0,
    itemsProcessed: processedCount,
    errorCount,
    successRate: Math.round(successRate * 100) / 100,
    timestamp: new Date().toISOString(),
  };

  metricsCollector.recordMetrics(metrics);

  const logLevel = errorCount > 0 ? LogLevel.WARN : LogLevel.INFO;
  logger[logLevel]('Batch operation completed', undefined, {
    operation,
    duration,
    metadata: {
      totalItems,
      processedCount,
      successCount,
      errorCount,
      successRate: Math.round(successRate * 100) / 100,
      itemsPerSecond: Math.round((processedCount / duration) * 1000 * 100) / 100,
    },
  });
}

/**
 * Decorator that monitors the performance of a method or function.
 * Wraps the target with timing and error tracking.
 *
 * @param operationName - Optional custom name for the operation. If not provided, uses the method name.
 * @returns Decorator function
 *
 * @example
 * ```typescript
 * class MyClass {
 *   @performanceMonitor()
 *   async myMethod() {
 *     // Method implementation
 *   }
 *
 *   @performanceMonitor('custom-operation')
 *   async anotherMethod() {
 *     // Method implementation
 *   }
 * }
 * ```
 */
export function performanceMonitor(operationName?: string) {
  return function performanceMonitorDecorator(target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
    const originalMethod = descriptor.value;
    const operation = operationName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function performanceMonitorWrapper(...args: any[]) {
      const timer = logger.startOperation(operation);
      return executeWithTimer(timer, () => originalMethod.apply(this, args));
    };
  };
}

/**
 * Decorator that monitors memory usage during method execution.
 * Logs memory deltas and warns if usage exceeds threshold.
 *
 * @param threshold - Memory threshold in bytes (default: 100MB)
 * @returns Decorator function
 *
 * @example
 * ```typescript
 * class MyClass {
 *   @memoryMonitor()
 *   async memoryIntensiveMethod() {
 *     // Method implementation
 *   }
 *
 *   @memoryMonitor(50 * 1024 * 1024) // 50MB threshold
 *   async anotherMethod() {
 *     // Method implementation
 *   }
 * }
 * ```
 */
export function memoryMonitor(threshold: number = 100 * 1024 * 1024) {
  return function memoryMonitorDecorator(target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
    const originalMethod = descriptor.value;
    const operation = `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function memoryMonitorWrapper(...args: any[]) {
      const initialMemory = process.memoryUsage();

      logger.debug('Memory monitoring started', {
        operation,
        initialMemory: {
          rss: Math.round(initialMemory.rss / 1024 / 1024),
          heapUsed: Math.round(initialMemory.heapUsed / 1024 / 1024),
          heapTotal: Math.round(initialMemory.heapTotal / 1024 / 1024),
        },
      });

      try {
        const result = await originalMethod.apply(this, args);

        const finalMemory = process.memoryUsage();
        const memoryDelta = {
          rss: finalMemory.rss - initialMemory.rss,
          heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
          heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
        };

        const logLevel = memoryDelta.heapUsed > threshold ? 'warn' : 'debug';
        logger[logLevel]('Memory monitoring completed', {
          operation,
          memoryDelta: {
            rss: Math.round(memoryDelta.rss / 1024 / 1024),
            heapUsed: Math.round(memoryDelta.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memoryDelta.heapTotal / 1024 / 1024),
          },
          finalMemory: {
            rss: Math.round(finalMemory.rss / 1024 / 1024),
            heapUsed: Math.round(finalMemory.heapUsed / 1024 / 1024),
            heapTotal: Math.round(finalMemory.heapTotal / 1024 / 1024),
          },
        });

        return result;
      } catch (error) {
        const finalMemory = process.memoryUsage();
        logger.error('Memory monitoring failed', error as Error, {
          operation,
          metadata: {
            finalMemory: {
              rss: Math.round(finalMemory.rss / 1024 / 1024),
              heapUsed: Math.round(finalMemory.heapUsed / 1024 / 1024),
              heapTotal: Math.round(finalMemory.heapTotal / 1024 / 1024),
            },
          },
        });
        throw error;
      }
    };
  };
}

/**
 * Decorator for batch operations that tracks progress and metrics.
 * Requires the method to return an object with batch operation results.
 *
 * @param operationName - Optional custom name for the batch operation
 * @returns Decorator function
 *
 * @example
 * ```typescript
 * class MyClass {
 *   @batchMonitor()
 *   async processBatch(items: string[]): Promise<{
 *     results: any[];
 *     errors: Error[];
 *     processedCount: number;
 *     errorCount: number;
 *   }> {
 *     // Method implementation that returns batch results
 *     return { results: [], errors: [], processedCount: 0, errorCount: 0 };
 *   }
 * }
 * ```
 */
export function batchMonitor(operationName?: string) {
  return function batchMonitorDecorator(target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
    const originalMethod = descriptor.value;
    const operation = operationName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function batchMonitorWrapper(...args: any[]) {
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        const { totalItems, processedCount, errorCount } = extractBatchMetrics(result);

        logBatchCompletion(operation, duration, totalItems, processedCount, errorCount);

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Batch operation failed', error as Error, {
          operation,
          duration,
        });
        throw error;
      }
    };
  };
}

/**
 * Utility function to monitor arbitrary functions (for backward compatibility).
 * Consider using the @performanceMonitor decorator instead for new code.
 *
 * @param operation - Name of the operation
 * @param fn - Function to monitor
 * @param metadata - Optional metadata
 * @returns Result of the function
 */
export async function monitorFunction<T>(
  operation: string,
  fn: () => Promise<T> | T,
  metadata?: Record<string, any>
): Promise<T> {
  const timer = logger.startOperation(operation, metadata);
  return executeWithTimer(timer, fn);
}

/**
 * Creates a batch operation tracker for manual progress reporting.
 * Use the @batchMonitor decorator for automatic tracking instead.
 *
 * @param operationName - Name of the batch operation
 * @param totalItems - Total number of items to process
 * @param onProgress - Callback for progress updates
 * @returns Batch tracker object
 */
export function trackBatchOperation(
  operationName: string,
  totalItems: number,
  onProgress?: (processed: number, total: number) => void
) {
  let processedCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  return {
    recordSuccess: () => {
      processedCount += 1;
      if (onProgress) {
        onProgress(processedCount, totalItems);
      }
    },

    recordError: (error: Error) => {
      processedCount += 1;
      errorCount += 1;
      logger.warn('Batch operation item failed', error, {
        operation: operationName,
        metadata: {
          processed: processedCount,
          total: totalItems,
          errorCount,
        },
      });

      if (onProgress) {
        onProgress(processedCount, totalItems);
      }
    },

    complete: () => {
      const duration = Date.now() - startTime;
      logBatchCompletion(operationName, duration, totalItems, processedCount, errorCount);

      return {
        operation: operationName,
        duration,
        success: errorCount === 0,
        itemsProcessed: processedCount,
        errorCount,
        successRate: calculateSuccessRate(totalItems, processedCount - errorCount),
        timestamp: new Date().toISOString(),
      };
    },
  };
}
