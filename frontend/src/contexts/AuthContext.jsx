import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Set the token in the API client
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verify token and get user info
          const response = await apiClient.get('/auth/me');
          setUser(response.data.data);
        } catch (error) {
          console.error('Token verification failed:', error);
          // Token is invalid, remove it
          localStorage.removeItem('token');
          setToken(null);
          delete apiClient.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      const { token: newToken, user: userData } = response.data.data;
      
      // Store token
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      // Set token in API client
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Set user
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error de autenticación',
      };
    }
  };

  const logout = () => {
    // Remove token
    localStorage.removeItem('token');
    setToken(null);
    
    // Remove token from API client
    delete apiClient.defaults.headers.common['Authorization'];
    
    // Clear user
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

