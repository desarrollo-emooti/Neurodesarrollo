import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import {
  Users,
  GraduationCap,
  Building2,
  ClipboardList,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { apiClient } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { formatNumber } from '../lib/utils';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);

  // Fetch dashboard statistics
  const { data: dashboardData, isLoading } = useQuery(
    'dashboard-stats',
    () => apiClient.statistics.getDashboard(),
    {
      enabled: !!user,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  useEffect(() => {
    if (dashboardData?.data) {
      setStats(dashboardData.data);
    }
  }, [dashboardData]);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Get user-specific dashboard content
  const getUserDashboardContent = () => {
    switch (user?.userType) {
      case 'ADMINISTRADOR':
        return {
          title: 'Panel de Administración',
          description: 'Gestiona usuarios, centros y configuración del sistema',
          stats: [
            { label: 'Total Usuarios', value: stats?.totalUsers || 0, icon: Users, color: 'blue' },
            { label: 'Total Alumnos', value: stats?.totalStudents || 0, icon: GraduationCap, color: 'green' },
            { label: 'Centros Activos', value: stats?.activeCenters || 0, icon: Building2, color: 'purple' },
            { label: 'Pruebas Realizadas', value: stats?.completedTests || 0, icon: CheckCircle, color: 'emerald' },
            { label: 'Pruebas Pendientes', value: stats?.pendingTests || 0, icon: Clock, color: 'orange' },
            { label: 'Usuarios Sin Confirmar', value: stats?.pendingUsers || 0, icon: AlertTriangle, color: 'red' },
          ],
        };
      
      case 'CLINICA':
        return {
          title: 'Panel Clínico',
          description: 'Gestiona evaluaciones y resultados de pruebas',
          stats: [
            { label: 'Alumnos Asignados', value: stats?.assignedStudents || 0, icon: GraduationCap, color: 'green' },
            { label: 'Evaluaciones Pendientes', value: stats?.pendingEvaluations || 0, icon: ClipboardList, color: 'orange' },
            { label: 'Informes por Validar', value: stats?.pendingReports || 0, icon: AlertTriangle, color: 'red' },
            { label: 'Evaluaciones Completadas', value: stats?.completedEvaluations || 0, icon: CheckCircle, color: 'emerald' },
          ],
        };
      
      case 'ORIENTADOR':
        return {
          title: 'Panel de Orientación',
          description: 'Gestiona alumnos y evaluaciones de tu centro',
          stats: [
            { label: 'Alumnos del Centro', value: stats?.centerStudents || 0, icon: GraduationCap, color: 'green' },
            { label: 'Evaluaciones Programadas', value: stats?.scheduledEvaluations || 0, icon: Calendar, color: 'blue' },
            { label: 'Informes Disponibles', value: stats?.availableReports || 0, icon: CheckCircle, color: 'emerald' },
            { label: 'Eventos Pendientes', value: stats?.pendingEvents || 0, icon: AlertTriangle, color: 'orange' },
          ],
        };
      
      case 'EXAMINADOR':
        return {
          title: 'Panel de Examinador',
          description: 'Gestiona las pruebas asignadas',
          stats: [
            { label: 'Pruebas Asignadas', value: stats?.assignedTests || 0, icon: ClipboardList, color: 'blue' },
            { label: 'Pruebas Completadas', value: stats?.completedTests || 0, icon: CheckCircle, color: 'green' },
            { label: 'Pruebas Pendientes', value: stats?.pendingTests || 0, icon: Clock, color: 'orange' },
          ],
        };
      
      case 'FAMILIA':
        return {
          title: 'Panel Familiar',
          description: 'Consulta información de tus hijos',
          stats: [
            { label: 'Hijos Registrados', value: stats?.childrenCount || 0, icon: GraduationCap, color: 'green' },
            { label: 'Evaluaciones Recientes', value: stats?.recentEvaluations || 0, icon: CheckCircle, color: 'blue' },
            { label: 'Informes Disponibles', value: stats?.availableReports || 0, icon: BarChart3, color: 'purple' },
            { label: 'Próximas Evaluaciones', value: stats?.upcomingEvaluations || 0, icon: Calendar, color: 'orange' },
          ],
        };
      
      default:
        return {
          title: 'Dashboard',
          description: 'Bienvenido a EMOOTI',
          stats: [],
        };
    }
  };

  const dashboardContent = getUserDashboardContent();

  const StatCard = ({ stat, index }) => {
    const Icon = stat.icon;
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      emerald: 'from-emerald-500 to-emerald-600',
      orange: 'from-orange-500 to-orange-600',
      red: 'from-red-500 to-red-600',
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Card className="emooti-card hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : formatNumber(stat.value)}
                </p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[stat.color]} rounded-xl flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Usuario'}
            </h1>
            <p className="text-slate-600 mt-1">
              {dashboardContent.description}
            </p>
          </div>
          <Badge variant="info" className="text-sm">
            {user?.userType}
          </Badge>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {dashboardContent.stats.map((stat, index) => (
          <StatCard key={stat.label} stat={stat} index={index} />
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="emooti-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Actividad Reciente</span>
            </CardTitle>
            <CardDescription>
              Últimas actividades en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center text-slate-500 py-8">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No hay actividad reciente</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="emooti-card">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Accesos directos a las funciones más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {user?.userType === 'ADMINISTRADOR' && (
                <>
                  <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-center">
                    <Users className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-medium">Gestionar Usuarios</p>
                  </button>
                  <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-center">
                    <Building2 className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-medium">Gestionar Centros</p>
                  </button>
                </>
              )}
              
              {(user?.userType === 'CLINICA' || user?.userType === 'ORIENTADOR') && (
                <>
                  <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-center">
                    <GraduationCap className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-medium">Gestionar Alumnos</p>
                  </button>
                  <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-center">
                    <ClipboardList className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-medium">Asignar Pruebas</p>
                  </button>
                </>
              )}
              
              <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-center">
                <Calendar className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-medium">Ver Agenda</p>
              </button>
              
              <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-center">
                <BarChart3 className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-medium">Ver Reportes</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
