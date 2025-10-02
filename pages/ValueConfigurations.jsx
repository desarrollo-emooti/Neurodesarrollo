import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ValueConfigurations = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Valoraciones de Pruebas</h1>
          <p className="text-gray-600">Configura las valoraciones por tipo de prueba</p>
        </div>
      </div>
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Configuración de Valoraciones</span>
          </CardTitle>
          <CardDescription>Esta funcionalidad estará disponible en la siguiente fase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Valoraciones de Pruebas</h3>
            <p className="text-gray-600 mb-4">Configura rangos de valoración por tipo de prueba</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ValueConfigurations;

