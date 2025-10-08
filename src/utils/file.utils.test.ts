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

import { FileUtils } from './file.utils';

describe('FileUtils', () => {
  describe('getFileName', () => {
    test('should extract filename from unix path', () => {
      expect(FileUtils.getFileName('/path/to/file.txt')).toBe('file.txt');
    });

    test('should extract filename from windows path', () => {
      expect(FileUtils.getFileName('C:\\path\\to\\file.txt')).toBe('file.txt');
    });

    test('should return empty string for empty path', () => {
      expect(FileUtils.getFileName('')).toBe('');
    });

    test('should return filename when no path separators', () => {
      expect(FileUtils.getFileName('file.txt')).toBe('file.txt');
    });
  });

  describe('isValidPath', () => {
    test('should return true for valid paths', () => {
      expect(FileUtils.isValidPath('/valid/path')).toBe(true);
      expect(FileUtils.isValidPath('relative/path')).toBe(true);
    });

    test('should return false for invalid paths', () => {
      expect(FileUtils.isValidPath('')).toBe(false);
      expect(FileUtils.isValidPath('   ')).toBe(false);
    });
  });
});
