import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('cc_user');
    try { return cached ? JSON.parse(cached) : null; } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('cc_token') || null);
  const [loading, setLoading] = useState(true);

  // ─── Core Logout Logic ───
  const logout = useCallback(() => {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    setToken(null);
    setUser(null);
  }, []);

  // ─── Global 401 Listener ───
  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, [logout]);

  // On mount: verify stored token
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('cc_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getMe();
        const verifiedUser = response.data.data.user;
        setUser(verifiedUser);
        localStorage.setItem('cc_user', JSON.stringify(verifiedUser));
        setToken(storedToken);
      } catch (err) {
        // If the token is rejected with 401, the interceptor will emit auth-unauthorized and clear it
        if (err?.response?.status !== 401) {
          // Network failure or 500 — keep the user logged in using cached data
          setToken(storedToken);
        }
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = useCallback(async (email, password) => {
    // Clear any stale state before attempting login
    logout();
    const response = await authService.login(email, password);
    const { token: newToken, user: userData } = response.data.data;
    localStorage.setItem('cc_token', newToken);
    localStorage.setItem('cc_user', JSON.stringify(userData));
    localStorage.setItem('lastKnownUser', JSON.stringify({ email: userData.email, name: userData.name }));
    setToken(newToken);
    setUser(userData);
    return userData;
  }, [logout]);

  const register = useCallback(async (name, email, password) => {
    logout();
    const response = await authService.register(name, email, password);
    const { token: newToken, user: userData } = response.data.data;
    localStorage.setItem('cc_token', newToken);
    localStorage.setItem('cc_user', JSON.stringify(userData));
    localStorage.setItem('lastKnownUser', JSON.stringify({ email: userData.email, name: userData.name }));
    setToken(newToken);
    setUser(userData);
    return userData;
  }, [logout]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getMe();
      setUser(response.data.data.user);
      localStorage.setItem('cc_user', JSON.stringify(response.data.data.user));
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
