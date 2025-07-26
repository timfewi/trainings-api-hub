// packages/dummy-api/src/routes/orderRoutes.ts

import { Router, Request, Response } from 'express';
import { DataService } from '../services/DataService';
import { ApiError } from '../middleware/errorHandler';
import { Address } from '@trainings-api-hub/shared';

interface CreateOrderRequest {
  shippingAddress: Address;
  billingAddress: Address;
}

/**
 * Create order routes with data service dependency
 */
export function orderRoutes(dataService: DataService): Router {
  const router = Router();

  /**
   * GET /orders - Get all orders
   */
  router.get('/', (req: Request, res: Response) => {
    try {
      const orders = dataService.getOrders();

      res.json({
        success: true,
        data: orders,
        timestamp: new Date().toISOString(),
        total: orders.length,
      });
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch orders');
    }
  });

  /**
   * GET /orders/:id - Get order by ID
   */
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id || id.trim().length === 0) {
        throw new ApiError(400, 'Order ID is required');
      }
      const order = dataService.getOrderById(id);

      if (!order) {
        throw new ApiError(404, 'Order not found');
      }

      res.json({
        success: true,
        data: order,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to fetch order');
    }
  });

  /**
   * POST /orders - Create new order from cart
   */
  router.post('/', (req: Request<object, object, CreateOrderRequest>, res: Response) => {
    try {
      const { shippingAddress, billingAddress } = req.body;

      if (!shippingAddress || !billingAddress) {
        throw new ApiError(400, 'Shipping and billing addresses are required');
      }

      const cart = dataService.getCart();
      if (cart.items.length === 0) {
        throw new ApiError(400, 'Cannot create order with empty cart');
      }

      const order = dataService.createOrder(shippingAddress, billingAddress);

      res.status(201).json({
        success: true,
        data: order,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to create order');
    }
  });

  return router;
}
