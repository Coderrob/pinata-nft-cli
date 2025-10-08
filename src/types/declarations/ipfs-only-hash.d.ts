/**
 * Type declarations for ipfs-only-hash
 * This package wraps ipfs-unixfs-importer to provide CID generation without storing blocks.
 */
declare module 'ipfs-only-hash' {
  /**
   * Options for CID generation
   */
  export interface Options {
    /**
     * CID version (0 or 1). Default: 0
     */
    cidVersion?: 0 | 1;
    /**
     * Only calculate the CID without storing blocks. Default: true
     */
    onlyHash?: boolean;
    /**
     * Hash function to use. Default: 'sha2-256'
     */
    hashAlg?: string;
    /**
     * Chunk size for splitting large files. Default: 262144
     */
    rawLeaves?: boolean;
  }

  /**
   * Generate an IPFS CID for the given content.
   * Uses ipfs-unixfs-importer under the hood with onlyHash=true.
   *
   * @param content - Content to hash (Buffer, Uint8Array, or string)
   * @param options - Optional configuration for CID generation
   * @returns Promise resolving to the CID string
   */
  export function of(content: Buffer | Uint8Array | string, options?: Options): Promise<string>;
}
