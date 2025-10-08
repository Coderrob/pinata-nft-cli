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
