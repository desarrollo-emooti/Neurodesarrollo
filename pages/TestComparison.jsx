import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const TestComparison = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comparación de Pruebas</h1>
          <p className="text-gray-600">Compara resultados entre diferentes evaluaciones</p>
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
              <BarChart3 className="h-5 w-5" />
              <span>Comparación de Evaluaciones</span>
            </CardTitle>
            <CardDescription>
              Esta funcionalidad estará disponible en la siguiente fase de desarrollo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Comparación de Pruebas
              </h3>
              <p className="text-gray-600 mb-4">
                Aquí podrás comparar resultados entre diferentes evaluaciones del mismo alumno.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Seleccionar múltiples evaluaciones</p>
                <p>• Gráficos comparativos</p>
                <p>• Análisis de diferencias</p>
                <p>• Identificación de tendencias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default TestComparison;

