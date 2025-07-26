// packages/dummy-api/src/index.ts

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { productRoutes } from './routes/productRoutes';
import { categoryRoutes } from './routes/categoryRoutes';
import { cartRoutes } from './routes/cartRoutes';
import { orderRoutes } from './routes/orderRoutes';
import { userRoutes } from './routes/userRoutes';
import { errorHandler } from './middleware/errorHandler';
import { DataService } from './services/DataService';

const PORT = process.env.PORT ?? 3001;
const API_VERSION = 'v1';

/**
 * Initialize the dummy e-commerce API server
 */
async function startServer(): Promise<void> {
  const app = express();

  // Initialize data service with fake data
  const dataService = new DataService();
  await dataService.initialize();

  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Logging middleware
  app.use(morgan('combined'));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: API_VERSION,
      endpoints: {
        products: '/products',
        categories: '/categories',
        cart: '/cart',
        orders: '/orders',
        users: '/users/:id',
      },
    });
  });

  // API routes
  app.use('/products', productRoutes(dataService));
  app.use('/categories', categoryRoutes(dataService));
  app.use('/cart', cartRoutes(dataService));
  app.use('/orders', orderRoutes(dataService));
  app.use('/users', userRoutes(dataService));

  // Error handling
  app.use(errorHandler);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      timestamp: new Date().toISOString(),
    });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Dummy API server running on port ${PORT}`);
    console.log(`📖 Health check: http://localhost:${PORT}/health`);
  });
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
