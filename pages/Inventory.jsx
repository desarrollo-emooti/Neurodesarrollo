import React from 'react';
import { Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Inventory = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600">Gestiona el inventario de recursos y pruebas</p>
        </div>
      </div>
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Gestión de Inventario</span>
          </CardTitle>
          <CardDescription>Esta funcionalidad estará disponible en la siguiente fase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Inventario</h3>
            <p className="text-gray-600 mb-4">Gestiona el inventario de recursos y pruebas</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;

