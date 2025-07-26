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
   * GET /products - Get all products with optional category filter
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
   * GET /products/:id - Get product by ID
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
   * GET /products/category/:categoryId - Get products by category
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
