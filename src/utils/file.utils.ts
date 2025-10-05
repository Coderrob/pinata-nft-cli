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

import { isNonEmptyString } from './guards';
import { Logger } from './logger';

export class FileUtils {
  private static readonly logger = new Logger('FileUtils');

  /**
   * Gets the file name from a provided file path.
   * @param filePath - The file path to extract a file name from
   * @returns The file name from a file path; otherwise an empty string
   */
  public static getFileName(filePath: string): string {
    if (!isNonEmptyString(filePath)) {
      this.logger.warn('Empty file path provided');
      return '';
    }

    const fileName = filePath.replace(/^.*[\\/]/, '');
    if (!isNonEmptyString(fileName)) {
      this.logger.warn(`Could not extract file name from path: ${filePath}`);
      return '';
    }

    return fileName;
  }

  /**
   * Validates if a file path is valid and not empty
   * @param filePath - The file path to validate
   * @returns True if valid, false otherwise
   */
  public static isValidPath(filePath: string): boolean {
    return isNonEmptyString(filePath);
  }

  /**
   * Normalizes a file path by removing extra slashes and standardizing separators
   * @param filePath - The file path to normalize
   * @returns Normalized file path
   */
  public static normalizePath(filePath: string): string {
    if (!this.isValidPath(filePath)) {
      return '';
    }

    return filePath.replace(/[\\/]+/g, '/').replace(/\/$/, '');
  }
}
