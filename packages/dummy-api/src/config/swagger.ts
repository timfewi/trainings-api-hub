// packages/dummy-api/src/config/swagger.ts

import swaggerJsdoc from 'swagger-jsdoc';
import { ApiConfig } from './index';

/**
 * Create Swagger configuration based on API config
 */
export function createSwaggerConfig(config: ApiConfig) {
  const options: swaggerJsdoc.Options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Dummy E-commerce API',
        version: config.apiVersion,
        description: `
          A dummy e-commerce API for training purposes with realistic sample data.
          
          **Data Theme**: ${config.dataTheme}
          **Generated Products**: ${config.productCount} per category
          **Generated Categories**: ${config.categoryCount}
          
          This API provides complete CRUD operations for:
          - Products and Categories
          - Shopping Cart management
          - Order processing
          - User information
          
          All data is generated using Faker.js and stored in memory.
        `,
        contact: {
          name: 'API Support',
          url: 'https://github.com/timfewi/trainings-api-hub',
          email: 'support@example.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: `http://localhost:${config.port}`,
          description: 'Development server',
        },
        {
          url: 'https://api.example.com',
          description: 'Production server',
        },
      ],
      components: {
        schemas: {
          Product: {
            type: 'object',
            required: ['id', 'name', 'price', 'categoryId'],
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'Product unique identifier',
              },
              name: {
                type: 'string',
                description: 'Product name',
              },
              description: {
                type: 'string',
                description: 'Product description',
              },
              price: {
                type: 'number',
                minimum: 0,
                description: 'Product price in USD',
              },
              categoryId: {
                type: 'string',
                format: 'uuid',
                description: 'Associated category ID',
              },
              category: {
                $ref: '#/components/schemas/ProductCategory',
              },
              imageUrl: {
                type: 'string',
                format: 'uri',
                description: 'Product image URL',
              },
              inStock: {
                type: 'boolean',
                description: 'Whether product is in stock',
              },
              stockQuantity: {
                type: 'integer',
                minimum: 0,
                description: 'Available stock quantity',
              },
              sku: {
                type: 'string',
                description: 'Stock Keeping Unit',
              },
              tags: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: 'Product tags',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Creation timestamp',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Last update timestamp',
              },
            },
          },
          ProductCategory: {
            type: 'object',
            required: ['id', 'name'],
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'Category unique identifier',
              },
              name: {
                type: 'string',
                description: 'Category name',
              },
              description: {
                type: 'string',
                description: 'Category description',
              },
              imageUrl: {
                type: 'string',
                format: 'uri',
                description: 'Category image URL',
              },
            },
          },
          CartItem: {
            type: 'object',
            required: ['productId', 'quantity', 'unitPrice', 'totalPrice'],
            properties: {
              productId: {
                type: 'string',
                format: 'uuid',
                description: 'Product ID in cart',
              },
              product: {
                $ref: '#/components/schemas/Product',
              },
              quantity: {
                type: 'integer',
                minimum: 1,
                description: 'Quantity of product in cart',
              },
              unitPrice: {
                type: 'number',
                minimum: 0,
                description: 'Price per unit',
              },
              totalPrice: {
                type: 'number',
                minimum: 0,
                description: 'Total price for this item',
              },
            },
          },
          ShoppingCart: {
            type: 'object',
            required: ['id', 'userId', 'items', 'totalAmount'],
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'Cart unique identifier',
              },
              userId: {
                type: 'string',
                description: 'Associated user ID',
              },
              items: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/CartItem',
                },
                description: 'Items in cart',
              },
              totalAmount: {
                type: 'number',
                minimum: 0,
                description: 'Total cart amount',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Creation timestamp',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Last update timestamp',
              },
            },
          },
          Address: {
            type: 'object',
            required: ['street', 'city', 'state', 'zipCode', 'country'],
            properties: {
              street: {
                type: 'string',
                description: 'Street address',
              },
              city: {
                type: 'string',
                description: 'City',
              },
              state: {
                type: 'string',
                description: 'State or province',
              },
              zipCode: {
                type: 'string',
                description: 'ZIP or postal code',
              },
              country: {
                type: 'string',
                description: 'Country',
              },
            },
          },
          Order: {
            type: 'object',
            required: ['id', 'userId', 'items', 'status', 'totalAmount'],
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'Order unique identifier',
              },
              userId: {
                type: 'string',
                description: 'Associated user ID',
              },
              items: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/CartItem',
                },
                description: 'Ordered items',
              },
              status: {
                type: 'string',
                enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
                description: 'Order status',
              },
              totalAmount: {
                type: 'number',
                minimum: 0,
                description: 'Total order amount',
              },
              shippingAddress: {
                $ref: '#/components/schemas/Address',
              },
              billingAddress: {
                $ref: '#/components/schemas/Address',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Creation timestamp',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Last update timestamp',
              },
            },
          },
          DummyUser: {
            type: 'object',
            required: ['id', 'email', 'firstName', 'lastName'],
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'User unique identifier',
              },
              email: {
                type: 'string',
                format: 'email',
                description: 'User email address',
              },
              firstName: {
                type: 'string',
                description: 'User first name',
              },
              lastName: {
                type: 'string',
                description: 'User last name',
              },
              address: {
                $ref: '#/components/schemas/Address',
              },
              phone: {
                type: 'string',
                description: 'User phone number',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Creation timestamp',
              },
            },
          },
          ApiResponse: {
            type: 'object',
            required: ['success', 'timestamp'],
            properties: {
              success: {
                type: 'boolean',
                description: 'Whether request was successful',
              },
              data: {
                description: 'Response data',
              },
              error: {
                type: 'string',
                description: 'Error message if success is false',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                description: 'Response timestamp',
              },
              total: {
                type: 'integer',
                description: 'Total count for list responses',
              },
            },
          },
          HealthCheck: {
            type: 'object',
            required: ['status', 'timestamp', 'version'],
            properties: {
              status: {
                type: 'string',
                enum: ['OK', 'ERROR'],
                description: 'Health status',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                description: 'Health check timestamp',
              },
              version: {
                type: 'string',
                description: 'API version',
              },
              uptime: {
                type: 'number',
                description: 'Server uptime in seconds',
              },
              environment: {
                type: 'string',
                description: 'Environment name',
              },
              dataStatus: {
                type: 'object',
                properties: {
                  initialized: {
                    type: 'boolean',
                    description: 'Whether data is initialized',
                  },
                  theme: {
                    type: 'string',
                    description: 'Current data theme',
                  },
                  productCount: {
                    type: 'integer',
                    description: 'Number of products generated',
                  },
                  categoryCount: {
                    type: 'integer',
                    description: 'Number of categories generated',
                  },
                },
              },
              endpoints: {
                type: 'object',
                description: 'Available API endpoints',
              },
            },
          },
        },
        responses: {
          NotFound: {
            description: 'Resource not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse',
                },
                example: {
                  success: false,
                  error: 'Resource not found',
                  timestamp: '2023-01-01T12:00:00.000Z',
                },
              },
            },
          },
          BadRequest: {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse',
                },
                example: {
                  success: false,
                  error: 'Invalid request parameters',
                  timestamp: '2023-01-01T12:00:00.000Z',
                },
              },
            },
          },
          InternalServerError: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse',
                },
                example: {
                  success: false,
                  error: 'Internal server error',
                  timestamp: '2023-01-01T12:00:00.000Z',
                },
              },
            },
          },
        },
      },
      tags: [
        {
          name: 'Health',
          description: 'Health check and system status endpoints',
        },
        {
          name: 'Products',
          description: 'Product management endpoints',
        },
        {
          name: 'Categories',
          description: 'Product category endpoints',
        },
        {
          name: 'Cart',
          description: 'Shopping cart management endpoints',
        },
        {
          name: 'Orders',
          description: 'Order management endpoints',
        },
        {
          name: 'Users',
          description: 'User information endpoints',
        },
      ],
    },
    apis: ['./src/routes/*.ts', './src/index.ts'],
  };

  return swaggerJsdoc(options);
}
