// packages/frontend/src/app/interceptors/auth.interceptor.ts

import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpErrorResponse,
  HttpHandlerFn,
} from '@angular/common/http';
import { catchError, throwError, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * HTTP interceptor for handling authentication headers and 401 responses
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip interceptor for auth endpoints that don't require authentication
  const skipAuthEndpoints = ['/auth/github', '/auth/refresh', '/auth/logout'];
  if (skipAuthEndpoints.some((endpoint) => req.url.includes(endpoint))) {
    return next(req);
  }

  try {
    const authService = inject(AuthService);

    // Skip if auth service is still initializing to avoid circular dependency
    if (authService.isInitializing()) {
      return next(req);
    }

    // Add authentication token to request if available
    const token = authService.getAuthToken();
    let authReq = req;

    if (token) {
      authReq = addAuthHeader(req, token);
    }

    // Process the request and handle auth errors
    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && token) {
          // Token might be expired, try to refresh if we have a token
          return handleUnauthorizedError(authReq, next, authService);
        }
        return throwError(() => error);
      }),
    );
  } catch (error) {
    // If AuthService injection fails (circular dependency), just pass through
    console.warn(
      'AuthService injection failed in auth interceptor, skipping:',
      error,
    );
    return next(req);
  }
};

/**
 * Add Authorization header to request
 */
function addAuthHeader(req: HttpRequest<any>, token: string): HttpRequest<any> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Handle 401 unauthorized error by attempting token refresh
 */
function handleUnauthorizedError(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService,
) {
  console.warn('🔒 401 Unauthorized detected, attempting token refresh...');

  return authService.refreshToken().pipe(
    switchMap((response) => {
      if (response.success && response.data) {
        console.log('✅ Token refreshed successfully, retrying request');

        // Retry the original request with new token
        const newToken = authService.getAuthToken();
        const authReq = newToken ? addAuthHeader(req, newToken) : req;
        return next(authReq);
      } else {
        console.error('❌ Token refresh failed - no data in response');
        authService.logout();
        return throwError(() => new Error('Token refresh failed'));
      }
    }),
    catchError((refreshError) => {
      console.error('❌ Token refresh failed:', refreshError);

      // If refresh fails, logout user and redirect to login
      authService.logout();
      return throwError(() => refreshError);
    }),
  );
}
