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

import { BaseCommand } from './base.command';

class TestCommand extends BaseCommand {
  constructor() {
    super('test-command', 'Test command description');
  }

  public configure(): void {}

  public exposeGetPinataConfig() {
    return this.getPinataConfig();
  }

  public exposeValidateOptions(options: Parameters<BaseCommand['validateOptions']>[0]) {
    return this.validateOptions(options);
  }

  public exposeCreateRateLimitConfig(options: Parameters<BaseCommand['createRateLimitConfig']>[0]) {
    return this.createRateLimitConfig(options);
  }

  public exposeHandleError(error: unknown) {
    return this.handleError(error);
  }

  public exposeLogSuccess(message: string) {
    return this.logSuccess(message);
  }
}

describe('BaseCommand', () => {
  let command: TestCommand;
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    command = new TestCommand();
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    process.env = { ...originalEnv };

    // Cleanup to prevent memory leaks
    command = undefined as any;
  });

  describe('getPinataConfig', () => {
    it('should return configuration when environment variables are present', () => {
      process.env.PINATA_API_KEY = 'key';
      process.env.PINATA_API_SECRET = 'secret';

      expect(command.exposeGetPinataConfig()).toStrictEqual({ apiKey: 'key', apiSecret: 'secret' });
    });

    it.each([
      ['key', undefined],
      [undefined, 'secret'],
      ['', 'secret'],
      ['key', ''],
    ])('should throw when apiKey=%s apiSecret=%s', (apiKey, apiSecret) => {
      process.env.PINATA_API_KEY = apiKey as string | undefined;
      process.env.PINATA_API_SECRET = apiSecret as string | undefined;

      expect(() => command.exposeGetPinataConfig()).toThrow(
        'PINATA_API_KEY and PINATA_API_SECRET environment variables are required'
      );
    });
  });

  describe('validateOptions', () => {
    it('should accept valid options without throwing', () => {
      expect(() =>
        command.exposeValidateOptions({ folder: 'files', output: 'out', concurrent: 2, minTime: 200 })
      ).not.toThrow();
    });

    it.each([[{ folder: '' }], [{ output: '' }], [{ concurrent: 0 }], [{ concurrent: 11 }], [{ minTime: 50 }]])(
      'should throw for invalid input %#',
      invalid => {
        expect(() => command.exposeValidateOptions(invalid)).toThrow();
      }
    );
  });

  describe('createRateLimitConfig', () => {
    it('should fall back to defaults when concurrency not provided', () => {
      expect(command.exposeCreateRateLimitConfig({})).toStrictEqual({ maxConcurrent: 5 });
    });

    it('should apply overrides when provided', () => {
      expect(command.exposeCreateRateLimitConfig({ concurrent: 3, minTime: 500 })).toStrictEqual({
        maxConcurrent: 3,
        minTime: 500,
      });
    });
  });

  describe('handleError', () => {
    const error = new Error('boom');

    it('should log the error and exit the process', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const exitSpy = jest.spyOn(process, 'exit').mockImplementationOnce(() => undefined as never);

      command.exposeHandleError(error);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Command execution failed', error);
      expect(exitSpy).toHaveBeenCalledTimes(1);
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('logSuccess', () => {
    it('should emit success message via logger', () => {
      const infoSpy = jest
        .spyOn((command as unknown as { logger: { info: (...args: unknown[]) => void } }).logger, 'info')
        .mockImplementation(() => undefined);

      command.exposeLogSuccess('All good');

      expect(infoSpy).toHaveBeenCalledTimes(1);
      expect(infoSpy).toHaveBeenCalledWith('All good');
    });
  });
});
