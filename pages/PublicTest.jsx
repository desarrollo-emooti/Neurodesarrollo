import React from 'react';
import { TestTube } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const PublicTest = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TestTube className="h-5 w-5" />
              <span>Formulario Público de Prueba EMOOTI</span>
            </CardTitle>
            <CardDescription>Esta funcionalidad estará disponible en la siguiente fase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <TestTube className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Formulario Público EMOOTI</h3>
              <p className="text-gray-600 mb-4">Formulario público para realizar pruebas EMOOTI sin necesidad de autenticación</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicTest;

