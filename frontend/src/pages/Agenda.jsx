import React from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const Agenda = () => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-slate-900">
          Agenda
        </h1>
        <p className="text-slate-600 mt-1">
          Gestión de citas y eventos
        </p>
      </motion.div>

      <Card className="emooti-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Agenda de Citas</span>
          </CardTitle>
          <CardDescription>
            Gestión completa de la agenda del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-slate-500 py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Funcionalidad en Desarrollo
            </h3>
            <p className="text-slate-500">
              La gestión de agenda estará disponible próximamente
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Agenda;

