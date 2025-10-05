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

// Mock dependencies
jest.mock('../core');
jest.mock('../config/output-paths');
jest.mock('./options');
jest.mock('./base.command');

describe('CIDCommand', () => {
  let command: CIDCommand;
  let program: Command;

  const MockCIDProcessor = CIDProcessor as jest.MockedClass<typeof CIDProcessor>;
  const MockOutputPaths = OutputPaths as jest.Mocked<typeof OutputPaths>;
  const MockOptionGroups = OptionGroups as jest.Mocked<typeof OptionGroups>;

  beforeEach(() => {
    command = new CIDCommand();
    program = new Command();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should set commandName and description', () => {
      expect(command.commandName).toBe('cid');
      expect(command.description).toBe('Calculate IPFS CIDs for files in a folder');
    });
  });

  describe('configure', () => {
    it('should configure the command with arguments and options', () => {
      const mockOptions: Option[] = [{} as any]; // Mock options array
      MockOptionGroups.batchProcessing.mockReturnValue(mockOptions);

      command.configure(program);

      const cmd = program.commands.find(c => c.name() === 'cid');
      expect(cmd).toBeDefined();
      expect(cmd?.description()).toBe(command.description);
      expect(cmd?.args.length).toBe(2); // Two positional arguments
      expect(MockOptionGroups.batchProcessing).toHaveBeenCalledWith(MockOutputPaths.FILES.fileCids);
    });
  });

  describe('command action', () => {
    beforeEach(() => {
      MockOptionGroups.batchProcessing.mockReturnValue([]);
    });

    it('should execute successfully', async () => {
      const mockProcessor = new MockCIDProcessor();
      mockProcessor.process.mockResolvedValue({ 'file1.txt': 'cid1' });

      command.configure(program);

      // Spy on BaseCommand methods
      jest.spyOn(command as any, 'validateOptions').mockImplementation(() => {});
      jest.spyOn(command as any, 'createRateLimitConfig').mockReturnValue({});
      jest.spyOn(command as any, 'logSuccess').mockImplementation(() => {});
      jest.spyOn(command as any, 'logger', 'get').mockReturnValue({ info: jest.fn() });

      const args = ['cid', 'folderPath', 'outputPath'];
      await program.parseAsync(args);

      expect((command as any).validateOptions).toHaveBeenCalledWith({
        folder: 'folderPath',
        output: 'outputPath',
      });
      expect(mockProcessor.process).toHaveBeenCalledWith({
        folderPath: 'folderPath',
        outputPath: 'outputPath',
      });
      expect((command as any).logSuccess).toHaveBeenCalledWith('CID calculation completed for 1 files');
    });

    it('should handle errors', async () => {
      const mockProcessor = new MockCIDProcessor();
      mockProcessor.process.mockRejectedValue(new Error('Test error'));

      command.configure(program);

      jest.spyOn(command as any, 'validateOptions').mockImplementation(() => {});
      jest.spyOn(command as any, 'createRateLimitConfig').mockReturnValue({});
      jest.spyOn(command as any, 'handleError').mockImplementation(() => {});
      jest.spyOn(command as any, 'logger', 'get').mockReturnValue({ info: jest.fn() });

      const args = ['cid', 'folderPath', 'outputPath'];
      await program.parseAsync(args);

      expect((command as any).handleError).toHaveBeenCalledWith(new Error('Test error'));
    });
  });
});
