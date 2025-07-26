// packages/dummy-api/src/routes/userRoutes.ts

import { Router, Request, Response } from 'express';
import { DataService } from '../services/DataService';
import { ApiError } from '../middleware/errorHandler';

/**
 * Create user routes with data service dependency
 */
export function userRoutes(dataService: DataService): Router {
  const router = Router();

  /**
   * GET /users/:id - Get user by ID
   */
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = dataService.getUserById(id);

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      res.json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to fetch user');
    }
  });

  return router;
}
