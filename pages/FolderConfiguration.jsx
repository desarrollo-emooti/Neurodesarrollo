import React from 'react';
import { Folder } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const FolderConfiguration = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración de Carpetas</h1>
          <p className="text-gray-600">Configura ubicaciones de almacenamiento</p>
        </div>
      </div>
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Folder className="h-5 w-5" />
            <span>Configuración de Carpetas</span>
          </CardTitle>
          <CardDescription>Esta funcionalidad estará disponible en la siguiente fase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <Folder className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configuración de Carpetas</h3>
            <p className="text-gray-600 mb-4">Configura ubicaciones de almacenamiento para diferentes tipos de archivos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FolderConfiguration;

