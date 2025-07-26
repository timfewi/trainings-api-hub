// packages/main-backend/src/routes/instanceRoutes.ts

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { dockerService } from '../services/DockerService';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/instances - Create new API instance
 */
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new ApiError('User authentication required', 401);
    }

    try {
      logger.info(`Creating new instance for user: ${req.user.id}`);

      // Initialize Docker service if not already done
      await dockerService.initialize();

      // Extract configuration from request body
      const { dataTheme, productCount, enableCors } = req.body;

      // Create container using Docker service
      const containerInfo = await dockerService.createContainer({
        userId: req.user.id,
        dataTheme: dataTheme || 'electronics',
        productCount: productCount || 50,
        enableCors: enableCors !== undefined ? enableCors : true,
      });

      // Save instance to database
      const instance = await prisma.apiInstance.create({
        data: {
          userId: req.user.id,
          containerId: containerInfo.containerId,
          containerName: containerInfo.containerName,
          url: containerInfo.url,
          port: containerInfo.port,
          status: 'CREATING',
        },
      });

      // Start the container
      await dockerService.startContainer(containerInfo.containerId);

      // Update status to running
      await prisma.apiInstance.update({
        where: { id: instance.id },
        data: { status: 'RUNNING' },
      });

      logger.info(`Instance created successfully: ${instance.id}`);

      res.status(201).json({
        success: true,
        data: {
          id: instance.id,
          containerId: instance.containerId,
          containerName: instance.containerName,
          url: instance.url,
          port: instance.port,
          status: 'RUNNING',
          createdAt: instance.createdAt,
          updatedAt: instance.updatedAt,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to create instance:', error);
      throw new ApiError(
        `Failed to create instance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  })
);

/**
 * GET /api/instances - List user's instances
 */
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new ApiError('User authentication required', 401);
    }

    try {
      logger.info(`Fetching instances for user: ${req.user.id}`);

      const instances = await prisma.apiInstance.findMany({
        where: {
          userId: req.user.id,
          stoppedAt: null, // Only return active instances
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Update status from Docker for each instance
      const instancesWithStatus = await Promise.all(
        instances.map(async instance => {
          try {
            const status = await dockerService.getContainerStatus(instance.containerId);
            return {
              id: instance.id,
              containerId: instance.containerId,
              containerName: instance.containerName,
              url: instance.url,
              port: instance.port,
              status: status.running ? 'RUNNING' : status.status.toUpperCase(),
              createdAt: instance.createdAt,
              updatedAt: instance.updatedAt,
            };
          } catch (error) {
            logger.warn(`Could not get status for container ${instance.containerId}:`, error);
            return {
              id: instance.id,
              containerId: instance.containerId,
              containerName: instance.containerName,
              url: instance.url,
              port: instance.port,
              status: 'ERROR',
              createdAt: instance.createdAt,
              updatedAt: instance.updatedAt,
            };
          }
        })
      );

      res.json({
        success: true,
        data: instancesWithStatus,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to fetch instances:', error);
      throw new ApiError(
        `Failed to fetch instances: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  })
);

/**
 * GET /api/instances/:id - Get specific instance
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new ApiError('User authentication required', 401);
    }

    const { id } = req.params;

    if (!id) {
      throw new ApiError('Instance ID is required', 400);
    }

    try {
      logger.info(`Fetching instance ${id} for user: ${req.user.id}`);

      const instance = await prisma.apiInstance.findFirst({
        where: {
          id: id,
          userId: req.user.id,
          stoppedAt: null,
        },
      });

      if (!instance) {
        throw new ApiError('Instance not found', 404);
      }

      // Get current status from Docker
      const status = await dockerService.getContainerStatus(instance.containerId);

      res.json({
        success: true,
        data: {
          id: instance.id,
          containerId: instance.containerId,
          containerName: instance.containerName,
          url: instance.url,
          port: instance.port,
          status: status.running ? 'RUNNING' : status.status.toUpperCase(),
          createdAt: instance.createdAt,
          updatedAt: instance.updatedAt,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Failed to fetch instance:', error);
      throw new ApiError(
        `Failed to fetch instance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  })
);

/**
 * DELETE /api/instances/:id - Delete instance
 */
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new ApiError('User authentication required', 401);
    }

    const { id } = req.params;

    if (!id) {
      throw new ApiError('Instance ID is required', 400);
    }

    try {
      logger.info(`Deleting instance ${id} for user: ${req.user.id}`);

      const instance = await prisma.apiInstance.findFirst({
        where: {
          id: id,
          userId: req.user.id,
          stoppedAt: null,
        },
      });

      if (!instance) {
        throw new ApiError('Instance not found', 404);
      }

      // Stop and remove container
      await dockerService.removeContainer(instance.containerId);

      // Soft delete in database (set stoppedAt)
      await prisma.apiInstance.update({
        where: { id: instance.id },
        data: {
          status: 'STOPPED',
          stoppedAt: new Date(),
        },
      });

      logger.info(`Instance deleted successfully: ${id}`);

      res.json({
        success: true,
        message: 'Instance deleted successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Failed to delete instance:', error);
      throw new ApiError(
        `Failed to delete instance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  })
);

/**
 * GET /api/instances/:id/logs - Get container logs
 */
router.get(
  '/:id/logs',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new ApiError('User authentication required', 401);
    }

    const { id } = req.params;
    const { tail } = req.query;

    if (!id) {
      throw new ApiError('Instance ID is required', 400);
    }

    try {
      const instance = await prisma.apiInstance.findFirst({
        where: {
          id: id,
          userId: req.user.id,
        },
      });

      if (!instance) {
        throw new ApiError('Instance not found', 404);
      }

      const logs = await dockerService.getContainerLogs(
        instance.containerId,
        tail ? parseInt(tail as string) : 100
      );

      res.json({
        success: true,
        data: {
          logs: logs,
          containerId: instance.containerId,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Failed to fetch logs:', error);
      throw new ApiError(
        `Failed to fetch logs: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  })
);

export { router as instanceRoutes };
