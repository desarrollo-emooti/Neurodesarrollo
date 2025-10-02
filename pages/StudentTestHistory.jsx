import React from 'react';
import { motion } from 'framer-motion';
import { History, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const StudentTestHistory = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial por Alumno</h1>
          <p className="text-gray-600">Visualiza el historial completo de evaluaciones de cada alumno</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <History className="h-5 w-5" />
              <span>Historial de Evaluaciones</span>
            </CardTitle>
            <CardDescription>
              Esta funcionalidad estará disponible en la siguiente fase de desarrollo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Historial de Evaluaciones
              </h3>
              <p className="text-gray-600 mb-4">
                Aquí podrás ver el historial completo de evaluaciones de cada alumno con gráficos de evolución.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Timeline de evaluaciones por alumno</p>
                <p>• Gráficos de evolución</p>
                <p>• Comparación entre diferentes pruebas</p>
                <p>• Análisis de progreso</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default StudentTestHistory;

