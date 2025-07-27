# API Sandbox - Trainings API Hub

## Overview

The API Sandbox is a comprehensive training platform that provides students with on-demand, disposable REST API environments for practicing frontend development. Each student gets their own containerized e-commerce API instance with realistic data.

## Architecture

### Components

1. **Dummy API (`packages/dummy-api/`)**: Containerized Node.js/Express API with fake e-commerce data
2. **Main Backend (`packages/main-backend/`)**: Container management API with user authentication  
3. **Frontend (`packages/frontend/`)**: Angular dashboard for managing API instances
4. **Shared (`shared/`)**: Common TypeScript types and utilities

### Technology Stack

- **Frontend**: Angular 20+ with signals and standalone components
- **Backend**: Node.js with Express.js and TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Containerization**: Docker and Docker Compose
- **Authentication**: JWT tokens
- **Data Generation**: Faker.js for realistic fake data

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Docker and Docker Compose
- PostgreSQL (or use Docker)
- GitHub account (for OAuth authentication)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/timfewi/trainings-api-hub.git
cd trainings-api-hub
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy example environment file
cp packages/main-backend/.env.example packages/main-backend/.env

# Edit the .env file with your configuration
```

**📚 For GitHub OAuth setup, see the detailed guide:** [GitHub Authentication Setup](.github/GITHUB_AUTH_SETUP.md)

4. Start the development environment:
```bash
# Start database and services
npm run docker:up

# Start all development servers
npm run dev
```

5. Run database migrations:
```bash
cd packages/main-backend
npm run db:migrate
npm run db:generate
```

### Available Services

- **Frontend**: http://localhost:4200
- **Main Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Development

### Project Structure

```
trainings-api-hub/
├── packages/
│   ├── dummy-api/          # Containerized e-commerce API
│   │   ├── src/
│   │   │   ├── routes/     # API endpoints
│   │   │   ├── services/   # Business logic
│   │   │   ├── middleware/ # Express middleware
│   │   │   └── index.ts    # Main server file
│   │   ├── Dockerfile      # Container configuration
│   │   └── package.json
│   ├── main-backend/       # Container management API
│   │   ├── src/
│   │   │   ├── routes/     # API endpoints
│   │   │   ├── services/   # Business logic
│   │   │   ├── middleware/ # Authentication & validation
│   │   │   └── utils/      # Database, logging, etc.
│   │   ├── prisma/         # Database schema & migrations
│   │   └── package.json
│   └── frontend/           # Angular dashboard
│       ├── src/
│       │   ├── app/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   └── guards/
│       │   └── index.html
│       └── package.json
├── shared/                 # Shared TypeScript types
├── docker/                 # Docker configurations
├── docs/                   # Documentation
└── docker-compose.yml      # Development environment
```

### Development Commands

```bash
# Start all services in development mode
npm run dev

# Start individual services
npm run dev:backend
npm run dev:frontend
npm run dev:dummy-api

# Build all packages
npm run build

# Run tests
npm run test

# Lint and format code
npm run lint
npm run format

# Docker commands
npm run docker:build
npm run docker:up
npm run docker:down
```

### Database Operations

```bash
cd packages/main-backend

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Reset database
npx prisma migrate reset

# View database in browser
npx prisma studio
```

## API Documentation

### Main Backend API

#### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

#### Instance Management Endpoints

- `GET /api/instances` - List user's API instances
- `POST /api/instances` - Create new API instance
- `GET /api/instances/:id` - Get instance details
- `DELETE /api/instances/:id` - Delete API instance

#### User Endpoints

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

### Dummy E-commerce API

Each API instance provides these endpoints:

- `GET /products` - List all products
- `GET /products/:id` - Get product by ID
- `GET /products/category/:categoryId` - Get products by category
- `GET /categories` - List all categories
- `GET /categories/:id` - Get category by ID
- `GET /cart` - Get current cart
- `POST /cart/items` - Add item to cart
- `PUT /cart/items/:productId` - Update cart item
- `DELETE /cart/items/:productId` - Remove cart item
- `DELETE /cart/clear` - Clear cart
- `GET /orders` - List orders
- `POST /orders` - Create order
- `GET /orders/:id` - Get order by ID
- `GET /users/:id` - Get user by ID


## Deployment

## Authentication GitHub OAuth

### Production Build

```bash
# Build all packages
npm run build

# Build Docker images
npm run docker:build

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

See `packages/main-backend/.env.example` for all required environment variables.

## Contributing

1. Follow the TypeScript coding guidelines in `.github/instructions/`
2. Write tests for new features
3. Update documentation
4. Submit pull requests with clear descriptions

## License

MIT License - see LICENSE file for details
