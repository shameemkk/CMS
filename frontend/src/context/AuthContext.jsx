import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);
const USER_KEY = 'cms_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const loadUser = useCallback(async () => {
    const token = api.token.get();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.auth.me();
      setUser(response.user);
      setAuthError('');
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    } catch (error) {
      const cachedUser = localStorage.getItem(USER_KEY);
      if (cachedUser) {
        const parsed = JSON.parse(cachedUser);
        if (parsed?.role === 'admin') {
          setUser(parsed);
          setAuthError('');
          setLoading(false);
          return;
        }
      }
      api.token.clear();
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setAuthError(error.message || 'Session expired. Please login again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (payload) => {
    setAuthError('');
    const response = await api.auth.login(payload);
    api.token.set(response.token);
    setUser(response.user);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    return response.user;
  };

  const adminLogin = async (payload) => {
    setAuthError('');
    const response = await api.auth.adminLogin(payload);
    api.token.set(response.token);
    setUser(response.user);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    return response.user;
  };

  const register = async (payload) => {
    setAuthError('');
    return api.auth.register(payload);
  };

  const logout = () => {
    api.token.clear();
    api.auth.logout();
    setUser(null);
    localStorage.removeItem(USER_KEY);
  };

  const value = useMemo(
    () => ({
      user,
      role: user?.role,
      loading,
      authError,
      setAuthError,
      login,
      adminLogin,
      register,
      logout,
      refreshUser: loadUser,
    }),
    [user, loading, authError, loadUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

