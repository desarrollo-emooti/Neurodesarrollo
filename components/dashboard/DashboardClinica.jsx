import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  GraduationCap, 
  TestTube, 
  FileText,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle
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

const DashboardClinica = () => {
  const { currentUser, users, students, centers, isLoading } = useData();

  // Filtrar datos según centros asignados al usuario
  const userCenters = currentUser?.center_ids || [];
  const filteredStudents = students.filter(student => 
    userCenters.includes(student.center_id)
  );
  const filteredCenters = centers.filter(center => 
    userCenters.includes(center.id)
  );

  // Calcular estadísticas
  const stats = {
    assignedStudents: filteredStudents.length,
    pendingEvaluations: 0, // TODO: calcular desde TestAssignment
    completedEvaluations: 0, // TODO: calcular desde TestResult
    reportsToValidate: 0, // TODO: calcular desde Reports
    upcomingAppointments: 0, // TODO: calcular desde AgendaEvent
    centersAssigned: filteredCenters.length
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
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Alumnos Asignados"
          value={stats.assignedStudents}
          description="En tus centros"
          icon={GraduationCap}
          color="blue"
        />
        <StatsCard
          title="Evaluaciones Pendientes"
          value={stats.pendingEvaluations}
          description="Por realizar"
          icon={Clock}
          color="orange"
        />
        <StatsCard
          title="Evaluaciones Completadas"
          value={stats.completedEvaluations}
          description="Este mes"
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Informes por Validar"
          value={stats.reportsToValidate}
          description="Pendientes de revisión"
          icon={FileText}
          color="purple"
        />
      </div>

      {/* KPIs secundarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsCard
          title="Próximas Citas"
          value={stats.upcomingAppointments}
          description="Esta semana"
          icon={Calendar}
          color="blue"
        />
        <StatsCard
          title="Centros Asignados"
          value={stats.centersAssigned}
          description="Centros de trabajo"
          icon={TrendingUp}
          color="green"
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
              Accesos directos a las funciones clínicas más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
                <TestTube className="h-6 w-6 text-blue-600 mb-2" />
                <p className="font-medium text-gray-900">Nueva Evaluación</p>
                <p className="text-sm text-gray-600">Asignar prueba</p>
              </button>
              <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
                <FileText className="h-6 w-6 text-green-600 mb-2" />
                <p className="font-medium text-gray-900">Crear Informe</p>
                <p className="text-sm text-gray-600">Generar reporte</p>
              </button>
              <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
                <Calendar className="h-6 w-6 text-purple-600 mb-2" />
                <p className="font-medium text-gray-900">Agendar Cita</p>
                <p className="text-sm text-gray-600">Nueva evaluación</p>
              </button>
              <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left">
                <Users className="h-6 w-6 text-orange-600 mb-2" />
                <p className="font-medium text-gray-900">Ver Alumnos</p>
                <p className="text-sm text-gray-600">Lista de alumnos</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Información del usuario */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>Información del Profesional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Datos Personales</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Nombre:</span> {currentUser.full_name}</p>
                  <p><span className="font-medium">Especialidad:</span> {currentUser.specialty || 'No especificada'}</p>
                  <p><span className="font-medium">Colegiado:</span> {currentUser.license_number || 'No especificado'}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Centros Asignados</h4>
                <div className="space-y-1">
                  {filteredCenters.length > 0 ? (
                    filteredCenters.map(center => (
                      <Badge key={center.id} variant="outline" className="mr-2 mb-1">
                        {center.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No hay centros asignados</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardClinica;

