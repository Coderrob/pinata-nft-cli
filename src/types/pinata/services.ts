/* eslint-disable @typescript-eslint/no-explicit-any */
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

import { IPinListFilter, IPinListResponse } from './models';

/**
 * Service interface for Pinata IPFS operations
 */
export interface IPinataService {
  uploadFile(filePath: string, fileName: string): Promise<string>;
  uploadFolder(folderPath: string, folderName: string): Promise<string>;
  listPins(filter?: IPinListFilter): Promise<IPinListResponse>;
}

export interface IPinataClient {
  pinFileToIPFS(stream: any, options?: any): Promise<any>;
  pinList(filter?: IPinListFilter): Promise<IPinListResponse>;
}
