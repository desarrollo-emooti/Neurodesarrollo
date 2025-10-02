import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Agenda = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-600">Gestiona la agenda de evaluaciones y eventos</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Crear Evento
        </Button>
      </div>

      {/* Placeholder content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Agenda de Evaluaciones</span>
            </CardTitle>
            <CardDescription>
              Esta funcionalidad estará disponible en la siguiente fase de desarrollo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Agenda de Evaluaciones
              </h3>
              <p className="text-gray-600 mb-4">
                Aquí podrás gestionar la agenda de evaluaciones, eventos y reuniones del sistema.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Calendario de evaluaciones programadas</p>
                <p>• Crear eventos de evaluación</p>
                <p>• Asignar examinadores</p>
                <p>• Reservar dispositivos</p>
                <p>• Aprobar eventos (orientadores)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Agenda;

