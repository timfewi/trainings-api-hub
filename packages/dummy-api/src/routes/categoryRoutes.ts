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
   * @swagger
   * /categories:
   *   get:
   *     tags: [Categories]
   *     summary: Get all categories
   *     description: Retrieve all product categories available in the store
   *     responses:
   *       200:
   *         description: List of categories retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/ProductCategory'
   *                     total:
   *                       type: integer
   *                       description: Total number of categories
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
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
   * @swagger
   * /categories/{id}:
   *   get:
   *     tags: [Categories]
   *     summary: Get category by ID
   *     description: Retrieve a specific category by its unique identifier
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Category unique identifier
   *     responses:
   *       200:
   *         description: Category retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/ProductCategory'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id || id.trim().length === 0) {
        throw new ApiError(400, 'Category ID is required');
      }
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
