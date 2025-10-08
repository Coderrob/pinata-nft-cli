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
