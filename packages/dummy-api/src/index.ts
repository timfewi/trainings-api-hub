// packages/dummy-api/src/index.ts

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { productRoutes } from './routes/productRoutes';
import { categoryRoutes } from './routes/categoryRoutes';
import { cartRoutes } from './routes/cartRoutes';
import { orderRoutes } from './routes/orderRoutes';
import { userRoutes } from './routes/userRoutes';
import { errorHandler } from './middleware/errorHandler';
import { DataService } from './services/DataService';
import { loadConfig, validateConfig } from './config';
import { createSwaggerConfig } from './config/swagger';

const config = loadConfig();
validateConfig(config);

console.log(`🚀 Starting Dummy API Server`);
console.log(
  `📊 Configuration: ${JSON.stringify(
    {
      port: config.port,
      theme: config.dataTheme,
      productCount: config.productCount,
      categoryCount: config.categoryCount,
      environment: config.nodeEnv,
    },
    null,
    2
  )}`
);

const startTime = Date.now();

/**
 * Initialize the dummy e-commerce API server
 *
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check endpoint
 *     description: Returns the health status of the API and data generation statistics
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */
async function startServer(): Promise<void> {
  const app = express();

  // Initialize data service with configuration
  const dataService = new DataService(config);
  await dataService.initialize();

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: config.nodeEnv === 'production' ? undefined : false,
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
      credentials: true,
    })
  );

  // Logging middleware
  if (config.enableDetailedLogs) {
    app.use(morgan('combined'));
  } else {
    app.use(morgan('tiny'));
  }

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Swagger documentation
  const swaggerSpec = createSwaggerConfig(config);
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Dummy API Documentation',
    })
  );

  // Enhanced health check endpoint
  app.get('/health', (req, res) => {
    const uptime = (Date.now() - startTime) / 1000;
    const stats = dataService.getStats();

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: config.apiVersion,
      uptime,
      environment: config.nodeEnv,
      dataStatus: stats,
      endpoints: {
        products: '/products',
        categories: '/categories',
        cart: '/cart',
        orders: '/orders',
        users: '/users/:id',
        documentation: '/docs',
      },
    });
  });

  // API routes with version prefix
  const apiRouter = express.Router();
  apiRouter.use('/products', productRoutes(dataService));
  apiRouter.use('/categories', categoryRoutes(dataService));
  apiRouter.use('/cart', cartRoutes(dataService));
  apiRouter.use('/orders', orderRoutes(dataService));
  apiRouter.use('/users', userRoutes(dataService));

  app.use(`/api/${config.apiVersion}`, apiRouter);

  // Legacy routes (without version prefix) for backward compatibility
  app.use('/products', productRoutes(dataService));
  app.use('/categories', categoryRoutes(dataService));
  app.use('/cart', cartRoutes(dataService));
  app.use('/orders', orderRoutes(dataService));
  app.use('/users', userRoutes(dataService));

  // Root endpoint with API information
  app.get('/', (req, res) => {
    res.json({
      name: 'Dummy E-commerce API',
      version: config.apiVersion,
      description: 'A realistic dummy API for e-commerce training purposes',
      theme: config.dataTheme,
      endpoints: {
        health: '/health',
        documentation: '/docs',
        products: '/products',
        categories: '/categories',
        cart: '/cart',
        orders: '/orders',
        users: '/users/:id',
      },
      versioned: {
        products: `/api/${config.apiVersion}/products`,
        categories: `/api/${config.apiVersion}/categories`,
        cart: `/api/${config.apiVersion}/cart`,
        orders: `/api/${config.apiVersion}/orders`,
        users: `/api/${config.apiVersion}/users/:id`,
      },
    });
  });

  // Error handling middleware
  app.use(errorHandler);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
      timestamp: new Date().toISOString(),
      availableEndpoints: [
        'GET /',
        'GET /health',
        'GET /docs',
        'GET /products',
        'GET /categories',
        'GET /cart',
        'GET /orders',
        'GET /users/:id',
      ],
    });
  });

  const server = app.listen(config.port, () => {
    console.log(`🚀 Dummy API server running on port ${config.port}`);
    console.log(`📖 Health check: http://localhost:${config.port}/health`);
    console.log(`📚 API Documentation: http://localhost:${config.port}/docs`);
    console.log(`🎯 Data theme: ${config.dataTheme}`);
    console.log(
      `📦 Generated: ${dataService.getStats().productCount} products in ${dataService.getStats().categoryCount} categories`
    );
  });

  // Graceful shutdown
  const gracefulShutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

    server.close(error => {
      if (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }

      console.log('✅ Server closed successfully');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.log('⚠️  Forcing shutdown...');
      process.exit(1);
    }, 10000);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', error => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });
}

// Start the server
startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
