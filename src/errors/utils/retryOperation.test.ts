import { retryOperation } from './retryOperation';
import { ErrorHandler } from '../error-handler';

// Mock the ErrorHandler class
jest.mock('../error-handler');

describe('retryOperation', () => {
  let mockErrorHandler: jest.Mocked<ErrorHandler>;
  let mockWithRetry: jest.SpyInstance;

  beforeEach(() => {
    mockErrorHandler = new ErrorHandler('ErrorHandler') as jest.Mocked<ErrorHandler>;
    mockWithRetry = jest.spyOn(mockErrorHandler, 'withRetry');
    (ErrorHandler as jest.MockedClass<typeof ErrorHandler>).mockImplementation(() => mockErrorHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call ErrorHandler.withRetry with correct parameters and return the result on success', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    const operationName = 'testOperation';
    const maxRetries = 3;
    const backoffMs = 1000;
    const context = 'TestContext';

    mockWithRetry.mockResolvedValue('success');

    const result = await retryOperation(operation, operationName, maxRetries, backoffMs, context);

    expect(ErrorHandler).toHaveBeenCalledWith(context);
    expect(mockWithRetry).toHaveBeenCalledWith(operation, operationName, maxRetries, backoffMs);
    expect(result).toBe('success');
  });

  it('should use default values for maxRetries, backoffMs, and context', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    const operationName = 'testOperation';

    mockWithRetry.mockResolvedValue('success');

    await retryOperation(operation, operationName);

    expect(ErrorHandler).toHaveBeenCalledWith('ErrorHandler');
    expect(mockWithRetry).toHaveBeenCalledWith(operation, operationName, 3, 1000);
  });

  it('should propagate errors from withRetry', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));
    const operationName = 'testOperation';
    const error = new Error('Retry failed');

    mockWithRetry.mockRejectedValue(error);

    await expect(retryOperation(operation, operationName)).rejects.toThrow('Retry failed');
  });

  it('should handle operation that succeeds after retries', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success');
    const operationName = 'testOperation';

    mockWithRetry.mockResolvedValue('success');

    const result = await retryOperation(operation, operationName, 3);

    expect(result).toBe('success');
    expect(mockWithRetry).toHaveBeenCalledWith(operation, operationName, 3, 1000);
  });

  it('should handle operation that fails all retries', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Always fails'));
    const operationName = 'testOperation';
    const error = new Error('Max retries exceeded');

    mockWithRetry.mockRejectedValue(error);

    await expect(retryOperation(operation, operationName, 2)).rejects.toThrow('Max retries exceeded');
  });

  it('should work with custom maxRetries and backoffMs', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    const operationName = 'testOperation';
    const maxRetries = 5;
    const backoffMs = 2000;

    mockWithRetry.mockResolvedValue('success');

    await retryOperation(operation, operationName, maxRetries, backoffMs);

    expect(mockWithRetry).toHaveBeenCalledWith(operation, operationName, maxRetries, backoffMs);
  });
});
