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

import axios from 'axios';
import * as os from 'os';

import { HealthCheckResult, HealthStatus, SystemSnapshot } from '../types';
import { FileUtils } from '../utils/file.utils';
import { MetricsCollector } from './metrics.collector';
import { StructuredLogger } from './structured.logger';

/**
 * Health monitor for system and service health checks
 */
export class HealthMonitor {
  private readonly logger: StructuredLogger;
  private readonly metricsCollector: MetricsCollector;

  constructor() {
    this.logger = new StructuredLogger('HealthMonitor');
    this.metricsCollector = MetricsCollector.getInstance();
  }

  /**
   * Check Pinata API health
   * @param apiKey - Pinata API key
   * @param apiSecret - Pinata API secret
   * @return Health check result
   */
  public async checkPinataHealth(apiKey: string, apiSecret: string): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Simple API call to test Pinata connectivity
      const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
        headers: {
          pinata_api_key: apiKey,
          pinata_secret_api_key: apiSecret,
        },
        timeout: 10000, // 10 second timeout
      });

      const responseTime = Date.now() - startTime;

      const result: HealthCheckResult = {
        service: 'pinata-api',
        status: response.status === 200 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
        timestamp: new Date().toISOString(),
        responseTime,
        details: {
          statusCode: response.status,
          authenticated: response.data?.message === 'Congratulations! You are communicating with the Pinata API!',
        },
      };

      this.metricsCollector.recordHealthCheck(result);
      return result;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      const result: HealthCheckResult = {
        service: 'pinata-api',
        status: HealthStatus.UNHEALTHY,
        timestamp: new Date().toISOString(),
        responseTime,
        error: error.message,
        details: {
          errorCode: error.code,
          statusCode: error.response?.status,
        },
      };

      this.metricsCollector.recordHealthCheck(result);
      return result;
    }
  }

  /**
   * Check system resources health
   * @return Health check result
   */
  public async checkSystemHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const snapshot = await this.captureSystemSnapshot();
      const responseTime = this.elapsedSince(startTime);
      const status = this.determineSystemStatus(snapshot);
      const result = this.buildSystemHealthResult(snapshot, status, responseTime);

      this.metricsCollector.recordHealthCheck(result);
      return result;
    } catch (error: any) {
      return this.handleSystemHealthFailure(error, startTime);
    }
  }

  /**
   * Collects system metrics required for health evaluation.
   * @returns Snapshot of system resource metrics.
   */
  private async captureSystemSnapshot(): Promise<SystemSnapshot> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;

    return {
      totalMemory,
      freeMemory,
      memoryUsagePercent,
      loadAverage: os.loadavg(),
      cpuCount: os.cpus().length,
      diskSpaceAvailable: await this.hasDiskAccess(),
    };
  }

  /**
   * Determines whether the process can read and write to the current working directory.
   * @returns True when disk space appears accessible.
   */
  private async hasDiskAccess(): Promise<boolean> {
    try {
      // eslint-disable-next-line no-bitwise
      await FileUtils.access(process.cwd(), FileUtils.constants.R_OK | FileUtils.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Evaluates system status from captured metrics.
   * @param snapshot - System metrics snapshot.
   * @returns Derived health status.
   */
  private determineSystemStatus(snapshot: SystemSnapshot): HealthStatus {
    if (snapshot.memoryUsagePercent > 95 || !snapshot.diskSpaceAvailable) {
      return HealthStatus.UNHEALTHY;
    }

    if (snapshot.memoryUsagePercent > 90 || snapshot.loadAverage[0] > snapshot.cpuCount * 2) {
      return HealthStatus.DEGRADED;
    }

    return HealthStatus.HEALTHY;
  }

  /**
   * Builds the detailed payload for a successful system health result.
   * @param snapshot - System metrics snapshot.
   * @param status - Derived health status.
   * @param responseTime - Elapsed time in milliseconds.
   * @returns Constructed health check result.
   */
  private buildSystemHealthResult(
    snapshot: SystemSnapshot,
    status: HealthStatus,
    responseTime: number
  ): HealthCheckResult {
    return {
      service: 'system-resources',
      status,
      timestamp: new Date().toISOString(),
      responseTime,
      details: {
        memoryUsagePercent: Math.round(snapshot.memoryUsagePercent * 100) / 100,
        totalMemoryMB: Math.round(snapshot.totalMemory / 1024 / 1024),
        freeMemoryMB: Math.round(snapshot.freeMemory / 1024 / 1024),
        loadAverage: snapshot.loadAverage.map(load => Math.round(load * 100) / 100),
        cpuCount: snapshot.cpuCount,
        diskSpaceAvailable: snapshot.diskSpaceAvailable,
        uptime: os.uptime(),
      },
    };
  }

  /**
   * Handles failures that occur during system health collection.
   * @param error - Error thrown while collecting metrics.
   * @param startTime - Start time stamp for duration calculation.
   * @returns Health check result indicating failure.
   */
  private handleSystemHealthFailure(error: any, startTime: number): HealthCheckResult {
    const responseTime = this.elapsedSince(startTime);

    const result: HealthCheckResult = {
      service: 'system-resources',
      status: HealthStatus.UNHEALTHY,
      timestamp: new Date().toISOString(),
      responseTime,
      error: error.message,
    };

    this.metricsCollector.recordHealthCheck(result);
    return result;
  }

  /**
   * Calculates elapsed time from the provided start timestamp.
   * @param startTime - Milliseconds timestamp captured at start of operation.
   */
  private elapsedSince(startTime: number): number {
    return Date.now() - startTime;
  }

  /**
   * Check file system access health
   * @param testPath - Path to test read/write access (default: './output')
   * @return Health check result
   */
  public async checkFileSystemHealth(testPath: string = './output'): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Ensure output directory exists and is writable
      await FileUtils.ensureDir(testPath);

      // Test write access
      const testFile = `${testPath}/.health-check-${Date.now()}`;
      await FileUtils.writeFile(testFile, 'health check test');
      await FileUtils.remove(testFile);

      const responseTime = Date.now() - startTime;

      const result: HealthCheckResult = {
        service: 'file-system',
        status: HealthStatus.HEALTHY,
        timestamp: new Date().toISOString(),
        responseTime,
        details: {
          testPath,
          writable: true,
          readable: true,
        },
      };

      this.metricsCollector.recordHealthCheck(result);
      return result;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      const result: HealthCheckResult = {
        service: 'file-system',
        status: HealthStatus.UNHEALTHY,
        timestamp: new Date().toISOString(),
        responseTime,
        error: error.message,
        details: {
          testPath,
          writable: false,
        },
      };

      this.metricsCollector.recordHealthCheck(result);
      return result;
    }
  }

  /**
   * Run comprehensive health check
   * @param config - Optional configuration for external services
   * @returns Aggregated health check results
   * Example config:
   * {
   *   pinataApiKey: 'your-pinata-api-key',
   *   pinataApiSecret: 'your-pinata-api-secret',
   *   testPath: './output'
   * }
   */
  public async runHealthCheck(config?: {
    pinataApiKey?: string;
    pinataApiSecret?: string;
    testPath?: string;
  }): Promise<{
    overall: HealthStatus;
    checks: HealthCheckResult[];
    timestamp: string;
  }> {
    this.logger.info('Starting comprehensive health check');

    const checks: HealthCheckResult[] = [];

    // Always check system and file system
    checks.push(await this.checkSystemHealth());
    checks.push(await this.checkFileSystemHealth(config?.testPath));

    // Check Pinata if credentials provided
    if (config?.pinataApiKey && config?.pinataApiSecret) {
      checks.push(await this.checkPinataHealth(config.pinataApiKey, config.pinataApiSecret));
    }

    // Determine overall status
    const unhealthyCount = checks.filter(c => c.status === HealthStatus.UNHEALTHY).length;
    const degradedCount = checks.filter(c => c.status === HealthStatus.DEGRADED).length;

    let overall = HealthStatus.HEALTHY;
    if (unhealthyCount > 0) {
      overall = HealthStatus.UNHEALTHY;
    } else if (degradedCount > 0) {
      overall = HealthStatus.DEGRADED;
    }

    const result = {
      overall,
      checks,
      timestamp: new Date().toISOString(),
    };

    this.logger.info('Health check completed', {
      overall,
      totalChecks: checks.length,
      healthyChecks: checks.filter(c => c.status === HealthStatus.HEALTHY).length,
      degradedChecks: degradedCount,
      unhealthyChecks: unhealthyCount,
    });

    return result;
  }
}
