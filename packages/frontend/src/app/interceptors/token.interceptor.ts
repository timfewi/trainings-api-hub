// packages/frontend/src/app/interceptors/token.interceptor.ts

import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * HTTP interceptor for handling JWT tokens and expiry warnings
 */
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
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
    return next(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          handleTokenExpiryHeaders(event, authService);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        handleAuthError(error);
        return throwError(() => error);
      }),
    );
  } catch (error) {
    // If AuthService injection fails (circular dependency), just pass through
    console.warn(
      'AuthService injection failed in token interceptor, skipping:',
      error,
    );
    return next(req);
  }
};

/**
 * Handle token expiry warning headers from backend
 */
function handleTokenExpiryHeaders(
  response: HttpResponse<any>,
  authService: AuthService,
): void {
  const expiryWarning = response.headers.get('X-Token-Expiry-Warning');
  const expiresIn = response.headers.get('X-Token-Expires-In');
  const expiresAt = response.headers.get('X-Token-Expires-At');

  if (expiryWarning === 'true' && expiresIn) {
    const seconds = parseInt(expiresIn, 10);

    console.warn(
      `🚨 Token expires in ${Math.floor(seconds / 60)} minutes (${seconds} seconds)`,
    );

    if (expiresAt) {
      console.warn(
        `🕒 Token expires at: ${new Date(expiresAt).toLocaleString()}`,
      );
    }

    // Trigger automatic refresh if less than 2 minutes remaining
    if (seconds < 120) {
      console.warn(
        '⚡ Triggering automatic token refresh due to imminent expiry',
      );

      authService.refreshToken().subscribe({
        next: (response) => {
          if (response.success) {
            console.log('✅ Token automatically refreshed successfully');
          }
        },
        error: (error) => {
          console.error('❌ Automatic token refresh failed:', error);
        },
      });
    }
  }
}

/**
 * Handle authentication errors (simplified - main auth handling is in authInterceptor)
 */
function handleAuthError(error: HttpErrorResponse): void {
  if (error.status === 401) {
    console.warn('🔒 Authentication failed, token may be expired');
    // Let authInterceptor handle the actual token refresh and logout logic
  }
}
