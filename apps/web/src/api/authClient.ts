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

const API_BASE = '/api';

/**
 * Extracts the CSRF token from document.cookie (named 'anisume_csrf').
 */
function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^|;\\s*)anisume_csrf=([^;]*)'));
  return match && match[2] ? decodeURIComponent(match[2]) : '';
}

/**
 * Robust JSON request wrapper supporting HTTP-only cookie sessions and automatic CSRF header injection.
 */
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  // Double Submit Cookie pattern: Attach X-CSRF-Token on all state-changing requests
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Always send and receive HTTP-only cookies
  });

  let data: any = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  }

  if (!res.ok) {
    let errorMsg = data?.error || data?.message;
    if (!errorMsg) {
      if (res.status === 500 || res.status === 502 || res.status === 504) {
        errorMsg = 'Cannot reach backend server. Please verify the API server is running on port 4000.';
      } else {
        errorMsg = `API error ${res.status}: ${res.statusText}`;
      }
    }
    const error = new Error(errorMsg);
    (error as any).code = data?.code;
    (error as any).status = res.status;
    throw error;
  }

  return data as T;
}

export const authApi = {
  /**
   * Retrieves the currently authenticated user from session cookie.
   */
  getMe: async (): Promise<{ user: User | null; csrfToken: string }> => {
    return request<{ user: User | null; csrfToken: string }>(`${API_BASE}/auth/me`);
  },

  /**
   * Registers a new account.
   */
  register: async (dto: RegisterDTO): Promise<{ user: User; message: string; csrfToken: string }> => {
    return request<{ user: User; message: string; csrfToken: string }>(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Logs in with email or username and password.
   */
  login: async (dto: LoginDTO): Promise<{ user: User; message: string; csrfToken: string }> => {
    return request<{ user: User; message: string; csrfToken: string }>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
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

