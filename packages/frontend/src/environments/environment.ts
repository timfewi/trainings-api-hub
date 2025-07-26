// packages/frontend/src/environments/environment.ts

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  appName: 'API Sandbox',
  version: '1.0.0',
  enableLogging: true,
  features: {
    registration: true,
    instanceManagement: true,
    apiDocumentation: true,
  },
};
