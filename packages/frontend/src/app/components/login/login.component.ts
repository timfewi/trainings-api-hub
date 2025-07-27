// packages/frontend/src/app/components/login/login.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

/**
 * Simple GitHub OAuth login component
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>Training API Hub</h1>
          <p>
            Welcome! Sign in with your GitHub account to start creating API
            instances for learning.
          </p>
        </div>

        <div class="login-content">
          <button
            class="github-login-btn"
            (click)="loginWithGitHub()"
            [disabled]="authService.isLoading()"
          >
            <svg class="github-icon" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"
              />
            </svg>
            @if (authService.isLoading()) {
              <span>Connecting...</span>
            } @else {
              <span>Sign in with GitHub</span>
            }
          </button>

          <div class="info-section">
            <h3>For Students & Developers</h3>
            <p>
              This platform provides training API instances to help you learn
              how to work with REST APIs.
            </p>
            <ul>
              <li>✅ Create your own API instance</li>
              <li>✅ Practice HTTP requests</li>
              <li>✅ Learn API authentication</li>
              <li>✅ Safe learning environment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .login-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
      }

      .login-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        padding: 40px;
        max-width: 450px;
        width: 100%;
        text-align: center;
      }

      .login-header h1 {
        margin: 0 0 16px 0;
        color: #2d3748;
        font-size: 28px;
        font-weight: 700;
      }

      .login-header p {
        margin: 0 0 32px 0;
        color: #4a5568;
        font-size: 16px;
        line-height: 1.5;
      }

      .github-login-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        width: 100%;
        padding: 14px 24px;
        background: #24292e;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 32px;
      }

      .github-login-btn:hover:not(:disabled) {
        background: #1a1e22;
        transform: translateY(-1px);
      }

      .github-login-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
      }

      .github-icon {
        flex-shrink: 0;
      }

      .info-section {
        text-align: left;
        background: #f7fafc;
        padding: 24px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .info-section h3 {
        margin: 0 0 12px 0;
        color: #2d3748;
        font-size: 18px;
        font-weight: 600;
      }

      .info-section p {
        margin: 0 0 16px 0;
        color: #4a5568;
        font-size: 14px;
        line-height: 1.5;
      }

      .info-section ul {
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .info-section li {
        color: #4a5568;
        font-size: 14px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
      }

      .info-section li:last-child {
        margin-bottom: 0;
      }

      @media (max-width: 480px) {
        .login-card {
          padding: 24px;
          margin: 10px;
        }

        .login-header h1 {
          font-size: 24px;
        }
      }
    `,
  ],
})
export class LoginComponent {
  readonly authService = inject(AuthService);

  loginWithGitHub(): void {
    this.authService.loginWithGitHub();
  }
}
