/**
 * Authentication and User Types.
 */

export type UserRole = 'user' | 'vendor' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  cbu_cvu?: string;
  bank_alias?: string;
  vendor_status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  full_name: string;
  role: 'user' | 'vendor';
  phone?: string;
}
