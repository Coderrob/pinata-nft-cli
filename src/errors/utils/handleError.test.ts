import { handleError } from './handleError';
import { BaseApplicationError } from '../base.error';
import { ErrorCode, ErrorSeverity } from '../../types/errors';

describe('handleError', () => {
  class TestError extends BaseApplicationError {
    constructor(message: string) {
      super(message, ErrorCode.UNKNOWN_ERROR, ErrorSeverity.MEDIUM, {}, false);
    }
  }

  it('should throw when given a standard Error', () => {
    const error = new Error('Test error');
    expect(() => handleError(error)).toThrow();
  });

  it('should throw when given a BaseApplicationError', () => {
    const error = new TestError('Test base error');
    expect(() => handleError(error)).toThrow();
  });

  it('should throw with operation provided', () => {
    const error = new Error('Test error');
    const operation = 'testOperation';
    expect(() => handleError(error, operation)).toThrow();
  });

  it('should throw with custom context', () => {
    const error = new Error('Test error');
    const context = 'CustomContext';
    expect(() => handleError(error, undefined, context)).toThrow();
  });

  it('should use default context when not provided', () => {
    const error = new Error('Test error');
    expect(() => handleError(error)).toThrow();
  });
});
