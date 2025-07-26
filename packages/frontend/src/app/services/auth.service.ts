// packages/frontend/src/app/services/auth.service.ts

import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  Observable,
  BehaviorSubject,
  catchError,
  map,
  tap,
  throwError,
} from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  User,
  UserLoginRequest,
  UserRegistrationRequest,
  AuthToken,
  ApiResponse,
} from '@trainings-api-hub/shared';
import { environment } from '../../environments/environment';

/**
 * Authentication service for managing user login, registration, and session
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
   * Register a new user
   */
  register(
    userData: UserRegistrationRequest,
  ): Observable<ApiResponse<{ user: User; token: AuthToken }>> {
    this._isLoading.set(true);

    return this.http
      .post<
        ApiResponse<{ user: User; token: AuthToken }>
      >(`${environment.apiUrl}/auth/register`, userData)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.setAuthData(response.data.user, response.data.token);
          }
        }),
        catchError((error) => {
          console.error('Registration failed:', error);
          return throwError(() => error);
        }),
        tap(() => this._isLoading.set(false)),
      );
  }

  /**
   * Login user with email and password
   */
  login(
    credentials: UserLoginRequest,
  ): Observable<ApiResponse<{ user: User; token: AuthToken }>> {
    this._isLoading.set(true);

    return this.http
      .post<
        ApiResponse<{ user: User; token: AuthToken }>
      >(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.setAuthData(response.data.user, response.data.token);
          }
        }),
        catchError((error) => {
          console.error('Login failed:', error);
          return throwError(() => error);
        }),
        tap(() => this._isLoading.set(false)),
      );
  }

  /**
   * Logout current user
   */
  logout(): void {
    this._isLoading.set(true);

    // Call logout endpoint if token exists
    const token = this._authToken();
    if (token) {
      this.http
        .post(`${environment.apiUrl}/auth/logout`, {})
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
  refreshToken(): Observable<ApiResponse<AuthToken>> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<
        ApiResponse<AuthToken>
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
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        this.clearAuthData();
      }
    }
  }

  /**
   * Set authentication data in memory and localStorage
   */
  private setAuthData(user: User, token: AuthToken): void {
    this._currentUser.set(user);
    this._authToken.set(token.accessToken);

    localStorage.setItem('authToken', token.accessToken);
    localStorage.setItem('refreshToken', token.refreshToken);
    localStorage.setItem('currentUser', JSON.stringify(user));

    // Navigate to dashboard after successful authentication
    this.router.navigate(['/dashboard']);
  }

  /**
   * Set only token data (for refresh)
   */
  private setTokenData(token: AuthToken): void {
    this._authToken.set(token.accessToken);
    localStorage.setItem('authToken', token.accessToken);
    localStorage.setItem('refreshToken', token.refreshToken);
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
