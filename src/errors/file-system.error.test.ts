import { FileSystemError } from './file-system.error';
import { ErrorCode, ErrorSeverity } from '../types/errors';

describe('FileSystemError', () => {
  it('should create an instance with default values', () => {
    const error = new FileSystemError('Test message');
    expect(error).toBeInstanceOf(FileSystemError);
    expect(error.message).toBe('Test message');
    expect(error.code).toBe(ErrorCode.FILE_NOT_FOUND);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.context).toEqual({});
    expect(error.cause).toBeUndefined();
  });

  it('should create an instance with custom code', () => {
    const error = new FileSystemError('Test message', ErrorCode.FILE_ACCESS_DENIED);
    expect(error.code).toBe(ErrorCode.FILE_ACCESS_DENIED);
  });

  it('should create an instance with custom context', () => {
    const context = { filePath: '/test/path' };
    const error = new FileSystemError('Test message', undefined, context);
    expect(error.context).toEqual(context);
  });

  it('should create an instance with custom cause', () => {
    const cause = new Error('Underlying error');
    const error = new FileSystemError('Test message', undefined, undefined, cause);
    expect(error.cause).toBe(cause);
  });

  it('should create an instance with all custom parameters', () => {
    const context = { filePath: '/test/path' };
    const cause = new Error('Underlying error');
    const error = new FileSystemError('Test message', ErrorCode.FILE_ACCESS_DENIED, context, cause);
    expect(error.message).toBe('Test message');
    expect(error.code).toBe(ErrorCode.FILE_ACCESS_DENIED);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.context).toEqual(context);
    expect(error.cause).toBe(cause);
  });
});
