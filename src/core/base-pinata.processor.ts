import { PinataService } from '../services';
import { PinataConfig, ProcessingOptions, RateLimitConfig } from '../types';
import { BaseFileProcessor } from './base.processor';

/**
 * Base class for processors that interact with Pinata service
 * Provides common Pinata service initialization and error handling patterns
 */
export abstract class BasePinataProcessor<TResult> extends BaseFileProcessor<TResult> {
  protected readonly pinataService: PinataService;

  constructor(
    processorName: string,
    config: PinataConfig,
    rateLimitConfig: RateLimitConfig = { maxConcurrent: 1, minTime: 3000 }
  ) {
    super(processorName, rateLimitConfig);
    this.pinataService = new PinataService(config);
  }

  /**
   * Common processing wrapper that handles validation, logging, and error handling
   * @param options - Processing options
   * @param processFn - The actual processing function to execute
   * @returns Processing result
   */
  protected async executeProcessing<T>(options: ProcessingOptions, processFn: () => Promise<T>): Promise<T> {
    this.validateOptions(options);
    this.logProcessingStart(options);

    try {
      return await processFn();
    } catch (error) {
      this.handleError(error);
    }
  }
}
