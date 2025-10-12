import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const getCurrentUser = useAuthStore((state) => state.getCurrentUser);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');

      if (!token || !refreshToken) {
        // No tokens, redirect to login with error
        navigate('/login?error=auth_failed');
        return;
      }

      try {
        // Store tokens in localStorage
        localStorage.setItem('emooti_token', token);
        localStorage.setItem('emooti_refresh_token', refreshToken);

        // Update auth store
        useAuthStore.setState({
          token,
          refreshToken,
          isAuthenticated: true,
        });

        // Get current user data
        await getCurrentUser();

        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Error in auth callback:', error);
        navigate('/login?error=auth_failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate, getCurrentUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Iniciando sesión...</p>
      </div>
    </div>
  );
}
