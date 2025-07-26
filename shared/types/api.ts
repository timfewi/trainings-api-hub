// shared/types/api.ts

/**
 * Common API response wrapper interface
 */
export interface ApiResponse<TData = unknown> {
  success: boolean;
  data?: TData;
  error?: string;
  timestamp: string;
}

/**
 * API error response interface
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<TData> extends ApiResponse<TData[]> {
  meta: PaginationMeta;
}
