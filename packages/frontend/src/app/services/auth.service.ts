// packages/frontend/src/app/services/auth.service.ts

import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  Observable,
  catchError,
  tap,
  throwError,
  map,
  of,
  switchMap,
} from 'rxjs';
import { User, ApiResponse } from '@trainings-api-hub/shared';
import { environment } from '../../environments/environment';

/**
 * Token status response interface
 */
export interface TokenStatusResponse {
  isValid: boolean;
  isExpired: boolean;
  expiresAt?: string;
  timeUntilExpiry?: number;
  tokenType: string;
  checkedAt: string;
}

/**
 * Token expiry warning interface
 */
export interface TokenExpiryWarning {
  isWarning: boolean;
  expiresIn: number;
  expiresAt?: Date;
  message?: string;
}

/**
 * Authentication service for GitHub OAuth
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Signals for reactive state management
  private readonly _currentUser = signal<User | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _authToken = signal<string | null>(null);
  private readonly _tokenExpiryWarning = signal<TokenExpiryWarning | null>(
    null,
  );
  private readonly _lastTokenCheck = signal<Date | null>(null);
  private readonly _isInitializing = signal(true);
  private readonly _initializationComplete = signal(false);

  // Public computed signals
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly isLoading = this._isLoading.asReadonly();
  readonly isInitializing = this._isInitializing.asReadonly();
  readonly initializationComplete = this._initializationComplete.asReadonly();
  readonly tokenExpiryWarning = this._tokenExpiryWarning.asReadonly();
  readonly hasValidToken = computed(() => {
    const token = this._authToken();
    const warning = this._tokenExpiryWarning();
    return token !== null && (warning === null || !warning.isWarning);
  });

  constructor() {
    // Defer initialization to avoid circular dependency with HTTP interceptors
    setTimeout(() => {
      this.performInitialization();
    }, 0);
  }

  /**
   * Perform the actual initialization after constructor completes
   */
  private performInitialization(): void {
    this.initializeAuth().subscribe({
      next: (isAuthenticated: boolean) => {
        console.log(
          `Auth initialization complete. Authenticated: ${isAuthenticated}`,
        );
        this._isInitializing.set(false);
        this._initializationComplete.set(true);
      },
      error: (error: any) => {
        console.error('Auth initialization failed:', error);
        this._isInitializing.set(false);
        this._initializationComplete.set(true);
        this.clearAuthData();
      },
    });
  }

  /**
   * Initiate GitHub OAuth login
   */
  loginWithGitHub(): void {
    window.location.href = `${environment.apiUrl}/auth/github`;
  }

  /**
   * Handle OAuth callback from GitHub
   */
  handleOAuthCallback(token: string, refreshToken: string): void {
    this._isLoading.set(true);

    // Store tokens
    localStorage.setItem('authToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    this._authToken.set(token);

    // Use setTimeout to ensure the signal update is processed before making HTTP request
    // This prevents timing issues with the auth interceptor
    setTimeout(() => {
      // Get user profile
      this.getUserProfile().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this._currentUser.set(response.data);
            // Store user data in localStorage for persistence
            localStorage.setItem('currentUser', JSON.stringify(response.data));
            this.router.navigate(['/dashboard']);
          }
        },
        error: (error) => {
          console.error('Failed to get user profile:', error);
          this.clearAuthData();
        },
        complete: () => {
          this._isLoading.set(false);
        },
      });
    }, 0);
  }

  /**
   * Get current user profile
   */
  getUserProfile(): Observable<ApiResponse<User>> {
    return this.http
      .get<ApiResponse<User>>(`${environment.apiUrl}/auth/me`)
      .pipe(
        catchError((error) => {
          console.error('Failed to fetch user profile:', error);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Logout current user
   */
  logout(): void {
    this._isLoading.set(true);

    // Call logout endpoint if refresh token exists
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      this.http
        .post(`${environment.apiUrl}/auth/logout`, { refreshToken })
        .pipe(
          catchError((error) => {
            console.warn('Logout endpoint failed:', error);
            return throwError(() => error);
          }),
        )
        .subscribe({
          complete: () => this.clearAuthData(),
        });
    } else {
      this.clearAuthData();
    }
  }

  /**
   * Refresh authentication token
   */
  refreshToken(): Observable<
    ApiResponse<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }>
  > {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<
        ApiResponse<{
          accessToken: string;
          refreshToken: string;
          expiresIn: number;
        }>
      >(`${environment.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.setTokenData(response.data);
          }
        }),
        catchError((error) => {
          console.error('Token refresh failed:', error);
          this.clearAuthData();
          return throwError(() => error);
        }),
      );
  }

  /**
   * Check token status and handle expiry warnings
   */
  checkTokenStatus(): Observable<boolean> {
    const token = this._authToken();

    if (!token) {
      this._tokenExpiryWarning.set(null);
      return of(false);
    }

    return this.http
      .get<
        ApiResponse<TokenStatusResponse>
      >(`${environment.apiUrl}/auth/token/status`)
      .pipe(
        map((response) => {
          this._lastTokenCheck.set(new Date());

          if (response.success && response.data) {
            const data = response.data;

            // Handle token expiry warning
            if (data.isValid && data.timeUntilExpiry !== undefined) {
              const warning = this.createExpiryWarning(
                data.timeUntilExpiry,
                data.expiresAt,
              );
              this._tokenExpiryWarning.set(warning);

              // Auto-refresh if token expires in less than 2 minutes
              if (warning.isWarning && warning.expiresIn < 120) {
                console.warn(
                  'Token expires soon, triggering automatic refresh',
                );
                this.refreshToken().subscribe({
                  next: () => console.log('Token automatically refreshed'),
                  error: (error) =>
                    console.error('Automatic token refresh failed:', error),
                });
              }
            } else {
              this._tokenExpiryWarning.set(null);
            }

            return data.isValid;
          }

          this._tokenExpiryWarning.set(null);
          return false;
        }),
        catchError((error) => {
          console.error('Token status check failed:', error);
          this._tokenExpiryWarning.set(null);

          // If the error is 401, token is likely expired
          if (error.status === 401) {
            this.clearAuthData();
          }

          return of(false);
        }),
      );
  }

  /**
   * Create expiry warning object
   */
  private createExpiryWarning(
    timeUntilExpiry: number,
    expiresAt?: string,
  ): TokenExpiryWarning {
    const isWarning = timeUntilExpiry < 300; // 5 minutes warning threshold

    return {
      isWarning,
      expiresIn: timeUntilExpiry,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      message: isWarning
        ? `Token expires in ${Math.floor(timeUntilExpiry / 60)} minutes`
        : undefined,
    };
  }

  /**
   * Get current authentication token
   */
  getAuthToken(): string | null {
    return this._authToken();
  }

  /**
   * Manually trigger token status check (public method)
   */
  validateCurrentToken(): Observable<boolean> {
    return this.checkTokenStatus();
  }

  /**
   * Get initialization and auth status for debugging
   */
  getAuthStatus() {
    return {
      isInitializing: this._isInitializing(),
      initializationComplete: this._initializationComplete(),
      isAuthenticated: this.isAuthenticated(),
      hasToken: !!this._authToken(),
      currentUser: this._currentUser(),
      isLoading: this._isLoading(),
    };
  }

  /**
   * Get time until token expiry (in seconds)
   */
  getTokenExpiryInfo(): { expiresIn: number; expiresAt?: Date } | null {
    const warning = this._tokenExpiryWarning();
    if (warning) {
      return {
        expiresIn: warning.expiresIn,
        expiresAt: warning.expiresAt,
      };
    }
    return null;
  }

  /**
   * Wait for authentication initialization to complete
   */
  waitForInitialization(): Observable<boolean> {
    if (this._initializationComplete()) {
      return of(this.isAuthenticated());
    }

    return new Observable<boolean>((observer) => {
      const checkComplete = () => {
        if (this._initializationComplete()) {
          observer.next(this.isAuthenticated());
          observer.complete();
        } else {
          setTimeout(checkComplete, 10); // Check again in 10ms
        }
      };
      checkComplete();
    });
  }

  /**
   * Initialize authentication state from localStorage
   */
  private initializeAuth(): Observable<boolean> {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('currentUser');

    if (token && userStr) {
      try {
        const user: User = JSON.parse(userStr);
        this._authToken.set(token);
        this._currentUser.set(user);

        // For initial load, just trust the stored data
        // We'll validate with the server later via token expiry headers
        console.log('Auth state restored from localStorage');
        return of(true);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        this.clearAuthDataSilently();
        return of(false);
      }
    } else {
      // No stored auth data
      return of(false);
    }
  }


  /**
   * Set token data (for refresh)
   */
  private setTokenData(tokenData: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }): void {
    this._authToken.set(tokenData.accessToken);
    localStorage.setItem('authToken', tokenData.accessToken);
    localStorage.setItem('refreshToken', tokenData.refreshToken);

    // Clear any existing expiry warnings since we have a fresh token
    this._tokenExpiryWarning.set(null);

    // Check the new token status
    this.checkTokenStatus().subscribe({
      next: (isValid) => {
        if (!isValid) {
          console.warn('Newly received token is invalid');
        }
      },
      error: (error) => {
        console.error('Failed to check new token status:', error);
      },
    });
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    this._currentUser.set(null);
    this._authToken.set(null);
    this._tokenExpiryWarning.set(null);
    this._lastTokenCheck.set(null);
    this._isLoading.set(false);

    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');

    // Navigate to login page
    this.router.navigate(['/login']);
  }

  /**
   * Clear authentication data without navigation (for initialization)
   */
  private clearAuthDataSilently(): void {
    this._currentUser.set(null);
    this._authToken.set(null);
    this._tokenExpiryWarning.set(null);
    this._lastTokenCheck.set(null);
    this._isLoading.set(false);

    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
  }
}
