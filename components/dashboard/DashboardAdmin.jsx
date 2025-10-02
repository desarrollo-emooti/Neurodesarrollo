import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  GraduationCap, 
  Building2, 
  TestTube, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/components/DataContext';

const StatsCard = ({ title, value, description, icon: Icon, trend, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500", 
    orange: "bg-orange-500",
    red: "bg-red-500",
    purple: "bg-purple-500"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-xs text-gray-600">{description}</p>
            {trend && (
              <Badge variant={trend > 0 ? "default" : "destructive"} className="text-xs">
                {trend > 0 ? '+' : ''}{trend}%
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const DashboardAdmin = () => {
  const { users, students, centers, isLoading } = useData();

  // Calcular estadísticas
  const stats = {
    totalUsers: users.length,
    totalStudents: students.length,
    totalCenters: centers.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    pendingInvitations: users.filter(u => u.status === 'pending_invitation').length,
    activeCenters: centers.filter(c => c.active).length,
    studentsWithConsent: students.filter(s => s.consent_given === 'Sí').length,
    studentsPendingConsent: students.filter(s => s.consent_given === 'Pendiente').length
  };

  // Alertas del sistema
  const alerts = [
    ...(stats.pendingInvitations > 0 ? [{
      type: 'warning',
      title: 'Invitaciones pendientes',
      message: `${stats.pendingInvitations} usuarios esperando invitación`,
      icon: Clock
    }] : []),
    ...(stats.studentsPendingConsent > 0 ? [{
      type: 'info',
      title: 'Consentimientos pendientes',
      message: `${stats.studentsPendingConsent} alumnos sin consentimiento`,
      icon: AlertTriangle
    }] : []),
    ...(stats.activeCenters < stats.totalCenters ? [{
      type: 'warning',
      title: 'Centros inactivos',
      message: `${stats.totalCenters - stats.activeCenters} centros inactivos`,
      icon: Building2
    }] : [])
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Usuarios"
          value={stats.totalUsers}
          description="Usuarios registrados"
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Total Alumnos"
          value={stats.totalStudents}
          description="Alumnos evaluados"
          icon={GraduationCap}
          color="green"
        />
        <StatsCard
          title="Centros Activos"
          value={stats.activeCenters}
          description={`de ${stats.totalCenters} centros`}
          icon={Building2}
          color="purple"
        />
        <StatsCard
          title="Usuarios Activos"
          value={stats.activeUsers}
          description={`de ${stats.totalUsers} usuarios`}
          icon={Activity}
          color="orange"
        />
      </div>

      {/* KPIs secundarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Consentimientos"
          value={stats.studentsWithConsent}
          description={`de ${stats.totalStudents} alumnos`}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Pendientes"
          value={stats.studentsPendingConsent}
          description="Sin consentimiento"
          icon={XCircle}
          color="red"
        />
        <StatsCard
          title="Invitaciones"
          value={stats.pendingInvitations}
          description="Por enviar"
          icon={Clock}
          color="orange"
        />
        <StatsCard
          title="Crecimiento"
          value="+12%"
          description="Este mes"
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* Alertas del sistema */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span>Alertas del Sistema</span>
              </CardTitle>
              <CardDescription>
                Elementos que requieren tu atención
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-lg ${
                      alert.type === 'warning' ? 'bg-orange-100' :
                      alert.type === 'info' ? 'bg-blue-100' :
                      'bg-red-100'
                    }`}>
                      <alert.icon className={`h-4 w-4 ${
                        alert.type === 'warning' ? 'text-orange-600' :
                        alert.type === 'info' ? 'text-blue-600' :
                        'text-red-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{alert.title}</p>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Acciones rápidas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Accesos directos a las funciones más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
                <Users className="h-6 w-6 text-blue-600 mb-2" />
                <p className="font-medium text-gray-900">Crear Usuario</p>
                <p className="text-sm text-gray-600">Añadir nuevo miembro</p>
              </button>
              <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
                <GraduationCap className="h-6 w-6 text-green-600 mb-2" />
                <p className="font-medium text-gray-900">Crear Alumno</p>
                <p className="text-sm text-gray-600">Registrar nuevo alumno</p>
              </button>
              <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
                <TestTube className="h-6 w-6 text-purple-600 mb-2" />
                <p className="font-medium text-gray-900">Asignar Prueba</p>
                <p className="text-sm text-gray-600">Nueva evaluación</p>
              </button>
              <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left">
                <Building2 className="h-6 w-6 text-orange-600 mb-2" />
                <p className="font-medium text-gray-900">Crear Centro</p>
                <p className="text-sm text-gray-600">Nuevo centro educativo</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardAdmin;

