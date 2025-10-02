import React from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  FileText, 
  TestTube,
  Calendar,
  Download,
  Eye,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

const DashboardFamilia = () => {
  const { currentUser, students, isLoading } = useData();

  // TODO: Implementar lógica para obtener hijos del usuario
  // Por ahora simulamos que no hay hijos vinculados
  const children = []; // students.filter(student => student.family_relations?.includes(currentUser.id))

  // Calcular estadísticas
  const stats = {
    totalChildren: children.length,
    completedEvaluations: 0, // TODO: calcular desde TestResult
    pendingEvaluations: 0, // TODO: calcular desde TestAssignment
    availableReports: 0, // TODO: calcular desde Reports
    upcomingAppointments: 0, // TODO: calcular desde AgendaEvent
    recommendations: 0 // TODO: calcular desde ActionPlan
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
      {/* Mensaje de bienvenida */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Heart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  ¡Bienvenido a EMOOTI!
                </h2>
                <p className="text-gray-600">
                  Aquí podrás seguir el progreso de tu hijo/a y acceder a todos los informes y recomendaciones.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Hijos Registrados"
          value={stats.totalChildren}
          description="En el sistema"
          icon={Heart}
          color="blue"
        />
        <StatsCard
          title="Evaluaciones Completadas"
          value={stats.completedEvaluations}
          description="Este año"
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Evaluaciones Pendientes"
          value={stats.pendingEvaluations}
          description="Por realizar"
          icon={Clock}
          color="orange"
        />
        <StatsCard
          title="Informes Disponibles"
          value={stats.availableReports}
          description="Para descargar"
          icon={FileText}
          color="purple"
        />
      </div>

      {/* Estado actual */}
      {stats.totalChildren === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <AlertTriangle className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay hijos vinculados
                </h3>
                <p className="text-gray-600 mb-4">
                  Contacta con el centro educativo para vincular tu cuenta con los datos de tu hijo/a.
                </p>
                <Button variant="outline">
                  Contactar Centro
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
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
              title="Recomendaciones"
              value={stats.recommendations}
              description="Disponibles"
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
                  Accesos directos a la información de tu hijo/a
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
                    <FileText className="h-6 w-6 text-blue-600 mb-2" />
                    <p className="font-medium text-gray-900">Ver Informes</p>
                    <p className="text-sm text-gray-600">Reportes disponibles</p>
                  </button>
                  <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
                    <TestTube className="h-6 w-6 text-green-600 mb-2" />
                    <p className="font-medium text-gray-900">Historial Evaluaciones</p>
                    <p className="text-sm text-gray-600">Ver progreso</p>
                  </button>
                  <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
                    <Download className="h-6 w-6 text-purple-600 mb-2" />
                    <p className="font-medium text-gray-900">Descargar Documentos</p>
                    <p className="text-sm text-gray-600">Informes PDF</p>
                  </button>
                  <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left">
                    <Eye className="h-6 w-6 text-orange-600 mb-2" />
                    <p className="font-medium text-gray-900">Ver Recomendaciones</p>
                    <p className="text-sm text-gray-600">Seguimiento</p>
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Lista de hijos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle>Mis Hijos</CardTitle>
                <CardDescription>
                  Información de cada uno de tus hijos registrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {children.map((child) => (
                    <div key={child.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Heart className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{child.full_name}</h4>
                          <p className="text-sm text-gray-600">
                            {child.etapa} - {child.course} • {child.class_group}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {child.consent_given}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {/* Información de contacto */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
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
                <h4 className="font-medium text-gray-900 mb-2">Soporte</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Si tienes alguna pregunta sobre los informes o evaluaciones de tu hijo/a, no dudes en contactar con el centro educativo.</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Contactar Soporte
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardFamilia;

