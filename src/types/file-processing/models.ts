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

/**
 * Result of hash calculation operation
 */
export interface HashResult {
  readonly fileName: string;
  readonly hash: string;
}

/**
 * Result of CID calculation operation
 */
export interface CIDResult {
  readonly fileName: string;
  readonly cid: string;
}

/**
 * Result of upload operation
 */
export interface UploadResult {
  readonly fileName: string;
  readonly cid: string;
  readonly success: boolean;
  readonly error?: string;
}

/**
 * File mapping interface for hash/CID mappings
 */
export interface FileMapping {
  [fileName: string]: string;
}
