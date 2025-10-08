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

import * as fs from 'fs/promises';
import * as path from 'path';

import { FileSystemError } from '../errors';
import { ErrorCode } from '../types/errors';
import { IFileService } from '../types';
import { isEmptyArray, Logger } from '../utils';
import { FileUtils } from '../utils/file.utils';

export class FileService implements IFileService {
  private readonly logger = new Logger('FileService');

  /**
   * Recursively reads all files from a directory
   * @param dirPath - The directory path to read from
   * @returns Array of absolute file paths
   */
  private async readFilesRecursively(dirPath: string): Promise<string[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    const results = await Promise.all(
      entries.map(async entry => {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          return this.readFilesRecursively(fullPath);
        }
        if (entry.isFile()) {
          return [fullPath];
        }
        return [];
      })
    );

    return results.flat();
  }

  /**
   * Gets all files from a folder (interface method)
   */
  public async getFiles(folderPath: string): Promise<string[]> {
    return this.readFiles(folderPath);
  }

  /**
   * Ensures a directory exists, creating it if necessary (interface method)
   */
  public async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await FileUtils.ensureDir(dirPath);
      this.logger.debug(`Ensured directory exists: ${dirPath}`);
    } catch (error) {
      const message = `Failed to ensure directory exists: ${dirPath}`;
      this.logger.error(message, error);

      throw new FileSystemError(
        message,
        ErrorCode.DIRECTORY_ACCESS_DENIED,
        { filePath: dirPath, operation: 'ensureDirectoryExists' },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Writes JSON data to a file (interface method)
   */
  public async writeJsonFile(filePath: string, data: unknown): Promise<void> {
    return this.saveJson(filePath, data);
  }

  /**
   * Reads all files from a given folder recursively
   * @param folderPath - The path to the folder to read
   * @returns Array of file paths
   */
  public async readFiles(folderPath: string): Promise<string[]> {
    try {
      this.logger.info(`Reading files from folder: ${folderPath}`);
      const files = await this.readFilesRecursively(folderPath);

      if (!files || isEmptyArray(files)) {
        this.logger.warn(`No files found in folder: ${folderPath}`);
        return [];
      }

      this.logger.info(`Found ${files.length} files in ${folderPath}`);
      return files;
    } catch (error) {
      throw this.handleReadFilesError(error, folderPath);
    }
  }

  /**
   * Handles errors from readFiles operation
   * @param error - The original error
   * @param folderPath - The folder path that caused the error
   * @returns FileSystemError with appropriate error code
   */
  private handleReadFilesError(error: unknown, folderPath: string): FileSystemError {
    const message = `Failed to read files from ${folderPath}`;
    this.logger.error(message, error);

    const errorCode = this.determineDirectoryErrorCode(error);
    return new FileSystemError(
      message,
      errorCode,
      { filePath: folderPath, operation: 'readFiles' },
      error instanceof Error ? error : undefined
    );
  }

  /**
   * Determines the appropriate error code for directory operations
   * @param error - The original error
   * @returns Appropriate ErrorCode
   */
  private determineDirectoryErrorCode(error: unknown): ErrorCode {
    if (!(error instanceof Error)) {
      return ErrorCode.FILE_NOT_FOUND;
    }

    return this.mapDirectoryErrorMessage(error.message);
  }

  /**
   * Maps directory error message to appropriate error code
   * @param message - Error message
   * @returns Appropriate ErrorCode
   */
  private mapDirectoryErrorMessage(message: string): ErrorCode {
    if (message.includes('ENOENT') || message.includes('not found')) {
      return ErrorCode.DIRECTORY_NOT_FOUND;
    }

    return message.includes('EACCES') || message.includes('permission')
      ? ErrorCode.DIRECTORY_ACCESS_DENIED
      : ErrorCode.FILE_NOT_FOUND;
  }

  /**
   * Saves data as JSON to a file
   * @param filePath - The path where to save the file
   * @param data - The data to save
   */
  public async saveJson(filePath: string, data: unknown): Promise<void> {
    try {
      this.logger.info(`Saving JSON to: ${filePath}`);
      FileUtils.outputJsonSync(filePath, data);
      this.logger.info(`Successfully saved JSON to: ${filePath}`);
    } catch (error) {
      throw this.handleSaveJsonError(error, filePath);
    }
  }

  /**
   * Handles errors from saveJson operation
   * @param error - The original error
   * @param filePath - The file path that caused the error
   * @returns FileSystemError with appropriate error code
   */
  private handleSaveJsonError(error: unknown, filePath: string): FileSystemError {
    const message = `Failed to save JSON to ${filePath}`;
    this.logger.error(message, error);

    const errorCode = this.determineFileErrorCode(error);
    return new FileSystemError(
      message,
      errorCode,
      { filePath, operation: 'saveJson' },
      error instanceof Error ? error : undefined
    );
  }

  /**
   * Determines the appropriate error code for file operations
   * @param error - The original error
   * @returns Appropriate ErrorCode
   */
  private determineFileErrorCode(error: unknown): ErrorCode {
    if (!(error instanceof Error)) {
      return ErrorCode.FILE_ACCESS_DENIED;
    }

    return this.mapFileErrorMessage(error.message);
  }

  /**
   * Maps file error message to appropriate error code
   * @param message - Error message
   * @returns Appropriate ErrorCode
   */
  private mapFileErrorMessage(message: string): ErrorCode {
    if (message.includes('ENOSPC') || message.includes('no space')) {
      return ErrorCode.DISK_FULL;
    }

    return message.includes('EACCES') || message.includes('permission')
      ? ErrorCode.FILE_ACCESS_DENIED
      : ErrorCode.FILE_ACCESS_DENIED;
  }

  /**
   * Reads JSON data from a file
   * @param filePath - The path to the JSON file
   * @returns The parsed JSON data
   */
  public async readJson<T>(filePath: string): Promise<T> {
    try {
      this.logger.info(`Reading JSON from: ${filePath}`);
      const data = FileUtils.readJsonSync<T>(filePath);
      this.logger.info(`Successfully read JSON from: ${filePath}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to read JSON from ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Reads file content synchronously
   * @param filePath - The path to the file
   * @returns The file content as Buffer
   */
  public readFileSync(filePath: string): Buffer {
    try {
      return FileUtils.readFileSync(filePath);
    } catch (error) {
      this.logger.error(`Failed to read file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Checks if a file exists by attempting to read it
   * @param filePath - The path to check
   * @returns True if file exists and is readable
   */
  public fileExists(filePath: string): boolean {
    try {
      FileUtils.readFileSync(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
