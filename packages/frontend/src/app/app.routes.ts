import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthService } from './services/auth.service';
import { map } from 'rxjs';

// Auth guard that waits for initialization to complete
const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.waitForInitialization().pipe(
    map((isAuthenticated: boolean) => {
      if (isAuthenticated) {
        return true;
      } else {
        router.navigate(['/login']);
        return false;
      }
    }),
  );
};

// Guard for login page when already authenticated
const loginGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.waitForInitialization().pipe(
    map((isAuthenticated: boolean) => {
      if (isAuthenticated) {
        router.navigate(['/dashboard']);
        return false;
      }
      return true;
    }),
  );
};

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [loginGuard],
  },
  { path: 'auth/callback', component: AuthCallbackComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '/dashboard' },
];
