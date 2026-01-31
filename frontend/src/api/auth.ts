import apiClient from './client';
import { User, LoginCredentials, RegisterCredentials, AuthResponse } from '@/types';

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
  return response.data;
}

export async function register(credentials: RegisterCredentials): Promise<User> {
  const response = await apiClient.post<User>('/auth/register', credentials);
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
}
