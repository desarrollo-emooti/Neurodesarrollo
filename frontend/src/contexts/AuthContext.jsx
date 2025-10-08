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
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));

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

          // Try to refresh token if we have a refresh token
          if (refreshToken) {
            try {
              const refreshResponse = await apiClient.post('/auth/refresh', {
                refreshToken,
              });

              const { token: newToken, refreshToken: newRefreshToken } = refreshResponse.data.data;

              localStorage.setItem('token', newToken);
              localStorage.setItem('refreshToken', newRefreshToken);
              setToken(newToken);
              setRefreshToken(newRefreshToken);

              apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

              // Try again to get user
              const userResponse = await apiClient.get('/auth/me');
              setUser(userResponse.data.data);
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              // Both tokens are invalid, clear everything
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              setToken(null);
              setRefreshToken(null);
              delete apiClient.defaults.headers.common['Authorization'];
            }
          } else {
            // No refresh token, just clear the invalid token
            localStorage.removeItem('token');
            setToken(null);
            delete apiClient.defaults.headers.common['Authorization'];
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token, refreshToken]);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      const { token: newToken, refreshToken: newRefreshToken, user: userData } = response.data.data;

      // Store tokens
      localStorage.setItem('token', newToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      setToken(newToken);
      setRefreshToken(newRefreshToken);

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

  const handleOAuthCallback = async (accessToken, newRefreshToken) => {
    try {
      // Store tokens
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      setToken(accessToken);
      setRefreshToken(newRefreshToken);

      // Set token in API client
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      // Get user info
      const response = await apiClient.get('/auth/me');
      setUser(response.data.data);

      return { success: true };
    } catch (error) {
      console.error('OAuth callback failed:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error de autenticación OAuth',
      };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Remove tokens
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setRefreshToken(null);

      // Remove token from API client
      delete apiClient.defaults.headers.common['Authorization'];

      // Clear user
      setUser(null);
    }
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
    handleOAuthCallback,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

