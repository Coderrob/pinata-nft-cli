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

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { isNonEmptyString } from './guards';

export class FileUtils {
  // Expose fs constants for compatibility
  public static readonly constants = fs.constants;

  /**
   * Gets the file name from a provided file path.
   * @param filePath - The file path to extract a file name from
   * @returns The file name from a file path; otherwise an empty string
   */
  public static getFileName(filePath: string): string {
    if (!isNonEmptyString(filePath)) {
      console.warn('[FileUtils] Empty file path provided');
      return '';
    }

    const fileName = filePath.replace(/^.*[\\/]/, '');
    if (!isNonEmptyString(fileName)) {
      console.warn(`[FileUtils] Could not extract file name from path: ${filePath}`);
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

  /**
   * Ensures a directory exists, creating it if necessary
   * @param dirPath - The directory path to ensure exists
   */
  public static async ensureDir(dirPath: string): Promise<void> {
    try {
      await fsPromises.mkdir(dirPath, { recursive: true });
      console.debug(`[FileUtils] Ensured directory exists: ${dirPath}`);
    } catch (error) {
      console.error(`[FileUtils] Failed to ensure directory exists: ${dirPath}`, error);
      throw error;
    }
  }

  /**
   * Writes data as JSON to a file synchronously
   * @param filePath - The path where to save the file
   * @param data - The data to save as JSON
   */
  public static outputJsonSync(filePath: string, data: unknown): void {
    try {
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.debug(`[FileUtils] Successfully saved JSON to: ${filePath}`);
    } catch (error) {
      console.error(`[FileUtils] Failed to save JSON to: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Reads JSON data from a file synchronously
   * @param filePath - The path to the JSON file
   * @returns The parsed JSON data
   */
  public static readJsonSync<T = unknown>(filePath: string): T {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      console.debug(`[FileUtils] Successfully read JSON from: ${filePath}`);
      return data;
    } catch (error) {
      console.error(`[FileUtils] Failed to read JSON from: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Reads file content synchronously
   * @param filePath - The path to the file
   * @returns The file content as Buffer
   */
  public static readFileSync(filePath: string): Buffer {
    try {
      return fs.readFileSync(filePath);
    } catch (error) {
      console.error(`[FileUtils] Failed to read file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Writes data to a file asynchronously
   * @param filePath - The path to the file
   * @param data - The data to write
   */
  public static async writeFile(filePath: string, data: string | Buffer): Promise<void> {
    try {
      await fsPromises.writeFile(filePath, data, 'utf8');
      console.debug(`[FileUtils] Successfully wrote to file: ${filePath}`);
    } catch (error) {
      console.error(`[FileUtils] Failed to write to file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Removes a file or directory asynchronously
   * @param path - The path to remove
   */
  public static async remove(path: string): Promise<void> {
    try {
      await fsPromises.rm(path, { recursive: true, force: true });
      console.debug(`[FileUtils] Successfully removed: ${path}`);
    } catch (error) {
      console.error(`[FileUtils] Failed to remove: ${path}`, error);
      throw error;
    }
  }

  /**
   * Tests a user's permissions for the file or directory specified by path
   * @param path - The path to test
   * @param mode - The permission mode (defaults to R_OK | W_OK)
   */
  public static async access(path: string, mode?: number): Promise<void> {
    try {
      await fsPromises.access(path, mode);
      console.debug(`[FileUtils] Access check passed for: ${path}`);
    } catch (error) {
      console.error(`[FileUtils] Access check failed for: ${path}`, error);
      throw error;
    }
  }

  /**
   * Checks if a file exists by attempting to access it
   * @param filePath - The path to check
   * @returns True if file exists and is accessible
   */
  public static fileExists(filePath: string): boolean {
    try {
      fs.accessSync(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
