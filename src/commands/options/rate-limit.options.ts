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

/**
 * Rate limiting and concurrency options used across multiple commands
 */
export class RateLimitOptions {
  /**
   * Concurrent operations option - used by: upload files, hash, cid
   */
  static readonly concurrent = new Option('-c, --concurrent <number>', 'Number of concurrent operations (1-10)')
    .argParser(value => parseInt(value, 10))
    .default(5);

  /**
   * Minimum time between operations option - used by: upload files
   */
  static readonly minTime = new Option('--min-time <number>', 'Minimum time between uploads (ms)')
    .argParser(value => parseInt(value, 10))
    .default(3000);

  /**
   * Concurrent uploads specific option - used by: upload files
   */
  static readonly concurrentUploads = new Option('-c, --concurrent <number>', 'Number of concurrent uploads (1-10)')
    .argParser(value => parseInt(value, 10))
    .default(1);
}
