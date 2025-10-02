import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const Financial = () => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-slate-900">
          Gestión Financiera
        </h1>
        <p className="text-slate-600 mt-1">
          Administración de suscripciones y facturación
        </p>
      </motion.div>

      <Card className="emooti-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Finanzas</span>
          </CardTitle>
          <CardDescription>
            Gestión completa de la parte financiera
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-slate-500 py-12">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Funcionalidad en Desarrollo
            </h3>
            <p className="text-slate-500">
              La gestión financiera estará disponible próximamente
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Financial;

