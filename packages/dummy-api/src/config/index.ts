// packages/dummy-api/src/config/index.ts

/**
 * Data themes for different types of e-commerce stores
 */
export type DataTheme =
  | 'electronics'
  | 'fashion'
  | 'books'
  | 'general'
  | 'automotive'
  | 'home'
  | 'beauty'
  | 'sports';

/**
 * API configuration interface
 */
export interface ApiConfig {
  /** Server port */
  port: number;
  /** Node environment */
  nodeEnv: string;
  /** Data generation theme */
  dataTheme: DataTheme;
  /** Number of products to generate per category */
  productCount: number;
  /** Number of categories to generate */
  categoryCount: number;
  /** Number of sample users to generate */
  userCount: number;
  /** Number of sample orders to generate */
  orderCount: number;
  /** Enable CORS */
  enableCors: boolean;
  /** CORS origins */
  corsOrigin: string;
  /** API version */
  apiVersion: string;
  /** Random seed for reproducible data */
  randomSeed?: string;
  /** Enable detailed logging */
  enableDetailedLogs: boolean;
}

/**
 * Load configuration from environment variables with defaults
 */
export function loadConfig(): ApiConfig {
  return {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    dataTheme: (process.env.DATA_THEME as DataTheme) || 'general',
    productCount: parseInt(process.env.PRODUCT_COUNT || '10', 10),
    categoryCount: parseInt(process.env.CATEGORY_COUNT || '8', 10),
    userCount: parseInt(process.env.USER_COUNT || '10', 10),
    orderCount: parseInt(process.env.ORDER_COUNT || '5', 10),
    enableCors: process.env.ENABLE_CORS !== 'false',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    apiVersion: process.env.API_VERSION || 'v1',
    randomSeed: process.env.RANDOM_SEED,
    enableDetailedLogs: process.env.ENABLE_DETAILED_LOGS === 'true',
  };
}

/**
 * Validate configuration values
 */
export function validateConfig(config: ApiConfig): void {
  const validThemes: DataTheme[] = [
    'electronics',
    'fashion',
    'books',
    'general',
    'automotive',
    'home',
    'beauty',
    'sports',
  ];

  if (!validThemes.includes(config.dataTheme)) {
    throw new Error(
      `Invalid data theme: ${config.dataTheme}. Valid themes: ${validThemes.join(', ')}`
    );
  }

  if (config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid port: ${config.port}. Port must be between 1 and 65535`);
  }

  if (config.productCount < 1 || config.productCount > 100) {
    throw new Error(`Invalid product count: ${config.productCount}. Must be between 1 and 100`);
  }

  if (config.categoryCount < 1 || config.categoryCount > 20) {
    throw new Error(`Invalid category count: ${config.categoryCount}. Must be between 1 and 20`);
  }
}
