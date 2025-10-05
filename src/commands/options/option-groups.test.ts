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
