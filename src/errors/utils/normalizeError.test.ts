import { normalizeError } from './normalizeError';
import { SystemError } from '../system.error';
import { ErrorHandler } from '../error-handler';

// Mock ErrorHandler to control its behavior in tests
jest.mock('../error-handler');

describe('normalizeError', () => {
  const mockNormalizeError = jest.fn();
  const mockErrorHandler = {
    normalizeError: mockNormalizeError,
  };

  beforeEach(() => {
    (ErrorHandler as jest.MockedClass<typeof ErrorHandler>).mockImplementation(() => mockErrorHandler as any);
    jest.clearAllMocks();
  });

  it('should create ErrorHandler with default context and call normalizeError', () => {
    const error = new Error('Test error');
    const operation = 'testOp';
    const expectedResult = new SystemError('Normalized error');
    mockNormalizeError.mockReturnValue(expectedResult);

    const result = normalizeError(error, operation);

    expect(ErrorHandler).toHaveBeenCalledWith('ErrorHandler');
    expect(mockNormalizeError).toHaveBeenCalledWith(error, operation);
    expect(result).toBe(expectedResult);
  });

  it('should create ErrorHandler with custom context and call normalizeError', () => {
    const error = 'String error';
    const context = 'CustomContext';
    const expectedResult = new SystemError('Normalized string error');
    mockNormalizeError.mockReturnValue(expectedResult);

    const result = normalizeError(error, undefined, context);

    expect(ErrorHandler).toHaveBeenCalledWith(context);
    expect(mockNormalizeError).toHaveBeenCalledWith(error, undefined);
    expect(result).toBe(expectedResult);
  });

  it('should handle unknown error types', () => {
    const error = { custom: 'error' };
    const expectedResult = new SystemError('Normalized unknown error');
    mockNormalizeError.mockReturnValue(expectedResult);

    const result = normalizeError(error);

    expect(ErrorHandler).toHaveBeenCalledWith('ErrorHandler');
    expect(mockNormalizeError).toHaveBeenCalledWith(error, undefined);
    expect(result).toBe(expectedResult);
  });

  it('should handle null and undefined errors', () => {
    const error = null;
    const expectedResult = new SystemError('Normalized null error');
    mockNormalizeError.mockReturnValue(expectedResult);

    const result = normalizeError(error, 'op');

    expect(mockNormalizeError).toHaveBeenCalledWith(error, 'op');
    expect(result).toBe(expectedResult);
  });
});
