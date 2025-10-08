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
 * Pinata-specific options used across multiple commands
 */
export class PinataOptions {
  /**
   * Display name for uploads - used by: upload folder
   */
  static readonly displayName = new Option('-n, --name <name>', 'Display name for the folder in Pinata');

  /**
   * Pin status filter - used by: download
   */
  static readonly status = new Option('-s, --status <status>', 'Pin status filter (all|pinned|unpinned)')
    .choices(['all', 'pinned', 'unpinned'])
    .default('all');
}
