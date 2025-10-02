import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, Building2, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const Dashboard = () => {
  const stats = [
    {
      title: 'Total Estudiantes',
      value: '1,234',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      change: '+12%',
      changeType: 'positive',
    },
    {
      title: 'Centros Activos',
      value: '45',
      icon: Building2,
      color: 'from-green-500 to-green-600',
      change: '+3%',
      changeType: 'positive',
    },
    {
      title: 'Pruebas Realizadas',
      value: '2,567',
      icon: ClipboardList,
      color: 'from-purple-500 to-purple-600',
      change: '+8%',
      changeType: 'positive',
    },
    {
      title: 'Reportes Generados',
      value: '89',
      icon: BarChart3,
      color: 'from-orange-500 to-orange-600',
      change: '+15%',
      changeType: 'positive',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-slate-900">
          Dashboard
        </h1>
        <p className="text-slate-600 mt-1">
          Resumen general del sistema EMOOTI
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="emooti-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                      <p className={`text-sm mt-1 ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change} vs mes anterior
                      </p>
                    </div>
                    <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Placeholder content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="emooti-card">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimas acciones en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-slate-500 py-8">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>Funcionalidad en desarrollo</p>
            </div>
          </CardContent>
        </Card>

        <Card className="emooti-card">
          <CardHeader>
            <CardTitle>Próximas Citas</CardTitle>
            <CardDescription>
              Agenda de evaluaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-slate-500 py-8">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>Funcionalidad en desarrollo</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

