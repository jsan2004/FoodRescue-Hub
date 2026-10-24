import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('food_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        setUser(res.user);
      } catch (err) {
        console.warn('Session expired or invalid token');
        localStorage.removeItem('food_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  async function login(email, password) {
    const res = await api.login(email, password);
    localStorage.setItem('food_token', res.token);
    setUser(res.user);
    return res.user;
  }

  async function register(userData) {
    const res = await api.register(userData);
    localStorage.setItem('food_token', res.token);
    setUser(res.user);
    return res.user;
  }

  async function updateProfile(profileData) {
    const res = await api.updateProfile(profileData);
    setUser(res.user);
    return res;
  }

  function updateUser(updatedUser) {
    setUser(updatedUser);
  }

  function logout() {
    localStorage.removeItem('food_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role || null,
      loading,
      login,
      register,
      logout,
      updateProfile,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
