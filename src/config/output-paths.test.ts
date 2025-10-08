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

import { OutputPaths, DefaultOutputs } from './output-paths';

describe('OutputPaths', () => {
  test('BASE_DIR should be "./output"', () => {
    expect(OutputPaths.BASE_DIR).toBe('./output');
  });

  test('FILES should contain expected paths', () => {
    expect(OutputPaths.FILES).toEqual({
      fileHashes: './output/file-hashes.json',
      fileCids: './output/file-cids.json',
      uploadedFiles: './output/uploaded-files.json',
      folderCid: './output/folder-cid.json',
      downloadedCids: './output/downloaded-cids.json',
      hashOfHashes: './output/file-hashOfHashes.json',
    });
  });

  test('createPath should generate correct path', () => {
    expect(OutputPaths.createPath('test.json')).toBe('./output/test.json');
    expect(OutputPaths.createPath('another-file.txt')).toBe('./output/another-file.txt');
  });
});

describe('DefaultOutputs (legacy)', () => {
  test('should be equal to OutputPaths.FILES', () => {
    expect(DefaultOutputs).toEqual(OutputPaths.FILES);
  });
});
