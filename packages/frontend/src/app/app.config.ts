// packages/frontend/src/app/app.config.ts

import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { tokenInterceptor } from './interceptors/token.interceptor';
import { authInterceptor } from './interceptors/auth.interceptor';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // Order matters: tokenInterceptor first to handle tokens, then authInterceptor for auth logic
    provideHttpClient(withInterceptors([tokenInterceptor, authInterceptor])),
  ],
};
