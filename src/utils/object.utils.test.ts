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

import { ObjectUtils } from './object.utils';

describe('ObjectUtils', () => {
  describe('sortObjectByKeys', () => {
    test('should sort object keys naturally', () => {
      const input = {
        'file10.txt': 'hash10',
        'file2.txt': 'hash2',
        'file1.txt': 'hash1',
      };
      const result = ObjectUtils.sortObjectByKeys(input);

      expect(Object.keys(result)).toEqual(['file1.txt', 'file2.txt', 'file10.txt']);
    });
  });

  describe('isEmpty', () => {
    test('should return true for empty object', () => {
      expect(ObjectUtils.isEmpty({})).toBe(true);
    });

    test('should return false for non-empty object', () => {
      expect(ObjectUtils.isEmpty({ key: 'value' })).toBe(false);
    });
  });
});
