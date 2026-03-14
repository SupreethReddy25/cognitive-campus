import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cc_token'));
  const [loading, setLoading] = useState(true);

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
        setUser(response.data.data.user);
        setToken(storedToken);
      } catch {
        localStorage.removeItem('cc_token');
        localStorage.removeItem('cc_user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authService.login(email, password);
    const { token: newToken, user: userData } = response.data.data;
    localStorage.setItem('cc_token', newToken);
    localStorage.setItem('cc_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const response = await authService.register(name, email, password);
    const { token: newToken, user: userData } = response.data.data;
    localStorage.setItem('cc_token', newToken);
    localStorage.setItem('cc_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
