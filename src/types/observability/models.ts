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

/**
 * Log levels for structured logging
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace',
}

/**
 * Log context interface for structured logging
 */
export interface LogContext {
  readonly requestId?: string;
  readonly userId?: string;
  readonly operation?: string;
  readonly duration?: number;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Structured log entry interface
 */
export interface LogEntry {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly context: string;
  readonly message: string;
  readonly data?: unknown;
  readonly logContext?: LogContext;
  readonly error?: Error;
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  readonly operation: string;
  readonly duration: number;
  readonly success: boolean;
  readonly itemsProcessed?: number;
  readonly errorCount?: number;
  readonly timestamp: string;
}

/**
 * Health check status
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  DEGRADED = 'degraded',
}

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  readonly status: HealthStatus;
  readonly service: string;
  readonly timestamp: string;
  readonly responseTime?: number;
  readonly details?: Record<string, unknown>;
  readonly error?: string;
}
