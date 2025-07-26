// packages/main-backend/src/services/DockerService.ts

/**
 * This module provides functionality for managing Docker containers that host API instances.
 * It includes the `DockerService` class, which encapsulates operations such as creating,
 * starting, stopping, and monitoring containers. Additionally, it exports a singleton
 * instance of the service (`dockerService`) for use throughout the application.
 */
import Docker from 'dockerode';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';

/**
 * Interface for container information returned by Docker operations
 */
export interface ContainerInfo {
  containerId: string;
  containerName: string;
  port: number;
  url: string;
  status: string;
}

/**
 * Interface for container status information
 */
export interface ContainerStatus {
  id: string;
  status: string;
  running: boolean;
  port?: number | undefined;
  error?: string;
}

/**
 * Configuration for creating new containers
 */
export interface CreateContainerConfig {
  userId: string;
  dataTheme?: string;
  productCount?: number;
  enableCors?: boolean;
}

/**
 * DockerService is responsible for managing Docker containers that host API instances.
 * 
 * This service provides methods to initialize the Docker connection, create and manage
 * containers, and retrieve their statuses. It is designed to work with a predefined
 * Docker image and manages container ports dynamically within a specified range.
 * 
 * Key Methods:
 * - `initialize()`: Verifies the connection to the Docker daemon.
 * - `createContainer(config: CreateContainerConfig)`: Creates a new container based on the provided configuration.
 * - `getContainerStatus(containerId: string)`: Retrieves the status of a specific container.
 * - `stopContainer(containerId: string)`: Stops and removes a running container.
 * 
 * Usage:
 * - Import the singleton instance `dockerService` to interact with Docker containers.
 * - Ensure Docker is running and accessible before using this service.
 */
export class DockerService {
  private docker: Docker;
  private readonly MIN_PORT = 3001;
  private readonly MAX_PORT = 4000;
  private readonly DUMMY_API_IMAGE = 'timfewi/dummy-api:latest';
  private readonly CONTAINER_PORT = 3000;

  constructor() {
    this.docker = new Docker({
      socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock',
    });
  }

  /**
   * Initialize Docker service and verify connection
   */
  async initialize(): Promise<void> {
    try {
      await this.docker.ping();
      logger.info('Docker service initialized successfully');
    } catch (error) {
      logger.error('Failed to connect to Docker daemon:', error);
      throw new Error('Docker daemon is not available');
    }
  }

  /**
   * Create a new API instance container
   */
  async createContainer(config: CreateContainerConfig): Promise<ContainerInfo> {
    try {
      logger.info(`Creating container for user ${config.userId}`);

      // Allocate available port
      const port = await this.allocatePort();

      // Generate container name
      const timestamp = Date.now();
      const containerName = `api-instance-${config.userId}-${timestamp}`;

      // Container configuration
      const containerConfig = {
        Image: this.DUMMY_API_IMAGE,
        name: containerName,
        Env: [
          'NODE_ENV=production',
          `PORT=${this.CONTAINER_PORT}`,
          `DATA_THEME=${config.dataTheme || 'electronics'}`,
          `PRODUCT_COUNT=${config.productCount || 50}`,
          `CORS_ORIGIN=${config.enableCors ? '*' : 'http://localhost:4200'}`,
        ],
        ExposedPorts: {
          [`${this.CONTAINER_PORT}/tcp`]: {},
        },
        HostConfig: {
          PortBindings: {
            [`${this.CONTAINER_PORT}/tcp`]: [{ HostPort: port.toString() }],
          },
          RestartPolicy: {
            Name: 'unless-stopped',
          },
          Memory: 256 * 1024 * 1024, // 256MB memory limit
          CpuShares: 512, // CPU limit
        },
        Healthcheck: {
          Test: [`CMD`, `curl`, `-f`, `http://localhost:${this.CONTAINER_PORT}/health`],
          Interval: 30000000000, // 30 seconds in nanoseconds
          Timeout: 10000000000, // 10 seconds in nanoseconds
          Retries: 3,
          StartPeriod: 30000000000, // 30 seconds in nanoseconds
        },
        Labels: {
          'api-hub.user-id': config.userId,
          'api-hub.service': 'dummy-api',
          'api-hub.created': new Date().toISOString(),
        },
      };

      // Create container
      const container = await this.docker.createContainer(containerConfig);
      const containerId = container.id;

      logger.info(`Container created: ${containerId} (${containerName}) on port ${port}`);

      // Generate URL
      const baseUrl = process.env.BASE_URL || 'http://localhost';
      const url = `${baseUrl}:${port}`;

      return {
        containerId,
        containerName,
        port,
        url,
        status: 'created',
      };
    } catch (error) {
      logger.error('Failed to create container:', error);
      throw new Error(
        `Container creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Start a container
   */
  async startContainer(containerId: string): Promise<void> {
    try {
      logger.info(`Starting container: ${containerId}`);

      const container = this.docker.getContainer(containerId);
      await container.start();

      logger.info(`Container started successfully: ${containerId}`);
    } catch (error) {
      logger.error(`Failed to start container ${containerId}:`, error);
      throw new Error(
        `Container start failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Stop a container
   */
  async stopContainer(containerId: string): Promise<void> {
    try {
      logger.info(`Stopping container: ${containerId}`);

      const container = this.docker.getContainer(containerId);
      await container.stop({ t: 10 }); // 10 second grace period

      logger.info(`Container stopped successfully: ${containerId}`);
    } catch (error) {
      logger.error(`Failed to stop container ${containerId}:`, error);
      throw new Error(
        `Container stop failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Remove a container
   */
  async removeContainer(containerId: string): Promise<void> {
    try {
      logger.info(`Removing container: ${containerId}`);

      const container = this.docker.getContainer(containerId);

      // Stop container first if it's running
      try {
        const containerInfo = await container.inspect();
        if (containerInfo.State.Running) {
          await this.stopContainer(containerId);
        }
      } catch (inspectError) {
        // Container might not exist, continue with removal
        logger.warn(`Could not inspect container ${containerId} before removal:`, inspectError);
      }

      // Remove container
      await container.remove({ force: true });

      logger.info(`Container removed successfully: ${containerId}`);
    } catch (error) {
      logger.error(`Failed to remove container ${containerId}:`, error);
      throw new Error(
        `Container removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get container status
   */
  async getContainerStatus(containerId: string): Promise<ContainerStatus> {
    try {
      const container = this.docker.getContainer(containerId);
      const containerInfo = await container.inspect();

      // Extract port information
      let port: number | undefined;
      if (containerInfo.NetworkSettings?.Ports) {
        const portBinding = containerInfo.NetworkSettings.Ports[`${this.CONTAINER_PORT}/tcp`];
        if (portBinding && portBinding.length > 0 && portBinding[0]) {
          port = parseInt(portBinding[0].HostPort, 10);
        }
      }

      return {
        id: containerId,
        status: containerInfo.State.Status,
        running: containerInfo.State.Running,
        port,
      };
    } catch (error) {
      logger.error(`Failed to get container status ${containerId}:`, error);
      return {
        id: containerId,
        status: 'error',
        running: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Allocate an available port from the allowed range
   */
  private async allocatePort(): Promise<number> {
    try {
      // Get all used ports from database
      const usedInstances = await prisma.apiInstance.findMany({
        where: {
          status: {
            in: ['CREATING', 'RUNNING'],
          },
        },
        select: {
          port: true,
        },
      });

      const usedPorts = new Set(usedInstances.map((instance: { port: number }) => instance.port));

      // Find first available port
      for (let port = this.MIN_PORT; port <= this.MAX_PORT; port++) {
        if (!usedPorts.has(port)) {
          // Double-check port is not in use by checking actual Docker containers
          const isPortInUse = await this.isPortInUse(port);
          if (!isPortInUse) {
            logger.info(`Allocated port: ${port}`);
            return port;
          }
        }
      }

      throw new Error(`No available ports in range ${this.MIN_PORT}-${this.MAX_PORT}`);
    } catch (error) {
      logger.error('Failed to allocate port:', error);
      throw new Error(
        `Port allocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if a port is currently in use by Docker containers
   */
  private async isPortInUse(port: number): Promise<boolean> {
    try {
      const containers = await this.docker.listContainers({ all: true });

      for (const containerInfo of containers) {
        if (containerInfo.Ports) {
          for (const portInfo of containerInfo.Ports) {
            if (portInfo.PublicPort === port) {
              return true;
            }
          }
        }
      }

      return false;
    } catch (error) {
      logger.error('Failed to check port usage:', error);
      return false; // Assume port is available if we can't check
    }
  }

  /**
   * Cleanup orphaned containers (containers without database records)
   */
  async cleanupOrphanedContainers(): Promise<void> {
    try {
      logger.info('Starting cleanup of orphaned containers');

      // Get all containers with our labels
      const containers = await this.docker.listContainers({
        all: true,
        filters: {
          label: ['api-hub.service=dummy-api'],
        },
      });

      // Get all container IDs from database
      const dbInstances = await prisma.apiInstance.findMany({
        select: { containerId: true },
      });
      const dbContainerIds = new Set(
        dbInstances.map((instance: { containerId: string }) => instance.containerId)
      );

      // Remove containers not in database
      for (const containerInfo of containers) {
        if (!dbContainerIds.has(containerInfo.Id)) {
          logger.info(`Removing orphaned container: ${containerInfo.Id}`);
          try {
            await this.removeContainer(containerInfo.Id);
          } catch (error) {
            logger.error(`Failed to remove orphaned container ${containerInfo.Id}:`, error);
          }
        }
      }

      logger.info('Orphaned container cleanup completed');
    } catch (error) {
      logger.error('Failed to cleanup orphaned containers:', error);
    }
  }

  /**
   * Get container logs
   */
  async getContainerLogs(containerId: string, tail: number = 100): Promise<string> {
    try {
      const container = this.docker.getContainer(containerId);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail,
        timestamps: true,
      });

      return logs.toString();
    } catch (error) {
      logger.error(`Failed to get logs for container ${containerId}:`, error);
      throw new Error(
        `Failed to get container logs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

// Export singleton instance
export const dockerService = new DockerService();
