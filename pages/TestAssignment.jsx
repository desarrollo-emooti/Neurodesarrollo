import React from 'react';
import { motion } from 'framer-motion';
import { TestTube, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const TestAssignment = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asignación de Pruebas</h1>
          <p className="text-gray-600">Gestiona las asignaciones de pruebas a los alumnos</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Asignar Prueba
        </Button>
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
              <TestTube className="h-5 w-5" />
              <span>Asignaciones de Pruebas</span>
            </CardTitle>
            <CardDescription>
              Esta funcionalidad estará disponible en la siguiente fase de desarrollo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <TestTube className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Asignación de Pruebas
              </h3>
              <p className="text-gray-600 mb-4">
                Aquí podrás asignar pruebas a los alumnos, generar códigos QR y gestionar las evaluaciones programadas.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Asignar pruebas del inventario</p>
                <p>• Generar códigos QR automáticamente</p>
                <p>• Programar evaluaciones</p>
                <p>• Gestionar consentimientos</p>
                <p>• Modificar asignaciones en lote</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default TestAssignment;

