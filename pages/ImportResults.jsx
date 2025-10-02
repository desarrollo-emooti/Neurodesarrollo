import React from 'react';
import { Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ImportResults = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Importación Manual</h1>
          <p className="text-gray-600">Importa resultados de pruebas desde PDFs</p>
        </div>
      </div>
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Importación Manual de Resultados</span>
          </CardTitle>
          <CardDescription>Esta funcionalidad estará disponible en la siguiente fase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Importación Manual</h3>
            <p className="text-gray-600 mb-4">Importa resultados de pruebas desde PDFs de Stap2Go y Raven's 2</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportResults;

