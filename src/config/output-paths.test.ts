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
