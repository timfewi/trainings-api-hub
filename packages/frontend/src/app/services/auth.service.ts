// packages/frontend/src/app/services/auth.service.ts

import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { User, ApiResponse } from '@trainings-api-hub/shared';
import { environment } from '../../environments/environment';

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

  // Public computed signals
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly isLoading = this._isLoading.asReadonly();

  constructor() {
    // Check for existing session on initialization
    this.initializeAuth();
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
   * Get current authentication token
   */
  getAuthToken(): string | null {
    return this._authToken();
  }

  /**
   * Initialize authentication state from localStorage
   */
  private initializeAuth(): void {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('currentUser');

    if (token && userStr) {
      try {
        const user: User = JSON.parse(userStr);
        this._authToken.set(token);
        this._currentUser.set(user);

        // Verify token is still valid
        this.getUserProfile().subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this._currentUser.set(response.data);
              localStorage.setItem(
                'currentUser',
                JSON.stringify(response.data),
              );
            }
          },
          error: (error) => {
            console.warn('Stored token is invalid, clearing auth data:', error);
            this.clearAuthData();
          },
        });
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        this.clearAuthData();
      }
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
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    this._currentUser.set(null);
    this._authToken.set(null);
    this._isLoading.set(false);

    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');

    // Navigate to login page
    this.router.navigate(['/login']);
  }
}
