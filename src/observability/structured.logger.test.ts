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

import { StructuredLogger, OperationTimer } from './structured.logger';
import { LogContext, LogLevel, PerformanceMetrics } from '../types';

describe('StructuredLogger', () => {
  let logger: StructuredLogger;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new StructuredLogger('TestContext', LogLevel.DEBUG);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    delete process.env.LOG_LEVEL;

    // Explicitly restore console spies to prevent memory leaks
    consoleLogSpy?.mockRestore();
    consoleErrorSpy?.mockRestore();
    consoleWarnSpy?.mockRestore();
    consoleDebugSpy?.mockRestore();

    // Cleanup to prevent memory leaks
    logger = undefined as any;
    consoleLogSpy = undefined as any;
    consoleErrorSpy = undefined as any;
    consoleWarnSpy = undefined as any;
    consoleDebugSpy = undefined as any;
  });

  describe('constructor', () => {
    it('should set context and default log level', () => {
      const logger = new StructuredLogger('Test');
      expect(logger).toBeDefined();
    });

    it('should use LOG_LEVEL from environment if valid', () => {
      process.env.LOG_LEVEL = LogLevel.ERROR;
      const logger = new StructuredLogger('Test');
      expect(logger).toBeDefined();
    });

    it('should ignore invalid LOG_LEVEL', () => {
      process.env.LOG_LEVEL = 'invalid';
      const logger = new StructuredLogger('Test', LogLevel.INFO);
      expect(logger).toBeDefined();
    });
  });

  describe('logging methods', () => {
    it('should log info message', () => {
      logger.info('Test info');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO] [TestContext] Test info'));
    });

    it('should log warn message', () => {
      logger.warn('Test warn');
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[WARN] [TestContext] Test warn'));
    });

    it('should log error message with Error', () => {
      const error = new Error('Test error');
      logger.error('Test error message', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] [TestContext] Test error message ERROR: Test error')
      );
    });

    it('should log error message with non-Error', () => {
      logger.error('Test error message', 'string error');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] [TestContext] Test error message ERROR: string error')
      );
    });

    it('should log debug message', () => {
      logger.debug('Test debug');
      expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG] [TestContext] Test debug'));
    });

    it('should log trace message', () => {
      const traceLogger = new StructuredLogger('TestContext', LogLevel.TRACE);
      traceLogger.trace('Test trace');
      expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining('[TRACE] [TestContext] Test trace'));
    });

    it('should include data in log', () => {
      logger.info('Test', { key: 'value' });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('{"key":"value"}'));
    });

    it('should include logContext in log', () => {
      const logContext: LogContext = { requestId: '123', operation: 'op' };
      logger.info('Test', undefined, logContext);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[requestId=123, operation=op]'));
    });
  });

  describe('log level filtering', () => {
    it('should not log below current level', () => {
      const logger = new StructuredLogger('Test', LogLevel.ERROR);
      logger.info('Test');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log at current level', () => {
      const logger = new StructuredLogger('Test', LogLevel.INFO);
      logger.info('Test');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('startOperation', () => {
    it('should start operation and return timer', () => {
      const timer = logger.startOperation('testOp');
      expect(timer).toBeInstanceOf(OperationTimer);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Operation started: testOp'));
    });
  });

  describe('metrics', () => {
    it('should log performance metrics', () => {
      const metrics: PerformanceMetrics = {
        operation: 'test',
        duration: 100,
        success: true,
        timestamp: new Date().toISOString(),
        itemsProcessed: 10,
        errorCount: 0,
      };
      logger.metrics(metrics);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Performance metrics'));
    });
  });
});

describe('OperationTimer', () => {
  let logger: StructuredLogger;
  let timer: OperationTimer;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new StructuredLogger('TestContext', LogLevel.DEBUG);
    timer = logger.startOperation('testOp');
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('complete', () => {
    it('should complete successfully and log', () => {
      const metrics = timer.complete(true);
      expect(metrics.success).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Operation completed: testOp'));
    });

    it('should complete with failure and log error', () => {
      const metrics = timer.complete(false);
      expect(metrics.success).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Operation failed: testOp'));
    });
  });

  describe('progress', () => {
    it('should log progress', () => {
      timer.progress('Processing', 5);
      expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining('testOp progress: Processing'));
    });
  });
});
