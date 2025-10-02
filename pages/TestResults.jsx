import React from 'react';
import { motion } from 'framer-motion';
import { FileCheck, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const TestResults = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resultados de Pruebas</h1>
          <p className="text-gray-600">Visualiza y gestiona los resultados de las evaluaciones</p>
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
              <FileCheck className="h-5 w-5" />
              <span>Resultados de Evaluaciones</span>
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
                Resultados de Pruebas
              </h3>
              <p className="text-gray-600 mb-4">
                Aquí podrás visualizar todos los resultados de las evaluaciones realizadas.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Ver resultados por alumno y año académico</p>
                <p>• Importar resultados desde PDFs</p>
                <p>• Comparar evaluaciones</p>
                <p>• Generar informes automáticamente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default TestResults;

