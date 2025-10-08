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

import type { LogContext } from '../observability';
import { Logger } from './logger';

type StructuredLoggerMock = {
  info: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
  debug: jest.Mock;
  startOperation: jest.Mock;
  metrics: jest.Mock;
};

const structuredLoggerInstances: StructuredLoggerMock[] = [];

jest.mock('../observability', () => {
  const factory = jest.fn(() => {
    const instance: StructuredLoggerMock = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      startOperation: jest.fn(),
      metrics: jest.fn(),
    };
    structuredLoggerInstances.push(instance);
    return instance;
  });

  return {
    StructuredLogger: factory,
    LogLevel: {
      INFO: 'info',
    },
  };
});

describe('Logger', () => {
  const getInstance = (): StructuredLoggerMock => {
    const instance = structuredLoggerInstances[structuredLoggerInstances.length - 1];
    if (!instance) {
      throw new Error('StructuredLogger instance was not created');
    }
    return instance;
  };

  let logger: Logger;
  const context: LogContext = { requestId: '123' };

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    structuredLoggerInstances.length = 0;
    logger = new Logger('TestContext');
  });

  describe('info', () => {
    it('delegates to structured logger', () => {
      logger.info('message', { foo: 'bar' }, context);
      expect(getInstance().info).toHaveBeenCalledWith('message', { foo: 'bar' }, context);
    });
  });

  describe('warn', () => {
    it('passes through warning messages', () => {
      logger.warn('warning', {}, context);
      expect(getInstance().warn).toHaveBeenCalledWith('warning', {}, context);
    });
  });

  describe('error', () => {
    it('forwards error details', () => {
      const error = new Error('boom');
      logger.error('error', error, context);
      expect(getInstance().error).toHaveBeenCalledWith('error', error, context);
    });
  });

  describe('debug', () => {
    it('forwards debug messages', () => {
      logger.debug('debug', { value: 1 }, context);
      expect(getInstance().debug).toHaveBeenCalledWith('debug', { value: 1 }, context);
    });
  });

  describe('startOperation', () => {
    it('invokes structured logger startOperation', () => {
      logger.startOperation('op', { foo: 'bar' });
      expect(getInstance().startOperation).toHaveBeenCalledWith('op', { foo: 'bar' });
    });
  });

  describe('getStructuredLogger', () => {
    it('returns the wrapped logger instance', () => {
      const instance = getInstance();
      const returned = logger.getStructuredLogger();
      expect(returned).toBe(instance);
    });
  });
});
