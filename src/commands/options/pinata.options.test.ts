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
import { PinataOptions } from './pinata.options';

describe('PinataOptions', () => {
  describe('displayName', () => {
    it('should be an Option instance', () => {
      expect(PinataOptions.displayName).toBeInstanceOf(Option);
    });

    it('should have correct flags', () => {
      expect(PinataOptions.displayName.flags).toBe('-n, --name <name>');
    });

    it('should have correct description', () => {
      expect(PinataOptions.displayName.description).toBe('Display name for the folder in Pinata');
    });
  });

  describe('status', () => {
    it('should be an Option instance', () => {
      expect(PinataOptions.status).toBeInstanceOf(Option);
    });

    it('should have correct flags', () => {
      expect(PinataOptions.status.flags).toBe('-s, --status <status>');
    });

    it('should have correct description', () => {
      expect(PinataOptions.status.description).toBe('Pin status filter (all|pinned|unpinned)');
    });

    it('should have correct choices', () => {
      expect(PinataOptions.status.argChoices).toEqual(['all', 'pinned', 'unpinned']);
    });

    it('should have correct default value', () => {
      expect(PinataOptions.status.defaultValue).toBe('all');
    });
  });
});
