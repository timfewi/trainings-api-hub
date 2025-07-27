// shared/types/user.ts

/**
 * User authentication interface (GitHub OAuth)
 * Only non-sensitive fields are included. Do not add password or other secrets.
 */
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  githubId: string;
  avatarUrl?: string;
  githubUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * JWT authentication token interface
 */
export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

/**
 * User profile response interface
 * Inherits only non-sensitive fields from User.
 */
export interface UserProfile extends User {
  instanceCount?: number;
  lastActiveAt?: Date;
}
