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

import { Command } from 'commander';
import { createMockCommander } from './test-utils';
import { HashCommand } from './hash.command';
import { OutputPaths } from '../config/output-paths';
import { HashProcessor } from '../core';
import { CommandOptions } from '../types';
import { OptionGroups } from './options';

// Mock dependencies
jest.mock('commander', () => createMockCommander());
jest.mock('../config/output-paths');
jest.mock('../core');
jest.mock('../types');
jest.mock('./options');
jest.mock('./base.command');

describe('HashCommand', () => {
  let command: HashCommand;
  let mockProgram: jest.Mocked<Command>;
  let mockBaseCommand: {
    commandName: string;
    description: string;
    validateOptions: jest.Mock;
    createRateLimitConfig: jest.Mock;
    logger: { info: jest.Mock };
    logSuccess: jest.Mock;
    handleError: jest.Mock;
  };

  // Test subclass to expose protected methods
  class TestHashCommand extends HashCommand {
    public testExecute(options: CommandOptions & { finalOutput?: string }): Promise<void> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this as any).execute(options);
    }
  }

  let testCommand: TestHashCommand;

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    // Mock BaseCommand
    mockBaseCommand = {
      commandName: 'hash',
      description: 'Calculate SHA-256 hashes for files in a folder (v2)',
      validateOptions: jest.fn(),
      createRateLimitConfig: jest.fn(),
      logger: { info: jest.fn() },
      logSuccess: jest.fn(),
      handleError: jest.fn(),
    };

    // Mock Command
    mockProgram = {
      addCommand: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Command>;

    // Mock OptionGroups
    (OptionGroups.hashCalculation as jest.Mock).mockReturnValue([]);

    // Create instance
    command = new HashCommand();
    // Manually set mocked properties since it's extending BaseCommand
    Object.assign(command, mockBaseCommand);

    // Create test instance
    testCommand = new TestHashCommand();
    Object.assign(testCommand, mockBaseCommand);
  });

  describe('constructor', () => {
    it('should initialize with correct command name and description', () => {
      expect((command as any).commandName).toBe('hash');
      expect((command as any).description).toBe('Calculate SHA-256 hashes for files in a folder (v2)');
    });
  });

  describe('configure', () => {
    it('should configure the command with name, description, options, and action', () => {
      command.configure(mockProgram);

      expect(mockProgram.addCommand).toHaveBeenCalled();
      expect(OptionGroups.hashCalculation).toHaveBeenCalledWith(OutputPaths.FILES.fileHashes);
    });
  });

  describe('execute', () => {
    let mockProcessor: {
      process: jest.Mock;
      processWithFinalHash: jest.Mock;
    };

    beforeEach(() => {
      mockProcessor = {
        process: jest.fn(),
        processWithFinalHash: jest.fn(),
      };
      (HashProcessor as jest.Mock).mockImplementation(() => mockProcessor);
    });

    it('should execute successfully with default status', async () => {
      const options: CommandOptions & { finalOutput?: string } = {
        folder: '/test/folder',
        output: '/test/output.json',
      };

      mockProcessor.process.mockResolvedValue({ 'file1.txt': 'hash1', 'file2.txt': 'hash2' });

      await testCommand.testExecute(options);

      expect(mockBaseCommand.validateOptions).toHaveBeenCalledWith(options);
      expect(mockBaseCommand.logger.info).toHaveBeenCalledWith('Starting hash calculation process (v2)');
      expect(HashProcessor).toHaveBeenCalledWith(mockBaseCommand.createRateLimitConfig(options));
      expect(mockProcessor.process).toHaveBeenCalledWith({
        folderPath: '/test/folder',
        outputPath: '/test/output.json',
      });
      expect(mockBaseCommand.logSuccess).toHaveBeenCalledWith('Hash calculation completed for 2 files');
    });

    it('should execute successfully with final output', async () => {
      const options: CommandOptions & { finalOutput?: string } = {
        folder: '/test/folder',
        output: '/test/output.json',
        finalOutput: '/test/final.json',
      };

      mockProcessor.processWithFinalHash.mockResolvedValue('finalHash');

      await testCommand.testExecute(options);

      expect(mockBaseCommand.validateOptions).toHaveBeenCalledWith(options);
      expect(mockBaseCommand.logger.info).toHaveBeenCalledWith('Starting hash calculation process (v2)');
      expect(HashProcessor).toHaveBeenCalledWith(mockBaseCommand.createRateLimitConfig(options));
      expect(mockProcessor.processWithFinalHash).toHaveBeenCalledWith(
        {
          folderPath: '/test/folder',
          outputPath: '/test/output.json',
        },
        '/test/final.json'
      );
      expect(mockBaseCommand.logSuccess).toHaveBeenCalledWith('Hash calculation completed. Final hash: finalHash');
    });

    it('should use default output path if not provided', async () => {
      const options: CommandOptions & { finalOutput?: string } = {
        folder: '/test/folder',
      };

      mockProcessor.process.mockResolvedValue({ 'file1.txt': 'hash1' });

      await testCommand.testExecute(options);

      expect(mockProcessor.process).toHaveBeenCalledWith({
        folderPath: '/test/folder',
        outputPath: OutputPaths.FILES.fileHashes,
      });
    });

    it('should handle errors during execution', async () => {
      const options: CommandOptions & { finalOutput?: string } = {
        folder: '/test/folder',
        output: '/test/output.json',
      };

      mockProcessor.process.mockRejectedValue(new Error('Test error'));

      await testCommand.testExecute(options);

      expect(mockBaseCommand.handleError).toHaveBeenCalledWith(new Error('Test error'));
    });
  });
});
