/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines-per-function */
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

import {
  isEmptyArray,
  isEmptyObject,
  isFailure,
  isNonEmptyArray,
  isNonEmptyString,
  isNotNullOrUndefined,
  isNullOrUndefined,
  isNumberInRange,
  isPositiveNumber,
  isSuccess,
  isValidNumber,
} from './guards';

/**
 * Helper function to create parameterized tests for type guards
 */
function createGuardTests(guardFunction: (value: any) => boolean, testCases: Array<[any, boolean, string]>): void {
  it.each(testCases)('should return %p for %s', (...args) => {
    const [value, expected] = args;
    expect(guardFunction(value)).toBe(expected);
  });
}

describe('Type Guards', () => {
  describe('isNullOrUndefined', () => {
    createGuardTests(isNullOrUndefined, [
      [null, true, 'null'],
      [undefined, true, 'undefined'],
      ['', false, 'empty string'],
      [0, false, 'zero'],
      [false, false, 'false boolean'],
      [[], false, 'empty array'],
      [{}, false, 'empty object'],
      ['hello', false, 'non-empty string'],
      [42, false, 'positive number'],
      [true, false, 'true boolean'],
    ]);
  });

  describe('isNotNullOrUndefined', () => {
    createGuardTests(isNotNullOrUndefined, [
      [null, false, 'null'],
      [undefined, false, 'undefined'],
      ['', true, 'empty string'],
      [0, true, 'zero'],
      [false, true, 'false boolean'],
      [[], true, 'empty array'],
      [{}, true, 'empty object'],
      ['hello', true, 'non-empty string'],
      [42, true, 'positive number'],
      [true, true, 'true boolean'],
    ]);
  });

  describe('isNonEmptyString', () => {
    createGuardTests(isNonEmptyString, [
      ['hello', true, 'non-empty string'],
      ['a', true, 'single character'],
      ['  test  ', true, 'string with whitespace'],
      ['', false, 'empty string'],
      ['   ', false, 'whitespace only'],
      [null, false, 'null'],
      [undefined, false, 'undefined'],
      [123, false, 'number'],
      [[], false, 'array'],
      [{}, false, 'object'],
    ]);
  });

  describe('isEmptyArray', () => {
    createGuardTests(isEmptyArray, [
      [[], true, 'empty array'],
      [[1], false, 'non-empty array'],
      ['[]', false, 'string'],
      [null, false, 'null'],
      [undefined, false, 'undefined'],
      [{}, false, 'object'],
    ]);
  });

  describe('isNonEmptyArray', () => {
    createGuardTests(isNonEmptyArray, [
      [[1, 2, 3], true, 'array with multiple elements'],
      [['a'], true, 'array with single element'],
      [[], false, 'empty array'],
      [null, false, 'null'],
      ['array', false, 'string'],
      [undefined, false, 'undefined'],
      [{}, false, 'object'],
    ]);
  });

  describe('isEmptyObject', () => {
    createGuardTests(isEmptyObject, [
      [{}, true, 'empty object'],
      [{ a: 1 }, false, 'non-empty object'],
      [[], false, 'array'],
      [null, false, 'null'],
      [undefined, false, 'undefined'],
      ['{}', false, 'string'],
    ]);
  });

  describe('isValidNumber', () => {
    createGuardTests(isValidNumber, [
      [1, true, 'positive integer'],
      [0, true, 'zero'],
      [-1, true, 'negative integer'],
      [1.5, true, 'decimal number'],
      [NaN, false, 'NaN'],
      [Infinity, false, 'Infinity'],
      [-Infinity, false, 'negative Infinity'],
      ['1', false, 'string number'],
      [null, false, 'null'],
      [undefined, false, 'undefined'],
    ]);
  });

  describe('isPositiveNumber', () => {
    createGuardTests(isPositiveNumber, [
      [1, true, 'positive integer'],
      [0.1, true, 'positive decimal'],
      [100, true, 'large positive number'],
      [0, false, 'zero'],
      [-1, false, 'negative integer'],
      [-0.5, false, 'negative decimal'],
      [NaN, false, 'NaN'],
      [Infinity, false, 'Infinity'],
      ['1', false, 'string number'],
      [null, false, 'null'],
      [undefined, false, 'undefined'],
    ]);
  });

  describe('isNumberInRange', () => {
    it.each([
      [5, 1, 10, true, 'number within range'],
      [1, 1, 10, true, 'number at minimum'],
      [10, 1, 10, true, 'number at maximum'],
      [5.5, 1, 10, true, 'decimal within range'],
      [0, 1, 10, false, 'number below range'],
      [11, 1, 10, false, 'number above range'],
      [-1, 1, 10, false, 'negative number'],
      [NaN, 1, 10, false, 'NaN'],
    ])('should return %p for %s', (...args) => {
      const [value, min, max, expected] = args;
      expect(isNumberInRange(value, min, max)).toBe(expected);
    });
  });

  describe('result type guards', () => {
    createGuardTests(isSuccess, [
      [{ success: true, data: 'test' }, true, 'success result'],
      [{ success: true, data: null }, true, 'success with null data'],
      [{ success: true, data: undefined }, true, 'success with undefined data'],
      [{ success: false, error: 'error' }, false, 'failure result'],
      [{ success: false, error: null }, false, 'failure with null error'],
      [null, false, 'null'],
      [undefined, false, 'undefined'],
      [{}, false, 'empty object'],
    ]);

    createGuardTests(isFailure, [
      [{ success: false, error: 'error' }, true, 'failure result'],
      [{ success: false, error: null }, true, 'failure with null error'],
      [{ success: true, data: 'test' }, false, 'success result'],
      [null, false, 'null'],
      [undefined, false, 'undefined'],
      [{}, false, 'empty object'],
    ]);
  });
});
