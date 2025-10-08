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

import { OutputPaths } from '../../config';
import { PathOptions } from './path.options';

describe('PathOptions', () => {
  describe('folder', () => {
    it('should have correct flags, description, and default', () => {
      expect(PathOptions.folder.flags).toBe('-f, --folder <path>');
      expect(PathOptions.folder.description).toBe('Folder path containing files to process');
      expect(PathOptions.folder.defaultValue).toBe('files'); // From AppConfig.getFileProcessingConfig().defaultInputFolder
    });
  });

  describe('createOutput', () => {
    it('should create output option with default path and description', () => {
      const option = PathOptions.createOutput('test/path', 'Test output path');
      expect(option.flags).toBe('-o, --output <path>');
      expect(option.description).toBe('Test output path');
      expect(option.defaultValue).toBe('test/path');
    });

    it('should create output option with default description when not provided', () => {
      const option = PathOptions.createOutput('test/path');
      expect(option.flags).toBe('-o, --output <path>');
      expect(option.description).toBe('Output path for results');
      expect(option.defaultValue).toBe('test/path');
    });

    it('should create output option without default when no path provided', () => {
      const option = PathOptions.createOutput();
      expect(option.flags).toBe('-o, --output <path>');
      expect(option.description).toBe('Output path for results');
      expect(option.defaultValue).toBeUndefined();
    });
  });

  describe('output', () => {
    it('should be created without default', () => {
      expect(PathOptions.output.flags).toBe('-o, --output <path>');
      expect(PathOptions.output.description).toBe('Output path for results');
      expect(PathOptions.output.defaultValue).toBeUndefined();
    });
  });

  describe('metadataFolder', () => {
    it('should have correct flags, description, and default', () => {
      expect(PathOptions.metadataFolder.flags).toBe('-f, --folder <path>');
      expect(PathOptions.metadataFolder.description).toBe('Folder path to upload');
      expect(PathOptions.metadataFolder.defaultValue).toBe('metadata'); // From AppConfig.getFileProcessingConfig().defaultMetadataFolder
    });
  });

  describe('finalOutput', () => {
    it('should have correct flags, description, and default', () => {
      expect(PathOptions.finalOutput.flags).toBe('--final-output <path>');
      expect(PathOptions.finalOutput.description).toBe('Output path for hash of hashes');
      expect(PathOptions.finalOutput.defaultValue).toBe(OutputPaths.FILES.hashOfHashes);
    });
  });
});
