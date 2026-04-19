import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TOKEN_KEY = 'auth_token';

// Set up axios interceptor to attach token to all requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = checking, false = not auth, object = auth
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(false);
      setLoading(false);
      return;
    }
    try {
      const { data } = await axios.get(`${API}/auth/me`);
      setUser(data);
    } catch (e) {
      localStorage.removeItem(TOKEN_KEY);
      setUser(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    // If 2FA is enabled, server returns { requires_2fa: true, pending_token }
    if (data.requires_2fa) {
      return { requires_2fa: true, pending_token: data.pending_token, email: data.email };
    }
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    setUser(data);
    if (data.role === 'super_admin' || data.role === 'sub_admin') {
      return { ...data, redirectTo: '/admin' };
    } else if (data.role === 'shop_owner') {
      return { ...data, redirectTo: '/dashboard' };
    } else if (data.role === 'agent') {
      return { ...data, redirectTo: '/agent' };
    }
    return data;
  };

  const verify2FA = async (pending_token, code) => {
    const { data } = await axios.post(`${API}/auth/2fa/verify`, { pending_token, code });
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    setUser(data);
    if (data.role === 'super_admin' || data.role === 'sub_admin') {
      return { ...data, redirectTo: '/admin' };
    } else if (data.role === 'shop_owner') {
      return { ...data, redirectTo: '/dashboard' };
    }
    return data;
  };

  const register = async (email, password, name) => {
    const { data } = await axios.post(`${API}/auth/register`, { email, password, name });
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    setUser(data);
    return data;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {});
    } catch (e) { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY);
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth, verify2FA }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
