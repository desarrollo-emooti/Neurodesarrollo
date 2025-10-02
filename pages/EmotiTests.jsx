import React from 'react';
import { Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const EmotiTests = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pruebas EMOOTI</h1>
          <p className="text-gray-600">Configura las pruebas EMOOTI personalizadas</p>
        </div>
      </div>
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Configuración de Pruebas EMOOTI</span>
          </CardTitle>
          <CardDescription>Esta funcionalidad estará disponible en la siguiente fase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Pruebas EMOOTI</h3>
            <p className="text-gray-600 mb-4">Configura pruebas EMOOTI: Batelle SCR, Circuito Logopedia, Sensoriomotor, E2P</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmotiTests;

