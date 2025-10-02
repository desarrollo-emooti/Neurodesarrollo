import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>
          <p className="text-gray-600">Configuración general del sistema</p>
        </div>
      </div>
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SettingsIcon className="h-5 w-5" />
            <span>Configuración del Sistema</span>
          </CardTitle>
          <CardDescription>Esta funcionalidad estará disponible en la siguiente fase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <SettingsIcon className="h-6 w-6 text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ajustes del Sistema</h3>
            <p className="text-gray-600 mb-4">Configura backups, parámetros generales y otras opciones del sistema</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

