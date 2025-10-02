import React from 'react';
import { Tablet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Devices = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispositivos</h1>
          <p className="text-gray-600">Gestiona los dispositivos (tablets, iPads) del sistema</p>
        </div>
      </div>
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Tablet className="h-5 w-5" />
            <span>Gestión de Dispositivos</span>
          </CardTitle>
          <CardDescription>Esta funcionalidad estará disponible en la siguiente fase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <Tablet className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Dispositivos</h3>
            <p className="text-gray-600 mb-4">Gestiona tablets, iPads y otros dispositivos del sistema</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Devices;

