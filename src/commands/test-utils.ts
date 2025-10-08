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

import { ILogger, IConfigProvider, IErrorHandler } from '../types/commands';
import { PinataConfig } from '../types';

/**
 * Mock logger implementation for testing
 */
export class MockLogger implements ILogger {
  public readonly infoCalls: Array<{ message: string; args: unknown[] }> = [];
  public readonly warnCalls: Array<{ message: string; args: unknown[] }> = [];
  public readonly errorCalls: Array<{ message: string; error?: unknown }> = [];
  public readonly debugCalls: Array<{ message: string; args: unknown[] }> = [];

  info(message: string, ...args: unknown[]): void {
    this.infoCalls.push({ message, args });
  }

  warn(message: string, ...args: unknown[]): void {
    this.warnCalls.push({ message, args });
  }

  error(message: string, error?: unknown): void {
    this.errorCalls.push({ message, error });
  }

  debug(message: string, ...args: unknown[]): void {
    this.debugCalls.push({ message, args });
  }
}

/**
 * Mock configuration provider implementation for testing
 */
export class MockConfigProvider implements IConfigProvider {
  constructor(private readonly config: PinataConfig = { apiKey: 'test-key', apiSecret: 'test-secret' }) {}

  getPinataConfig(): PinataConfig {
    return this.config;
  }
}

/**
 * Mock error handler implementation for testing
 */
export class MockErrorHandler implements IErrorHandler {
  public readonly handledErrors: unknown[] = [];

  handleError(error: unknown): void {
    this.handledErrors.push(error);
  }
}

/**
 * Creates a mock commander Command instance for testing
 */
export function createMockCommander() {
  const mockOption = jest.fn().mockImplementation(() => ({
    choices: jest.fn().mockReturnThis(),
    default: jest.fn().mockReturnThis(),
    argParser: jest.fn().mockReturnThis(),
  }));
  Object.setPrototypeOf(mockOption, {});

  const mockCommand = jest.fn().mockImplementation(() => ({
    command: jest.fn().mockReturnThis(),
    description: jest.fn().mockReturnThis(),
    option: mockOption,
    action: jest.fn().mockReturnThis(),
    positional: jest.fn().mockReturnThis(),
    help: jest.fn().mockReturnThis(),
    parse: jest.fn().mockReturnThis(),
    showHelpAfterError: jest.fn().mockReturnThis(),
  }));

  return {
    Command: mockCommand,
    Option: mockOption,
  };
}

/**
 * Common test setup for command tests
 */
export interface CommandTestSetup {
  mockLogger: MockLogger;
  mockConfigProvider: MockConfigProvider;
  mockErrorHandler: MockErrorHandler;
}

/**
 * Creates a standard set of mocked dependencies for command tests
 */
export function createCommandTestSetup(): CommandTestSetup {
  return {
    mockLogger: new MockLogger(),
    mockConfigProvider: new MockConfigProvider(),
    mockErrorHandler: new MockErrorHandler(),
  };
}
