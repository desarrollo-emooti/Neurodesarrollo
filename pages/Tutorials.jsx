import React from 'react';
import { BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Tutorials = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tutoriales</h1>
          <p className="text-gray-600">Biblioteca de tutoriales y guías</p>
        </div>
      </div>
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Biblioteca de Tutoriales</span>
          </CardTitle>
          <CardDescription>Esta funcionalidad estará disponible en la siguiente fase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <BookOpen className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tutoriales</h3>
            <p className="text-gray-600 mb-4">Accede a tutoriales, guías y recursos de ayuda del sistema</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tutorials;

