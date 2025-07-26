// packages/dummy-api/src/routes/categoryRoutes.ts

import { Router, Request, Response } from 'express';
import { DataService } from '../services/DataService';
import { ApiError } from '../middleware/errorHandler';

/**
 * Create category routes with data service dependency
 */
export function categoryRoutes(dataService: DataService): Router {
  const router = Router();

  /**
   * GET /categories - Get all categories
   */
  router.get('/', (req: Request, res: Response) => {
    try {
      const categories = dataService.getCategories();

      res.json({
        success: true,
        data: categories,
        timestamp: new Date().toISOString(),
        total: categories.length,
      });
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch categories');
    }
  });

  /**
   * GET /categories/:id - Get category by ID
   */
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const category = dataService.getCategoryById(id);

      if (!category) {
        throw new ApiError(404, 'Category not found');
      }

      res.json({
        success: true,
        data: category,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to fetch category');
    }
  });

  return router;
}
