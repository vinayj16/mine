// Authentication utilities
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  permissions: string[];
}

export const getToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

export const setToken = (token: string): void => {
  localStorage.setItem('accessToken', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('accessToken');
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
};

export const setRefreshToken = (token: string): void => {
  localStorage.setItem('refreshToken', token);
};

export const removeRefreshToken = (): void => {
  localStorage.removeItem('refreshToken');
};

export const getUser = (): AuthUser | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const setUser = (user: AuthUser): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const removeUser = (): void => {
  localStorage.removeItem('user');
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  const user = getUser();
  return !!(token && user);
};

export const logout = (): void => {
  removeToken();
  removeRefreshToken();
  removeUser();
};

export const hasPermission = (permission: string): boolean => {
  const user = getUser();
  if (!user || !user.permissions) return false;
  
  return user.permissions.includes(permission);
};

export const hasRole = (role: string): boolean => {
  const user = getUser();
  if (!user) return false;
  
  return user.role === role;
};

export const isAdmin = (): boolean => {
  return hasRole('admin') || hasRole('super_admin');
};

export const isTeacher = (): boolean => {
  return hasRole('teacher');
};

export const isStudent = (): boolean => {
  return hasRole('student');
};

export const isParent = (): boolean => {
  return hasRole('parent');
};

// JWT token utilities
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

export const getTokenExpirationTime = (token: string): number => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch (error) {
    console.error('Error getting token expiration time:', error);
    return 0;
  }
};

// Auto logout utility
export const setupAutoLogout = (): void => {
  const token = getToken();
  if (!token) return;

  const expirationTime = getTokenExpirationTime(token);
  const currentTime = Date.now();
  const timeUntilExpiration = expirationTime - currentTime;

  if (timeUntilExpiration > 0) {
    setTimeout(() => {
      console.log('Token expired, logging out...');
      logout();
      window.location.href = '/login';
    }, timeUntilExpiration);
  }
};

// Refresh token utility
export const refreshTokenIfNeeded = async (): Promise<boolean> => {
  const token = getToken();
  if (!token) return false;

  if (isTokenExpired(token)) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      // This would call the refresh endpoint
      // For now, we'll just return false to indicate refresh is needed
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  }

  return true;
};