export type UserRole = 'customer' | 'seller' | 'admin';

export interface User {
  _id?: string;
  email: string;
  password: string; // hashed
  displayName?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshToken {
  _id?: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface SignupRequest {
  email: string;
  password: string;
  displayName?: string;
  role?: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    displayName?: string;
    role: UserRole;
  };
  accessToken: string;
  refreshToken: string;
}
