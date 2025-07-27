// packages/frontend/src/app/components/dashboard/dashboard.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '@trainings-api-hub/shared';

/**
 * Main dashboard component for authenticated users
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <div class="header-content">
          <h1>Training API Hub</h1>
          <div class="user-info">
            @if (authService.currentUser(); as user) {
              <div class="user-profile">
                <img
                  [src]="getUserAvatar(user)"
                  [alt]="user.username + ' avatar'"
                  class="avatar"
                />
                <div class="user-details">
                  <span class="username">{{ user.username }}</span>
                  <span class="email">{{ user.email }}</span>
                </div>
              </div>
            }
            <button
              class="logout-btn"
              (click)="logout()"
              [disabled]="authService.isLoading()"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main class="dashboard-main">
        <div class="welcome-section">
          <h2>Welcome to Your API Training Hub!</h2>
          <p>
            Create and manage API instances for learning and development.
            Perfect for students and developers who want to practice working
            with REST APIs.
          </p>
        </div>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🚀</div>
            <h3>API Instances</h3>
            <p>Create your own API instances with sample e-commerce data</p>
            <button class="feature-btn" disabled>Coming Soon</button>
          </div>

          <div class="feature-card">
            <div class="feature-icon">📖</div>
            <h3>Documentation</h3>
            <p>Interactive API documentation with examples and testing tools</p>
            <button class="feature-btn" disabled>Coming Soon</button>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🔧</div>
            <h3>API Testing</h3>
            <p>Built-in testing tools to experiment with different endpoints</p>
            <button class="feature-btn" disabled>Coming Soon</button>
          </div>

          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Analytics</h3>
            <p>Monitor your API usage and learn about performance patterns</p>
            <button class="feature-btn" disabled>Coming Soon</button>
          </div>
        </div>

        <div class="status-section">
          <h3>Authentication Status</h3>
          <div class="status-info">
            @if (authService.currentUser(); as user) {
              <div class="status-item">
                <span class="label">Logged in as:</span>
                <span class="value">{{ user.username }}</span>
              </div>
              <div class="status-item">
                <span class="label">GitHub ID:</span>
                <span class="value">{{ user.id }}</span>
              </div>
              <div class="status-item">
                <span class="label">Email:</span>
                <span class="value">{{ user.email }}</span>
              </div>
              <div class="status-item">
                <span class="label">Member since:</span>
                <span class="value">{{
                  formatDate(user.createdAt.toString())
                }}</span>
              </div>
            }
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        min-height: 100vh;
        background: #f7fafc;
      }

      .dashboard-header {
        background: white;
        border-bottom: 1px solid #e2e8f0;
        padding: 16px 0;
      }

      .header-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .header-content h1 {
        margin: 0;
        color: #2d3748;
        font-size: 24px;
        font-weight: 700;
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .user-profile {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid #e2e8f0;
      }

      .user-details {
        display: flex;
        flex-direction: column;
      }

      .username {
        font-weight: 600;
        color: #2d3748;
        font-size: 14px;
      }

      .email {
        font-size: 12px;
        color: #718096;
      }

      .logout-btn {
        padding: 8px 16px;
        background: #e53e3e;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      }

      .logout-btn:hover:not(:disabled) {
        background: #c53030;
      }

      .logout-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .dashboard-main {
        max-width: 1200px;
        margin: 0 auto;
        padding: 32px 24px;
      }

      .welcome-section {
        text-align: center;
        margin-bottom: 48px;
      }

      .welcome-section h2 {
        margin: 0 0 16px 0;
        color: #2d3748;
        font-size: 32px;
        font-weight: 700;
      }

      .welcome-section p {
        margin: 0;
        color: #4a5568;
        font-size: 18px;
        line-height: 1.6;
        max-width: 600px;
        margin: 0 auto;
      }

      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 24px;
        margin-bottom: 48px;
      }

      .feature-card {
        background: white;
        border-radius: 12px;
        padding: 24px;
        text-align: center;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        border: 1px solid #e2e8f0;
        transition:
          transform 0.2s,
          box-shadow 0.2s;
      }

      .feature-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
      }

      .feature-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .feature-card h3 {
        margin: 0 0 12px 0;
        color: #2d3748;
        font-size: 20px;
        font-weight: 600;
      }

      .feature-card p {
        margin: 0 0 20px 0;
        color: #4a5568;
        font-size: 14px;
        line-height: 1.5;
      }

      .feature-btn {
        padding: 10px 20px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      }

      .feature-btn:hover:not(:disabled) {
        background: #5a67d8;
      }

      .feature-btn:disabled {
        background: #a0aec0;
        cursor: not-allowed;
      }

      .status-section {
        background: white;
        border-radius: 12px;
        padding: 24px;
        border: 1px solid #e2e8f0;
      }

      .status-section h3 {
        margin: 0 0 20px 0;
        color: #2d3748;
        font-size: 18px;
        font-weight: 600;
      }

      .status-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
      }

      .status-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #f7fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .label {
        font-weight: 500;
        color: #4a5568;
        font-size: 14px;
      }

      .value {
        font-weight: 600;
        color: #2d3748;
        font-size: 14px;
      }

      @media (max-width: 768px) {
        .header-content {
          flex-direction: column;
          gap: 16px;
          text-align: center;
        }

        .user-info {
          flex-direction: column;
          gap: 12px;
        }

        .dashboard-main {
          padding: 24px 16px;
        }

        .welcome-section h2 {
          font-size: 24px;
        }

        .features-grid {
          grid-template-columns: 1fr;
        }

        .status-info {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    // Redirect to login if not authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  logout(): void {
    this.authService.logout();
  }

  getUserAvatar(user: User): string {
    return (
      user.avatarUrl ||
      `https://github.com/identicons/${user.username}.png`
    );
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
