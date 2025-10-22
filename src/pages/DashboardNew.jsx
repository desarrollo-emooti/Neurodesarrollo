import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
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
  Activity,
  LogIn,
  FileEdit,
  Trash2,
  Eye,
  Plus,
  Settings,
  FileText,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import useAuthStore from '../store/authStore';
import { apiClient } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { formatNumber } from '../lib/utils';

const Dashboard = () => {
  const navigate = useNavigate();
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

  // Fetch dashboard charts data
  const { data: chartsData, isLoading: isLoadingCharts } = useQuery(
    'dashboard-charts',
    () => apiClient.statistics.getDashboardCharts(),
    {
      enabled: !!user,
      refetchInterval: 60000, // Refetch every minute
    }
  );

  // Fetch user activity
  const { data: activityData, isLoading: isLoadingActivity } = useQuery(
    'user-activity',
    () => apiClient.profile.getActivity({ limit: 5, sortBy: 'timestamp', sortOrder: 'desc' }),
    {
      enabled: !!user,
      refetchInterval: 30000,
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
          quickActions: [
            { label: 'Gestionar Usuarios', icon: Users, route: '/users', color: 'blue' },
            { label: 'Gestionar Centros', icon: Building2, route: '/centers', color: 'purple' },
            { label: 'Ver Reportes', icon: BarChart3, route: '/reports', color: 'green' },
            { label: 'Configuración', icon: Settings, route: '/configuration', color: 'slate' },
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
          quickActions: [
            { label: 'Ver Alumnos', icon: GraduationCap, route: '/students', color: 'green' },
            { label: 'Evaluaciones', icon: ClipboardList, route: '/evaluations', color: 'blue' },
            { label: 'Informes', icon: FileText, route: '/reports', color: 'purple' },
            { label: 'Ver Agenda', icon: Calendar, route: '/agenda', color: 'orange' },
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
          quickActions: [
            { label: 'Gestionar Alumnos', icon: GraduationCap, route: '/students', color: 'green' },
            { label: 'Nueva Evaluación', icon: Plus, route: '/evaluations/new', color: 'blue' },
            { label: 'Ver Agenda', icon: Calendar, route: '/agenda', color: 'orange' },
            { label: 'Ver Reportes', icon: BarChart3, route: '/reports', color: 'purple' },
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
          quickActions: [
            { label: 'Ver Pruebas', icon: ClipboardList, route: '/tests', color: 'blue' },
            { label: 'Nueva Prueba', icon: Plus, route: '/tests/new', color: 'green' },
            { label: 'Ver Agenda', icon: Calendar, route: '/agenda', color: 'orange' },
            { label: 'Mis Resultados', icon: BarChart3, route: '/my-results', color: 'purple' },
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
          quickActions: [
            { label: 'Ver Hijos', icon: GraduationCap, route: '/my-children', color: 'green' },
            { label: 'Ver Informes', icon: FileText, route: '/reports', color: 'purple' },
            { label: 'Ver Agenda', icon: Calendar, route: '/agenda', color: 'orange' },
            { label: 'Contacto', icon: Users, route: '/contact', color: 'blue' },
          ],
        };

      default:
        return {
          title: 'Dashboard',
          description: 'Bienvenido a EMOOTI',
          stats: [],
          quickActions: [],
        };
    }
  };

  const dashboardContent = getUserDashboardContent();

  // Format chart data for date display
  const formatChartData = (data) => {
    if (!data) return [];
    return data.map(item => ({
      ...item,
      displayDate: format(new Date(item.date), 'dd MMM', { locale: es }),
    }));
  };

  // Get icon for activity action
  const getActivityIcon = (action) => {
    switch (action) {
      case 'LOGIN':
        return <LogIn className="w-5 h-5 text-blue-500" />;
      case 'DATA_MODIFICATION':
        return <FileEdit className="w-5 h-5 text-orange-500" />;
      case 'DATA_DELETION':
        return <Trash2 className="w-5 h-5 text-red-500" />;
      case 'DATA_ACCESS':
        return <Eye className="w-5 h-5 text-green-500" />;
      default:
        return <Activity className="w-5 h-5 text-slate-500" />;
    }
  };

  // Get activity description in Spanish
  const getActivityDescription = (log) => {
    const actionMap = {
      LOGIN: 'Inicio de sesión',
      DATA_ACCESS: 'Acceso a datos',
      DATA_MODIFICATION: 'Modificación de datos',
      DATA_DELETION: 'Eliminación de datos',
      DATA_EXPORT: 'Exportación de datos',
    };

    const action = actionMap[log.action] || log.action;
    const resource = log.resourceType || 'recurso';

    return `${action} - ${resource}`;
  };

  // Stat Card Component
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

  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-medium text-slate-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-slate-600">
              {entry.name}: <span className="font-semibold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
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

      {/* Charts Section - Gráficos y Análisis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Line Chart - Evolución de Tests Completados */}
        <Card className="emooti-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span>Evolución de Tests Completados</span>
            </CardTitle>
            <CardDescription>Últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCharts ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formatChartData(chartsData?.data?.testEvolution)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="displayDate"
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Tests Completados"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart - Tests por Estado */}
        <Card className="emooti-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <span>Tests por Estado</span>
            </CardTitle>
            <CardDescription>Distribución actual</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCharts ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartsData?.data?.testsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="status"
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    name="Tests"
                    fill="#8b5cf6"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Area Chart - Actividad Semanal */}
        <Card className="emooti-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              <span>Actividad Semanal</span>
            </CardTitle>
            <CardDescription>Usuarios activos por día (últimos 7 días)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCharts ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={formatChartData(chartsData?.data?.weeklyActivity)}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="displayDate"
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Usuarios Activos"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity Section */}
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
            {isLoadingActivity ? (
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
            ) : activityData?.data && activityData.data.length > 0 ? (
              <div className="space-y-4">
                {activityData.data.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start space-x-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {getActivityDescription(log)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDistanceToNow(new Date(log.timestamp), {
                          addSuffix: true,
                          locale: es
                        })}
                      </p>
                      {log.ipAddress && (
                        <p className="text-xs text-slate-400 mt-1">
                          IP: {log.ipAddress}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        log.action === 'LOGIN' ? 'success' :
                        log.action === 'DATA_MODIFICATION' ? 'warning' :
                        log.action === 'DATA_DELETION' ? 'error' :
                        'default'
                      }
                      className="flex-shrink-0"
                    >
                      {log.action}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-8">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No hay actividad reciente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions Section */}
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
              {dashboardContent.quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={index}
                    onClick={() => navigate(action.route)}
                    className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all text-center group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-lg bg-${action.color}-100 flex items-center justify-center group-hover:bg-${action.color}-200 transition-colors`}>
                      <Icon className={`w-6 h-6 text-${action.color}-600`} />
                    </div>
                    <p className="text-sm font-medium text-slate-900">{action.label}</p>
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
