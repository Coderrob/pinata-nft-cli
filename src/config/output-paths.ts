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
 * Centralized configuration for default output paths
 */
export const OutputPaths = {
  // Base output directory
  BASE_DIR: './output',

  // Default output files for each command type
  FILES: {
    fileHashes: './output/file-hashes.json',
    fileCids: './output/file-cids.json',
    uploadedFiles: './output/uploaded-files.json',
    folderCid: './output/folder-cid.json',
    downloadedCids: './output/downloaded-cids.json',
    hashOfHashes: './output/file-hashOfHashes.json',
  },

  // Helper to create a custom output path
  createPath: (filename: string): string => `./output/${filename}`,
} as const;

/**
 * Legacy compatibility - can be removed once all references are updated
 * @deprecated Use OutputPaths.FILES instead
 */
export const DefaultOutputs = OutputPaths.FILES;
