import React from 'react';
import { useData } from '@/components/DataContext';
import DashboardAdmin from '@/components/dashboard/DashboardAdmin';
import DashboardClinica from '@/components/dashboard/DashboardClinica';
import DashboardOrientador from '@/components/dashboard/DashboardOrientador';
import DashboardFamilia from '@/components/dashboard/DashboardFamilia';

const Dashboard = () => {
  const { currentUser, isLoading } = useData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No autenticado</h2>
        <p className="text-gray-600">Por favor, inicia sesión para acceder al dashboard.</p>
      </div>
    );
  }

  // Renderizar dashboard específico según el tipo de usuario
  const renderDashboard = () => {
    switch (currentUser.user_type) {
      case 'administrador':
        return <DashboardAdmin />;
      case 'clinica':
        return <DashboardClinica />;
      case 'orientador':
        return <DashboardOrientador />;
      case 'examinador':
        return <DashboardAdmin />; // Por ahora usar el mismo que admin
      case 'familia':
        return <DashboardFamilia />;
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard no disponible</h2>
            <p className="text-gray-600">Tu tipo de usuario no tiene un dashboard configurado.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ¡Bienvenido, {currentUser.full_name}!
            </h1>
            <p className="text-gray-600 mt-1">
              {currentUser.user_type === 'administrador' && 'Panel de administración del sistema'}
              {currentUser.user_type === 'clinica' && 'Panel clínico - Gestión de evaluaciones'}
              {currentUser.user_type === 'orientador' && 'Panel de orientación educativa'}
              {currentUser.user_type === 'examinador' && 'Panel de examinador'}
              {currentUser.user_type === 'familia' && 'Panel familiar - Seguimiento de tu hijo/a'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Última conexión</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date().toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard específico */}
      {renderDashboard()}
    </div>
  );
};

export default Dashboard;

