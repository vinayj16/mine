import { apiClient } from './client';
import type { User } from '../utils/permissions';

// Types
export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: User['role'];
  institutionId?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  avatar?: string;
  preferences?: Record<string, any>;
}

class AuthService {
  /**
   * User login
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('[AuthService] Login attempt for:', credentials.email);
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);

      if (response.data.success && response.data.data) {
        const authData = response.data.data;
        console.log('[AuthService] Login successful, storing tokens');
        
        // Store tokens with user role
        this.setTokens(authData.accessToken, authData.refreshToken, authData.user);

        return authData;
      } else {
        console.error('[AuthService] Login failed:', response.data.message);
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('[AuthService] Login error:', error);

      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }

      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * User registration
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', userData);

      if (response.data.success && response.data.data) {
        const authData = response.data.data;

        // Store tokens with user role
        this.setTokens(authData.accessToken, authData.refreshToken, authData.user);

        return authData;
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);

      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }

      throw new Error(error.message || 'Registration failed');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post<AuthResponse>('/auth/refresh-token', {
        refreshToken
      });

      if (response.data.success && response.data.data) {
        const authData = response.data.data;

        // Update stored tokens (refresh doesn't return user, so don't pass user)
        this.setTokens(authData.accessToken, authData.refreshToken);

        return authData;
      } else {
        throw new Error(response.data.message || 'Token refresh failed');
      }
    } catch (error: any) {
      console.error('Token refresh error:', error);

      // Clear tokens on refresh failure
      this.clearTokens();

      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }

      throw new Error(error.message || 'Token refresh failed');
    }
  }

  /**
   * User logout
   */
  async logout(): Promise<void> {
    // Check if this is a demo user with mock token
    const token = localStorage.getItem('accessToken');
    const isDemoUser = token?.startsWith('mock-jwt-token-') || token?.startsWith('demo-');
    
    try {
      // Only call backend logout for real authenticated users
      if (!isDemoUser) {
        await apiClient.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local tokens
      this.clearTokens();
    }
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordData): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/auth/change-password', data);

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Password changed successfully'
        };
      } else {
        throw new Error(response.data.message || 'Password change failed');
      }
    } catch (error: any) {
      console.error('Change password error:', error);

      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }

      throw new Error(error.message || 'Password change failed');
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string; resetUrl?: string; resetToken?: string }> {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Password reset link sent',
          resetUrl: response.data.resetUrl, // For development only
          resetToken: response.data.resetToken // For development only
        };
      } else {
        throw new Error(response.data.message || 'Password reset request failed');
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);

      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }

      throw new Error(error.message || 'Password reset request failed');
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/auth/reset-password', {
        token,
        newPassword
      });

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Password reset successfully'
        };
      } else {
        throw new Error(response.data.message || 'Password reset failed');
      }
    } catch (error: any) {
      console.error('Reset password error:', error);

      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }

      throw new Error(error.message || 'Password reset failed');
    }
  }

  /**
   * Verify password reset token
   */
  async verifyResetToken(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/auth/verify-reset-token', { token });

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Token is valid'
        };
      } else {
        throw new Error(response.data.message || 'Token verification failed');
      }
    } catch (error: any) {
      console.error('Token verification error:', error);

      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }

      throw new Error(error.message || 'Token verification failed');
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    try {
      console.log('[AuthService] Getting user profile...');
      const response = await apiClient.get('/auth/profile');

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        console.log('[AuthService] Profile retrieved successfully');
        return (data.user ?? data) as User;
      } else {
        console.error('[AuthService] Profile fetch failed:', response.data.message);
        throw new Error(response.data.message || 'Failed to get profile');
      }
    } catch (error: any) {
      console.error('[AuthService] Get profile error:', error);

      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }

      throw new Error(error.message || 'Failed to get profile');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<{ success: boolean; message: string; user: User }> {
    try {
      const response = await apiClient.put('/auth/profile', data);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          message: response.data.message || 'Profile updated successfully',
          user: response.data.data.user
        };
      } else {
        throw new Error(response.data.message || 'Profile update failed');
      }
    } catch (error: any) {
      console.error('Update profile error:', error);

      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }

      throw new Error(error.message || 'Profile update failed');
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      // Basic check - decode token and check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;

      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Store authentication tokens
   */
  setTokens(accessToken: string, refreshToken: string, user?: any): void {
    console.log('[AuthService] Storing tokens for user authentication');
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Store user role for router navigation
    if (user?.role) {
      localStorage.setItem('userRole', user.role);
      console.log('[AuthService] Stored user role:', user.role);
    }
  }

  /**
   * Clear stored tokens
   */
  clearTokens(): void {
    console.log('[AuthService] Clearing all authentication tokens');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole'); // Also clear user role
  }

  /**
   * Get current user from token (without API call)
   */
  getCurrentUser(): User | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user || null;
    } catch {
      return null;
    }
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Super admin has all permissions
    if (user.role === 'superadmin') return true;

    // Check specific permissions
    return (
      user.permissions?.includes(permission) ||
      user.permissions?.includes('*') ||
      user.permissions?.includes(`${permission.split('.')[0]}.*`) ||
      false
    );
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: User['role']): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Check if user can access specific module
   */
  hasModuleAccess(module: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Super admin has access to all modules
    if (user.role === 'superadmin') return true;

    // Check user's modules
    return (
      user.modules?.includes(module) ||
      user.modules?.includes('*') ||
      false
    );
  }

  /**
   * Validate password strength (client-side)
   */
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Health check for auth service
   */
  async healthCheck(): Promise<{ status: string; message: string; authenticated: boolean }> {
    try {
      await apiClient.healthCheck();

      return {
        status: 'healthy',
        message: 'Auth service is operational',
        authenticated: this.isAuthenticated()
      };
    } catch {
      return {
        status: 'unhealthy',
        message: 'Auth service is not accessible',
        authenticated: false
      };
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;
