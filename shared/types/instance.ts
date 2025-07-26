// shared/types/instance.ts

/**
 * API instance status enumeration
 */
export enum InstanceStatus {
  CREATING = 'creating',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error',
}

/**
 * API instance interface
 */
export interface ApiInstance {
  id: string;
  userId: string;
  containerId: string;
  url: string;
  port: number;
  status: InstanceStatus;
  createdAt: Date;
  updatedAt: Date;
  stoppedAt?: Date;
}

/**
 * API instance creation request interface
 */
export interface CreateInstanceRequest {
  name?: string;
  description?: string;
}

/**
 * API instance response interface
 */
export interface InstanceResponse extends Omit<ApiInstance, 'containerId'> {
  endpoints: InstanceEndpoint[];
  uptime?: number;
}

/**
 * Available API endpoints in an instance
 */
export interface InstanceEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  requestBody?: Record<string, unknown>;
  responseExample?: Record<string, unknown>;
}
