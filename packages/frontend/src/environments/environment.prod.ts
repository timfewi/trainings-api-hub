// packages/frontend/src/environments/environment.prod.ts

export const environment = {
  production: true,
  apiUrl: '/api',
  appName: 'API Sandbox',
  version: '1.0.0',
  enableLogging: false,
  features: {
    registration: true,
    instanceManagement: true,
    apiDocumentation: true,
  },
};
