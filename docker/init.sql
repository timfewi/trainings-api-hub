-- docker/init.sql
-- Initialize database with required extensions

-- Create UUID extension for generating UUIDs
CREATE EXTENSION
IF NOT EXISTS "uuid-ossp";

-- Create database if not exists (PostgreSQL doesn't support IF NOT EXISTS for databases)
-- This is handled by the POSTGRES_DB environment variable in Docker
