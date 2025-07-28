# packages/dummy-api/Dockerfile

# Multi-stage build for optimized production image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci --only=dev

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S dummy-api -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create logs directory
RUN mkdir -p /app/logs && \
    chown -R dummy-api:nodejs /app

# Switch to non-root user
USER dummy-api

# Environment variables with defaults
ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_THEME=electronics
ENV PRODUCT_COUNT=50
ENV CATEGORY_COUNT=8
ENV USER_COUNT=10
ENV ORDER_COUNT=5
ENV CORS_ORIGIN=*
ENV API_VERSION=v1
ENV ENABLE_DETAILED_LOGS=false

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Labels for metadata
LABEL maintainer="timfewi@example.com"
LABEL version="1.0.0"
LABEL description="Dummy E-commerce API for training purposes"
LABEL org.opencontainers.image.source="https://github.com/timfewi/trainings-api-hub"

# Start the application
CMD ["npm", "start"]
