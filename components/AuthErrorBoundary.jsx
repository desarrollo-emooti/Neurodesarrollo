import React from 'react';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

class AuthErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el state para mostrar la UI de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log del error
    console.error('AuthErrorBoundary capturó un error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Si es un error de autenticación, intentar logout
    if (error.message?.includes('Unauthorized') || 
        error.message?.includes('authentication') ||
        error.message?.includes('token')) {
      this.handleAuthError();
    }
  }

  handleAuthError = async () => {
    try {
      // Importar User dinámicamente para evitar dependencias circulares
      const { User } = await import('@/entities/User');
      await User.logout();
    } catch (logoutError) {
      console.error('Error durante logout:', logoutError);
    }
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleLogout = async () => {
    try {
      const { User } = await import('@/entities/User');
      await User.logout();
    } catch (error) {
      console.error('Error durante logout:', error);
      // Forzar redirección a login
      window.location.href = '/login';
    }
  };

  render() {
    if (this.state.hasError) {
      const isAuthError = this.state.error?.message?.includes('Unauthorized') ||
                         this.state.error?.message?.includes('authentication') ||
                         this.state.error?.message?.includes('token');

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                {isAuthError ? 'Error de Autenticación' : 'Error del Sistema'}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {isAuthError 
                  ? 'Tu sesión ha expirado o no tienes permisos para acceder a esta función.'
                  : 'Ha ocurrido un error inesperado en la aplicación.'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {!isAuthError && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 font-medium mb-1">Detalles del error:</p>
                  <p className="text-xs text-gray-500 font-mono break-all">
                    {this.state.error?.message || 'Error desconocido'}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={this.handleRetry}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar
                </Button>
                
                {isAuthError && (
                  <Button 
                    onClick={this.handleLogout}
                    className="w-full"
                    variant="outline"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                )}
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Si el problema persiste, contacta al administrador del sistema.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;

