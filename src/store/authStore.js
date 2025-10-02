import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../lib/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.auth.login(credentials);
          const { user, token, refreshToken } = response.data.data;
          
          set({
            user,
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          // Store tokens in localStorage
          localStorage.setItem('emooti_token', token);
          localStorage.setItem('emooti_refresh_token', refreshToken);
          
          return { success: true, user };
        } catch (error) {
          const errorMessage = error.response?.data?.error?.message || 'Error al iniciar sesión';
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await apiClient.auth.logout();
        } catch (error) {
          console.error('Error during logout:', error);
        } finally {
          // Clear state regardless of API call success
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          
          // Clear localStorage
          localStorage.removeItem('emooti_token');
          localStorage.removeItem('emooti_refresh_token');
        }
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;
        
        set({ isLoading: true });
        
        try {
          const response = await apiClient.auth.refresh(refreshToken);
          const { token, refreshToken: newRefreshToken } = response.data.data;
          
          set({
            token,
            refreshToken: newRefreshToken,
            isLoading: false,
          });
          
          // Update localStorage
          localStorage.setItem('emooti_token', token);
          localStorage.setItem('emooti_refresh_token', newRefreshToken);
          
          return true;
        } catch (error) {
          console.error('Error refreshing token:', error);
          // If refresh fails, logout user
          get().logout();
          return false;
        }
      },

      getCurrentUser: async () => {
        set({ isLoading: true });
        
        try {
          const response = await apiClient.auth.me();
          const user = response.data.data;
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          return user;
        } catch (error) {
          const errorMessage = error.response?.data?.error?.message || 'Error al obtener usuario';
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          return null;
        }
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },

      clearError: () => {
        set({ error: null });
      },

      // Initialize auth from localStorage
      initializeAuth: () => {
        const token = localStorage.getItem('emooti_token');
        const refreshToken = localStorage.getItem('emooti_refresh_token');
        
        if (token && refreshToken) {
          set({
            token,
            refreshToken,
            isAuthenticated: true,
          });
          
          // Try to get current user
          get().getCurrentUser();
        }
      },

      // Check if user has specific role
      hasRole: (role) => {
        const { user } = get();
        return user?.userType === role;
      },

      // Check if user has any of the specified roles
      hasAnyRole: (roles) => {
        const { user } = get();
        return roles.includes(user?.userType);
      },

      // Check if user can access center
      canAccessCenter: (centerId) => {
        const { user } = get();
        if (!user) return false;
        
        // Admin can access all centers
        if (user.userType === 'ADMINISTRADOR') return true;
        
        // Check if user's center matches or is in centerIds array
        return user.centerId === centerId || 
               (user.centerIds && user.centerIds.includes(centerId));
      },

      // Get user's accessible centers
      getAccessibleCenters: () => {
        const { user } = get();
        if (!user) return [];
        
        // Admin can access all centers (would need to fetch from API)
        if (user.userType === 'ADMINISTRADOR') return ['all'];
        
        // Return user's centers
        const centers = [];
        if (user.centerId) centers.push(user.centerId);
        if (user.centerIds) centers.push(...user.centerIds);
        
        return centers;
      },
    }),
    {
      name: 'emooti-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
