import React from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  Calendar, 
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Building2,
  Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/components/DataContext';

const StatsCard = ({ title, value, description, icon: Icon, color = "blue" }) => {
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
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const DashboardOrientador = () => {
  const { currentUser, students, centers, isLoading } = useData();

  // Filtrar datos del centro del orientador
  const userCenter = centers.find(center => center.id === currentUser?.center_id);
  const centerStudents = students.filter(student => 
    student.center_id === currentUser?.center_id
  );

  // Calcular estadísticas
  const stats = {
    centerStudents: centerStudents.length,
    pendingEvents: 0, // TODO: calcular desde AgendaEvent
    upcomingEvaluations: 0, // TODO: calcular desde TestAssignment
    availableReports: 0, // TODO: calcular desde Reports
    studentsWithConsent: centerStudents.filter(s => s.consent_given === 'Sí').length,
    studentsPendingConsent: centerStudents.filter(s => s.consent_given === 'Pendiente').length
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(6)].map((_, i) => (
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
      {/* Información del centro */}
      {userCenter && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span>Mi Centro</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{userCenter.name}</h3>
                  <p className="text-gray-600">{userCenter.address}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {userCenter.city}, {userCenter.province}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-2">
                    {userCenter.type}
                  </Badge>
                  <p className="text-sm text-gray-600">
                    {userCenter.total_students ? `${userCenter.total_students} alumnos` : 'Capacidad no especificada'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Alumnos del Centro"
          value={stats.centerStudents}
          description="Total de alumnos"
          icon={GraduationCap}
          color="blue"
        />
        <StatsCard
          title="Eventos Pendientes"
          value={stats.pendingEvents}
          description="Por aprobar"
          icon={Clock}
          color="orange"
        />
        <StatsCard
          title="Evaluaciones Programadas"
          value={stats.upcomingEvaluations}
          description="Esta semana"
          icon={Calendar}
          color="purple"
        />
        <StatsCard
          title="Informes Disponibles"
          value={stats.availableReports}
          description="Para revisar"
          icon={FileText}
          color="green"
        />
      </div>

      {/* KPIs de consentimientos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsCard
          title="Con Consentimiento"
          value={stats.studentsWithConsent}
          description={`de ${stats.centerStudents} alumnos`}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Sin Consentimiento"
          value={stats.studentsPendingConsent}
          description="Pendientes"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Acciones rápidas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Accesos directos a las funciones de orientación más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
                <GraduationCap className="h-6 w-6 text-blue-600 mb-2" />
                <p className="font-medium text-gray-900">Ver Alumnos</p>
                <p className="text-sm text-gray-600">Lista de alumnos</p>
              </button>
              <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
                <Calendar className="h-6 w-6 text-green-600 mb-2" />
                <p className="font-medium text-gray-900">Aprobar Eventos</p>
                <p className="text-sm text-gray-600">Evaluaciones pendientes</p>
              </button>
              <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
                <FileText className="h-6 w-6 text-purple-600 mb-2" />
                <p className="font-medium text-gray-900">Ver Informes</p>
                <p className="text-sm text-gray-600">Reportes disponibles</p>
              </button>
              <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left">
                <Users className="h-6 w-6 text-orange-600 mb-2" />
                <p className="font-medium text-gray-900">Gestionar Familias</p>
                <p className="text-sm text-gray-600">Autorizaciones</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Información del orientador */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>Información del Orientador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Datos Personales</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Nombre:</span> {currentUser.full_name}</p>
                  <p><span className="font-medium">Email:</span> {currentUser.email}</p>
                  <p><span className="font-medium">Teléfono:</span> {currentUser.phone || 'No especificado'}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Permisos</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Etapas permitidas:</span> {currentUser.allowed_etapas?.join(', ') || 'Todas'}</p>
                  <p><span className="font-medium">Cursos permitidos:</span> {currentUser.allowed_courses?.join(', ') || 'Todos'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardOrientador;

