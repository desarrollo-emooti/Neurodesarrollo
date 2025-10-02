import React from 'react';
import { Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ExportUsers = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exportar Usuarios</h1>
          <p className="text-gray-600">Exporta usuarios con plantillas personalizables</p>
        </div>
      </div>
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Exportación de Usuarios</span>
          </CardTitle>
          <CardDescription>Esta funcionalidad estará disponible en la siguiente fase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Download className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Exportar Usuarios</h3>
            <p className="text-gray-600 mb-4">Exporta usuarios con plantillas personalizables en CSV, Excel o PDF</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportUsers;

