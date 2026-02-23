import React, { createContext, useContext, useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:4000' : '');

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage once on mount
  useEffect(() => {
    let cancelled = false;
    try {
      const stored = window.localStorage.getItem('libraryco-auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!cancelled && parsed.token && parsed.user) {
          setToken(parsed.token);
          setUser(parsed.user);
        }
      }
    } catch {
      // ignore
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const saveAuth = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    window.localStorage.setItem('libraryco-auth', JSON.stringify({ token: nextToken, user: nextUser }));
  };

  const clearAuth = () => {
    setToken(null);
    setUser(null);
    window.localStorage.removeItem('libraryco-auth');
  };

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg =
        body.error ||
        (Array.isArray(body.errors) && body.errors[0]?.msg) ||
        'Login failed';
      throw new Error(msg);
    }
    const json = await res.json();
    saveAuth(json.token, json.user);
    return json.user;
  };

  const register = async (email, password, displayName) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg =
        body.error ||
        (Array.isArray(body.errors) && body.errors[0]?.msg) ||
        'Registration failed';
      throw new Error(msg);
    }
    const json = await res.json();
    saveAuth(json.token, json.user);
    return json.user;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout: clearAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
