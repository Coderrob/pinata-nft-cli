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

import { PinStatus } from './enums';

/**
 * Response from Pinata upload operations
 */
export interface IPinataResponse {
  readonly IpfsHash: string;
  readonly PinSize: number;
  readonly Timestamp: string;
}

/**
 * Pin object from Pinata list response
 */
export interface IPinataPin {
  readonly id: string;
  readonly ipfs_pin_hash: string;
  readonly size: number;
  readonly user_id: string;
  readonly date_pinned: string;
  readonly date_unpinned?: string;
  readonly metadata: {
    readonly name?: string;
    readonly keyvalues?: Record<string, unknown>;
  };
  readonly regions: ReadonlyArray<{
    readonly regionId: string;
    readonly currentReplicationCount: number;
    readonly desiredReplicationCount: number;
  }>;
}

/**
 * Response from Pinata list pins API
 */
export interface IPinListResponse {
  readonly count: number;
  readonly rows: ReadonlyArray<IPinataPin>;
}

export interface IPinListFilter {
  status: PinStatus;
  pageOffset?: number;
  pageLimit?: number;
}

export interface IFileCheck {
  exists: boolean;
  ipfsHash?: string;
}
