---
applyTo: "**/*express*/**/*.ts"
---

# Express.js Development Guidelines

**Architecture**: Use layered architecture with controllers, services, and middleware. Implement proper separation of concerns. Follow REST API conventions with consistent endpoint naming (`/api/v1/users`).

**Middleware**:

- Authentication: `authenticateUser`, `authorizeRole`
- Validation: `validateRequest`, `sanitizeInput`
- Error handling: `errorHandler`, `notFoundHandler`
- Logging: `requestLogger`, `auditLogger`

**Route Structure**: Add file path comments (`// src/routes/userRoutes.ts`). Group related routes in modules. Use router-level middleware for common functionality. Implement route parameter validation with typed schemas.

**Request/Response**: Define TypeScript interfaces for request bodies, query parameters, and response objects. Use proper HTTP status codes (200, 201, 400, 401, 404, 500). Implement consistent response formatting.

**Error Handling**: Create custom error classes (`ValidationError`, `AuthenticationError`). Use async error handling middleware. Return meaningful error messages with proper status codes. Implement request ID tracking for debugging.

**Security**: Use helmet, cors, rate limiting. Validate and sanitize all inputs. Implement proper authentication (JWT, sessions). Use HTTPS in production. Hash passwords with bcrypt.

**Database**: Use TypeORM or Prisma for type-safe database operations. Implement connection pooling. Use transactions for data consistency. Create proper database migrations.

**Testing**: Test routes with supertest. Mock database operations. Test middleware functions independently. Include integration tests for complete request flows.

**Performance**: Implement caching strategies (Redis). Use compression middleware. Optimize database queries. Monitor response times and memory usage.
