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
 * Common file system path options used across multiple commands
 */
export class PathOptions {
  /**
   * Folder path option - used by: upload files, upload folder, hash, cid
   */
  static readonly folder = new Option('-f, --folder <path>', 'Folder path containing files to process').default(
    'files'
  );

  /**
   * Create an output option with a specific default path
   */
  static createOutput(defaultPath?: string, description = 'Output path for results'): Option {
    const option = new Option('-o, --output <path>', description);
    if (defaultPath) {
      option.default(defaultPath);
    }
    return option;
  }

  /**
   * Basic output option without default - used when default is set elsewhere
   */
  static readonly output = PathOptions.createOutput();

  /**
   * Metadata folder specific option - used by: upload folder
   */
  static readonly metadataFolder = new Option('-f, --folder <path>', 'Folder path to upload').default('metadata');

  /**
   * Additional output path for hash of hashes - used by: hash
   */
  static readonly finalOutput = new Option('--final-output <path>', 'Output path for hash of hashes').default(
    './output/file-hashOfHashes.json'
  );
}
