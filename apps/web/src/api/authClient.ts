import type {
  User,
  PublicUserProfile,
  RegisterDTO,
  LoginDTO,
  UpdateProfileDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  VerifyEmailDTO,
} from '@anisume/shared';
import { API_BASE, apiRequest as request, setCsrfToken } from './config.js';

export const authApi = {
  /**
   * Retrieves the currently authenticated user from session cookie.
   */
  getMe: async (): Promise<{ user: User | null; csrfToken: string }> => {
    const res = await request<{ user: User | null; csrfToken: string }>(`${API_BASE}/auth/me`);
    if (res.csrfToken) {
      setCsrfToken(res.csrfToken);
    }
    return res;
  },

  /**
   * Registers a new account.
   */
  register: async (dto: RegisterDTO): Promise<{ user: User; message: string; csrfToken: string }> => {
    const res = await request<{ user: User; message: string; csrfToken: string }>(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    if (res.csrfToken) {
      setCsrfToken(res.csrfToken);
    }
    return res;
  },

  /**
   * Logs in with email or username and password.
   */
  login: async (dto: LoginDTO): Promise<{ user: User; message: string; csrfToken: string }> => {
    const res = await request<{ user: User; message: string; csrfToken: string }>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    if (res.csrfToken) {
      setCsrfToken(res.csrfToken);
    }
    return res;
  },

  /**
   * Logs out the current session and clears cookies.
   */
  logout: async (): Promise<{ message: string }> => {
    return request<{ message: string }>(`${API_BASE}/auth/logout`, {
      method: 'POST',
    });
  },

  /**
   * Updates the authenticated user's own profile (avatar, bio, favoriteGenres).
   */
  updateProfile: async (dto: UpdateProfileDTO): Promise<{ user: User; message: string }> => {
    return request<{ user: User; message: string }>(`${API_BASE}/users/me`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Retrieves a public user profile by username.
   */
  getPublicProfile: async (username: string): Promise<{ user: PublicUserProfile }> => {
    return request<{ user: PublicUserProfile }>(`${API_BASE}/users/${encodeURIComponent(username)}`);
  },

  /**
   * Verifies email address using single-use cryptographic token.
   */
  verifyEmail: async (dto: VerifyEmailDTO): Promise<{ user: User; message: string }> => {
    return request<{ user: User; message: string }>(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Resends email verification link.
   */
  resendVerification: async (email?: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`${API_BASE}/auth/resend-verification`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Initiates password reset recovery.
   */
  forgotPassword: async (dto: ForgotPasswordDTO): Promise<{ message: string }> => {
    return request<{ message: string }>(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Completes password reset with new password.
   */
  resetPassword: async (dto: ResetPasswordDTO): Promise<{ message: string }> => {
    return request<{ message: string }>(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },
};

