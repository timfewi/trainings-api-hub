// packages/frontend/src/app/interceptors/auth.interceptor.ts

import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * HTTP interceptor to add authentication headers and handle token refresh
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAuthToken();

  // Clone request and add authorization header if token exists
  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized responses
      if (error.status === 401 && !req.url.includes('/auth/')) {
        // Try to refresh token
        return authService.refreshToken().pipe(
          switchMap(() => {
            // Retry original request with new token
            const newToken = authService.getAuthToken();
            const retryReq = newToken
              ? req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`,
                  },
                })
              : req;
            return next(retryReq);
          }),
          catchError((refreshError) => {
            // Refresh failed, logout user
            authService.logout();
            return throwError(() => refreshError);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
