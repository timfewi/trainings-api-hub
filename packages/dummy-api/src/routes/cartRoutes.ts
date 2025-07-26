// packages/dummy-api/src/routes/cartRoutes.ts

import { Router, Request, Response } from 'express';
import { DataService } from '../services/DataService';
import { ApiError } from '../middleware/errorHandler';

interface AddToCartRequest {
  productId: string;
  quantity: number;
}

interface UpdateCartItemRequest {
  quantity: number;
}

/**
 * Create cart routes with data service dependency
 */
export function cartRoutes(dataService: DataService): Router {
  const router = Router();

  /**
   * GET /cart - Get current cart
   */
  router.get('/', (req: Request, res: Response) => {
    try {
      const cart = dataService.getCart();

      res.json({
        success: true,
        data: cart,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch cart');
    }
  });

  /**
   * POST /cart/items - Add item to cart
   */
  router.post('/items', (req: Request<object, object, AddToCartRequest>, res: Response) => {
    try {
      const { productId, quantity } = req.body;

      if (!productId || quantity <= 0) {
        throw new ApiError(400, 'Invalid product ID or quantity');
      }

      const cartItem = dataService.addToCart(productId, quantity);

      if (!cartItem) {
        throw new ApiError(404, 'Product not found');
      }

      res.status(201).json({
        success: true,
        data: cartItem,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to add item to cart');
    }
  });

  /**
   * PUT /cart/items/:productId - Update cart item quantity
   */
  router.put(
    '/items/:productId',
    (req: Request<{ productId: string }, object, UpdateCartItemRequest>, res: Response) => {
      try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (quantity < 0) {
          throw new ApiError(400, 'Quantity cannot be negative');
        }

        const cartItem = dataService.updateCartItem(productId, quantity);

        if (!cartItem) {
          throw new ApiError(404, 'Cart item not found');
        }

        res.json({
          success: true,
          data: cartItem,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError(500, 'Failed to update cart item');
      }
    }
  );

  /**
   * DELETE /cart/items/:productId - Remove item from cart
   */
  router.delete('/items/:productId', (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const removedItem = dataService.removeFromCart(productId);

      if (!removedItem) {
        throw new ApiError(404, 'Cart item not found');
      }

      res.json({
        success: true,
        data: removedItem,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to remove cart item');
    }
  });

  /**
   * DELETE /cart/clear - Clear all items from cart
   */
  router.delete('/clear', (req: Request, res: Response) => {
    try {
      dataService.clearCart();

      res.json({
        success: true,
        message: 'Cart cleared successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      throw new ApiError(500, 'Failed to clear cart');
    }
  });

  return router;
}
