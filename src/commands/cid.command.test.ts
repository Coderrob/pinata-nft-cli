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

import { Command, Option } from 'commander';
import { CIDCommand } from './cid.command';
import { CIDProcessor } from '../core';
import { OutputPaths } from '../config/output-paths';
import { OptionGroups } from './options';

jest.mock('../core', () => ({
  CIDProcessor: jest.fn(),
}));

const mockedCIDProcessor = jest.mocked(CIDProcessor);

describe('CIDCommand', () => {
  let program: Command;
  let sut: CIDCommand;
  let batchSpy: jest.SpyInstance<Option[]>;

  beforeEach(() => {
    program = new Command();
    sut = new CIDCommand();
    batchSpy = jest.spyOn(OptionGroups, 'batchProcessing');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('initialises command metadata', () => {
      expect((sut as any).commandName).toBe('cid');
      expect((sut as any).description).toBe('Calculate IPFS CIDs for files in a folder');
    });
  });

  describe('configure', () => {
    const mockOptions = () => [new Option('-x, --example', 'example option')];

    beforeEach(() => {
      batchSpy.mockReturnValueOnce(mockOptions());
    });

    it('registers the cid command with description and positional arguments', () => {
      sut.configure(program);

      const cid = program.commands.find(cmd => cmd.name() === 'cid');
      expect(cid).toBeDefined();
      expect(cid?.description()).toBe('Calculate IPFS CIDs for files in a folder');

      const help = cid?.helpInformation();
      expect(help).toContain('<folder>');
      expect(help).toContain('<output>');
    });

    it('attaches batch processing options exactly once', () => {
      sut.configure(program);

      expect(batchSpy).toHaveBeenCalledTimes(1);
      expect(batchSpy).toHaveBeenCalledWith(OutputPaths.FILES.fileCids);

      const cid = program.commands.find(cmd => cmd.name() === 'cid');
      expect(cid?.options.some(option => option.flags === '-x, --example')).toBe(true);
    });
  });

  describe('configure action', () => {
    const arrangeProcessor = () => {
      const process = jest.fn();
      mockedCIDProcessor.mockImplementationOnce(() => ({ process }) as unknown as CIDProcessor);
      return process;
    };

    beforeEach(() => {
      batchSpy.mockReturnValueOnce([]);
    });

    afterEach(() => {
      mockedCIDProcessor.mockReset();
    });

    it('executes successfully and logs summary', async () => {
      const process = arrangeProcessor();
      process.mockResolvedValueOnce({ 'file-a.png': 'cid-1' });

      const validateSpy = jest
        .spyOn(sut as unknown as { validateOptions: (options: unknown) => void }, 'validateOptions')
        .mockImplementationOnce(() => undefined);

      const rateSpy = jest
        .spyOn(sut as unknown as { createRateLimitConfig: (options: unknown) => unknown }, 'createRateLimitConfig')
        .mockReturnValueOnce({ maxConcurrent: 2 });

      const logSpy = jest
        .spyOn(sut as unknown as { logSuccess: (message: string) => void }, 'logSuccess')
        .mockImplementationOnce(() => undefined);

      jest
        .spyOn((sut as unknown as { logger: { info: (...args: unknown[]) => void } }).logger, 'info')
        .mockImplementation(() => undefined);

      sut.configure(program);

      await program.parseAsync(['cid', 'folderPath', 'outputPath'], { from: 'user' });

      expect(validateSpy).toHaveBeenCalledTimes(1);
      expect(validateSpy).toHaveBeenCalledWith({ folder: 'folderPath', output: 'outputPath' });
      expect(rateSpy).toHaveBeenCalledTimes(1);
      expect(process).toHaveBeenCalledTimes(1);
      expect(process).toHaveBeenCalledWith({ folderPath: 'folderPath', outputPath: 'outputPath' });
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith('CID calculation completed for 1 files');
    });

    it('delegates errors to handleError', async () => {
      const process = arrangeProcessor();
      const failure = new Error('processing failure');
      process.mockRejectedValueOnce(failure);

      jest
        .spyOn(sut as unknown as { validateOptions: (options: unknown) => void }, 'validateOptions')
        .mockImplementationOnce(() => undefined);
      jest
        .spyOn(sut as unknown as { createRateLimitConfig: (options: unknown) => unknown }, 'createRateLimitConfig')
        .mockReturnValueOnce({});
      const errorSpy = jest
        .spyOn(sut as unknown as { handleError: (error: unknown) => void }, 'handleError')
        .mockImplementationOnce(() => undefined);

      jest
        .spyOn((sut as unknown as { logger: { info: (...args: unknown[]) => void } }).logger, 'info')
        .mockImplementation(() => undefined);

      sut.configure(program);

      await program.parseAsync(['cid', 'folderPath', 'outputPath'], { from: 'user' });

      expect(process).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(failure);
    });
  });
});
