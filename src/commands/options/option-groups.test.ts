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

/* eslint-disable max-lines-per-function */
import { OptionGroups } from './option-groups';
import { PathOptions } from './path.options';
import { PinataOptions } from './pinata.options';
import { RateLimitOptions } from './rate-limit.options';

describe('OptionGroups', () => {
  describe('fileProcessing', () => {
    it('should return file processing options without default output', () => {
      const result = OptionGroups.fileProcessing();
      expect(result).toEqual([PathOptions.folder, PathOptions.createOutput()]);
    });

    it('should return file processing options with default output', () => {
      const outputDefault = 'output.json';
      const result = OptionGroups.fileProcessing(outputDefault);
      expect(result).toEqual([PathOptions.folder, PathOptions.createOutput(outputDefault)]);
    });
  });

  describe('uploadFiles', () => {
    it('should return upload files options without default output', () => {
      const result = OptionGroups.uploadFiles();
      expect(result).toEqual([
        PathOptions.folder,
        PathOptions.createOutput(),
        RateLimitOptions.concurrentUploads,
        RateLimitOptions.minTime,
      ]);
    });

    it('should return upload files options with default output', () => {
      const outputDefault = 'output.json';
      const result = OptionGroups.uploadFiles(outputDefault);
      expect(result).toEqual([
        PathOptions.folder,
        PathOptions.createOutput(outputDefault),
        RateLimitOptions.concurrentUploads,
        RateLimitOptions.minTime,
      ]);
    });
  });

  describe('uploadFolder', () => {
    it('should return upload folder options without default output', () => {
      const result = OptionGroups.uploadFolder();
      expect(result).toEqual([PathOptions.metadataFolder, PathOptions.createOutput(), PinataOptions.displayName]);
    });

    it('should return upload folder options with default output', () => {
      const outputDefault = 'output.json';
      const result = OptionGroups.uploadFolder(outputDefault);
      expect(result).toEqual([
        PathOptions.metadataFolder,
        PathOptions.createOutput(outputDefault),
        PinataOptions.displayName,
      ]);
    });
  });

  describe('batchProcessing', () => {
    it('should return batch processing options without default output', () => {
      const result = OptionGroups.batchProcessing();
      expect(result).toEqual([PathOptions.folder, PathOptions.createOutput(), RateLimitOptions.concurrent]);
    });

    it('should return batch processing options with default output', () => {
      const outputDefault = 'output.json';
      const result = OptionGroups.batchProcessing(outputDefault);
      expect(result).toEqual([
        PathOptions.folder,
        PathOptions.createOutput(outputDefault),
        RateLimitOptions.concurrent,
      ]);
    });
  });

  describe('hashCalculation', () => {
    it('should return hash calculation options without default output', () => {
      const result = OptionGroups.hashCalculation();
      expect(result).toEqual([
        PathOptions.folder,
        PathOptions.createOutput(),
        PathOptions.finalOutput,
        RateLimitOptions.concurrent,
      ]);
    });

    it('should return hash calculation options with default output', () => {
      const outputDefault = 'output.json';
      const result = OptionGroups.hashCalculation(outputDefault);
      expect(result).toEqual([
        PathOptions.folder,
        PathOptions.createOutput(outputDefault),
        PathOptions.finalOutput,
        RateLimitOptions.concurrent,
      ]);
    });
  });

  describe('download', () => {
    it('should return download options without default output', () => {
      const result = OptionGroups.download();
      expect(result).toEqual([PathOptions.createOutput(), PinataOptions.status]);
    });

    it('should return download options with default output', () => {
      const outputDefault = 'output.json';
      const result = OptionGroups.download(outputDefault);
      expect(result).toEqual([PathOptions.createOutput(outputDefault), PinataOptions.status]);
    });
  });
});
