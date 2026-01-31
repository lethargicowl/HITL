export type UserRole = 'requester' | 'rater';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  message: string;
  user: User;
}
