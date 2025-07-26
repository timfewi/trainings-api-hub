// shared/types/user.ts

/**
 * User authentication interface
 */
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User registration request interface
 */
export interface UserRegistrationRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * User login request interface
 */
export interface UserLoginRequest {
  email: string;
  password: string;
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
 */
export interface UserProfile extends Omit<User, 'password'> {
  instanceCount: number;
  lastActiveAt?: Date;
}
