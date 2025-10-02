import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Statistics = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
          <p className="text-gray-600">Visualiza métricas y estadísticas del sistema</p>
        </div>
      </div>

      {/* Placeholder content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Dashboard de Estadísticas</span>
            </CardTitle>
            <CardDescription>
              Esta funcionalidad estará disponible en la siguiente fase de desarrollo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Estadísticas del Sistema
              </h3>
              <p className="text-gray-600 mb-4">
                Aquí podrás visualizar métricas, gráficos y estadísticas del sistema.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Gráficos de evolución de evaluaciones</p>
                <p>• Distribución por centros y etapas</p>
                <p>• Métricas de rendimiento</p>
                <p>• Análisis de tendencias</p>
                <p>• Exportación de reportes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Statistics;

