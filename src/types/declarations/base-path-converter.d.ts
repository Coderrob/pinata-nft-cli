/**
 * Type declarations for base-path-converter module
 * This module converts absolute paths to relative paths based on a base path
 */
declare module 'base-path-converter' {
  /**
   * Converts an absolute file path to a relative path based on the provided base path
   * @param basePath - The base path to make the file path relative to
   * @param filePath - The absolute file path to convert
   * @returns The relative path from basePath to filePath
   */
  function basePathConverter(basePath: string, filePath: string): string;
  export default basePathConverter;
}
