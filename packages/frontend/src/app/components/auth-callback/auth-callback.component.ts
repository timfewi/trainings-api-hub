// packages/frontend/src/app/components/auth-callback/auth-callback.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

/**
 * Component to handle GitHub OAuth callback
 */
@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-container">
      <div class="callback-card">
        <div class="spinner"></div>
        <h2>Completing Sign In</h2>
        <p>Please wait while we complete your GitHub authentication...</p>

        @if (error) {
          <div class="error-message">
            <p>{{ error }}</p>
            <button (click)="redirectToLogin()">Try Again</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .callback-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .callback-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        padding: 40px;
        text-align: center;
        max-width: 400px;
        width: 90%;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 24px auto;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      h2 {
        margin: 0 0 16px 0;
        color: #2d3748;
        font-size: 24px;
        font-weight: 600;
      }

      p {
        margin: 0;
        color: #4a5568;
        font-size: 16px;
        line-height: 1.5;
      }

      .error-message {
        margin-top: 24px;
        padding: 16px;
        background: #fed7d7;
        border: 1px solid #fc8181;
        border-radius: 8px;
        color: #c53030;
      }

      .error-message button {
        margin-top: 12px;
        padding: 8px 16px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
      }

      .error-message button:hover {
        background: #5a67d8;
      }
    `,
  ],
})
export class AuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  error: string | null = null;

  ngOnInit(): void {
    // Extract tokens from query parameters
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      const refreshToken = params['refresh'];
      const error = params['error'];

      if (error) {
        this.error = 'Authentication failed. Please try again.';
        setTimeout(() => this.redirectToLogin(), 3000);
        return;
      }

      if (token && refreshToken) {
        this.authService.handleOAuthCallback(token, refreshToken);
      } else {
        this.error = 'Invalid authentication response. Please try again.';
        setTimeout(() => this.redirectToLogin(), 3000);
      }
    });
  }

  redirectToLogin(): void {
    this.router.navigate(['/login']);
  }
}
