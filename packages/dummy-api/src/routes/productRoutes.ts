// packages/dummy-api/src/routes/productRoutes.ts

import { Router, Request, Response } from 'express';
import { DataService } from '../services/DataService';
import { ApiError } from '../middleware/errorHandler';

/**
 * Create product routes with data service dependency
 */
export function productRoutes(dataService: DataService): Router {
  const router = Router();

  /**
   * @swagger
   * /products:
   *   get:
   *     tags: [Products]
   *     summary: Get all products
   *     description: Retrieve all products with optional category filtering
   *     parameters:
   *       - in: query
   *         name: categoryId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter products by category ID
   *     responses:
   *       200:
   *         description: List of products retrieved successfully
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
   *                         $ref: '#/components/schemas/Product'
   *                     total:
   *                       type: integer
   *                       description: Total number of products
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  router.get('/', (req: Request, res: Response) => {
    try {
      const categoryId = req.query.categoryId as string | undefined;
      const products = dataService.getProducts(categoryId);

      res.json({
        success: true,
        data: products,
        timestamp: new Date().toISOString(),
        total: products.length,
      });
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch products');
    }
  });

  /**
   * @swagger
   * /products/{id}:
   *   get:
   *     tags: [Products]
   *     summary: Get product by ID
   *     description: Retrieve a specific product by its unique identifier
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Product unique identifier
   *     responses:
   *       200:
   *         description: Product retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Product'
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
        throw new ApiError(400, 'Product ID is required');
      }
      const product = dataService.getProductById(id);

      if (!product) {
        throw new ApiError(404, 'Product not found');
      }

      res.json({
        success: true,
        data: product,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to fetch product');
    }
  });

  /**
   * @swagger
   * /products/category/{categoryId}:
   *   get:
   *     tags: [Products]
   *     summary: Get products by category
   *     description: Retrieve all products belonging to a specific category
   *     parameters:
   *       - in: path
   *         name: categoryId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Category unique identifier
   *     responses:
   *       200:
   *         description: Products retrieved successfully
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
   *                         $ref: '#/components/schemas/Product'
   *                     category:
   *                       type: string
   *                       description: Category name
   *                     total:
   *                       type: integer
   *                       description: Total number of products in category
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  router.get('/category/:categoryId', (req: Request, res: Response) => {
    try {
      const { categoryId } = req.params;
      if (!categoryId || categoryId.trim().length === 0) {
        throw new ApiError(400, 'Category ID is required');
      }
      const category = dataService.getCategoryById(categoryId);

      if (!category) {
        throw new ApiError(404, 'Category not found');
      }

      const products = dataService.getProducts(categoryId);

      res.json({
        success: true,
        data: products,
        category: category.name,
        timestamp: new Date().toISOString(),
        total: products.length,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to fetch products by category');
    }
  });

  return router;
}
