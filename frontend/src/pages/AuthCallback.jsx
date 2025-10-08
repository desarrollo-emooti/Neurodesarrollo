import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError('Error de autenticación. Por favor, inténtalo de nuevo.');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (token && refreshToken) {
        try {
          await handleOAuthCallback(token, refreshToken);
          navigate('/dashboard', { replace: true });
        } catch (err) {
          console.error('OAuth callback error:', err);
          setError('Error procesando autenticación.');
          setTimeout(() => navigate('/login'), 3000);
        }
      } else {
        setError('Parámetros de autenticación inválidos.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate, handleOAuthCallback]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <div className="text-red-600 text-lg font-semibold">{error}</div>
            <p className="text-slate-600">Redirigiendo al login...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
            <p className="text-lg font-semibold text-slate-900">Procesando autenticación...</p>
            <p className="text-slate-600">Por favor espera un momento</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
