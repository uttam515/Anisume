export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string | null;
  bio?: string;
  favoriteGenres: string[];
  isEmailVerified: boolean;
  emailVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUserProfile {
  username: string;
  avatar?: string | null;
  bio?: string;
  favoriteGenres: string[];
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  csrfToken: string;
}

export interface RegisterDTO {
  username: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  identifier: string; // email or username
  password: string;
}

export interface UpdateProfileDTO {
  avatar?: string | null;
  bio?: string;
  favoriteGenres?: string[];
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}

export interface VerifyEmailDTO {
  token: string;
}

