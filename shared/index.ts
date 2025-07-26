// shared/index.ts

// API types
export * from './types/api';
export * from './types/user';
export * from './types/instance';
export * from './types/ecommerce';

// Constants
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
  },
  INSTANCES: {
    CREATE: '/api/instances',
    LIST: '/api/instances',
    GET: (id: string): string => `/api/instances/${id}`,
    DELETE: (id: string): string => `/api/instances/${id}`,
  },
  USER: {
    PROFILE: '/api/user/profile',
    UPDATE: '/api/user/profile',
  },
} as const;

export const DUMMY_API_ENDPOINTS = {
  PRODUCTS: {
    LIST: '/products',
    GET: (id: string): string => `/products/${id}`,
    BY_CATEGORY: (categoryId: string): string => `/products/category/${categoryId}`,
  },
  CATEGORIES: {
    LIST: '/categories',
    GET: (id: string): string => `/categories/${id}`,
  },
  CART: {
    GET: '/cart',
    ADD_ITEM: '/cart/items',
    UPDATE_ITEM: (itemId: string): string => `/cart/items/${itemId}`,
    REMOVE_ITEM: (itemId: string): string => `/cart/items/${itemId}`,
    CLEAR: '/cart/clear',
  },
  ORDERS: {
    CREATE: '/orders',
    LIST: '/orders',
    GET: (id: string): string => `/orders/${id}`,
  },
  USERS: {
    GET: (id: string): string => `/users/${id}`,
  },
} as const;
