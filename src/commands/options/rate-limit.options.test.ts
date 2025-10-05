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

import { Option } from 'commander';
import { RateLimitOptions } from './rate-limit.options';

const requireCommanderOption = () => require('commander').Option;

describe('RateLimitOptions', () => {
  const parse = (option: Option, value: string): number => {
    const parser = option.parseArg as ((arg: string, previous?: unknown) => unknown) | undefined;
    expect(parser).toBeDefined();
    return parser!(value, undefined) as number;
  };

  describe('concurrent', () => {
    it('should be an instance of Option', () => {
      expect(RateLimitOptions.concurrent).toBeInstanceOf(requireCommanderOption());
    });

    it('should have correct flags', () => {
      expect(RateLimitOptions.concurrent.flags).toBe('-c, --concurrent <number>');
    });

    it('should have correct description', () => {
      expect(RateLimitOptions.concurrent.description).toBe('Number of concurrent operations (1-10)');
    });

    it('should have default value 5', () => {
      expect(RateLimitOptions.concurrent.defaultValue).toBe(5);
    });

    it('should parse valid number correctly', () => {
      expect(parse(RateLimitOptions.concurrent, '3')).toBe(3);
    });

    it('should parse invalid input as NaN', () => {
      expect(parse(RateLimitOptions.concurrent, 'abc')).toBeNaN();
    });
  });

  describe('minTime', () => {
    it('should be an instance of Option', () => {
      expect(RateLimitOptions.minTime).toBeInstanceOf(requireCommanderOption());
    });

    it('should have correct flags', () => {
      expect(RateLimitOptions.minTime.flags).toBe('--min-time <number>');
    });

    it('should have correct description', () => {
      expect(RateLimitOptions.minTime.description).toBe('Minimum time between uploads (ms)');
    });

    it('should have default value 3000', () => {
      expect(RateLimitOptions.minTime.defaultValue).toBe(3000);
    });

    it('should parse valid number correctly', () => {
      expect(parse(RateLimitOptions.minTime, '1000')).toBe(1000);
    });

    it('should parse invalid input as NaN', () => {
      expect(parse(RateLimitOptions.minTime, 'invalid')).toBeNaN();
    });
  });

  describe('concurrentUploads', () => {
    it('should be an instance of Option', () => {
      expect(RateLimitOptions.concurrentUploads).toBeInstanceOf(requireCommanderOption());
    });

    it('should have correct flags', () => {
      expect(RateLimitOptions.concurrentUploads.flags).toBe('-c, --concurrent <number>');
    });

    it('should have correct description', () => {
      expect(RateLimitOptions.concurrentUploads.description).toBe('Number of concurrent uploads (1-10)');
    });

    it('should have default value 1', () => {
      expect(RateLimitOptions.concurrentUploads.defaultValue).toBe(1);
    });

    it('should parse valid number correctly', () => {
      expect(parse(RateLimitOptions.concurrentUploads, '2')).toBe(2);
    });

    it('should parse invalid input as NaN', () => {
      expect(parse(RateLimitOptions.concurrentUploads, 'xyz')).toBeNaN();
    });
  });
});
