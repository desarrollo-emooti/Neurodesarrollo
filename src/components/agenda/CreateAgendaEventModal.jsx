import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Calendar, MapPin, Users, Clock, AlertCircle } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// API
import { apiClient } from '@/lib/api';

// Auth Store
import useAuthStore from '@/store/authStore';

// Constants
const EVENT_TYPES = [
  { value: 'EVALUACION', label: 'Evaluación' },
  { value: 'REUNION', label: 'Reunión' },
  { value: 'FORMACION', label: 'Formación' },
  { value: 'OTRO', label: 'Otro' },
];

const PRIORITY_OPTIONS = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
];

export default function CreateAgendaEventModal({ open, onClose, onSuccess }) {
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [centers, setCenters] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    defaultValues: {
      title: '',
      eventType: 'EVALUACION',
      centerId: '',
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      description: '',
      location: '',
      estimatedStudents: '',
      priority: 'MEDIA',
    },
  });

  useEffect(() => {
    if (open) {
      loadCenters();
    }
  }, [open]);

  const loadCenters = async () => {
    try {
      setLoadingCenters(true);
      const response = await apiClient.centers.getAll();
      setCenters(response.data.data || []);
    } catch (error) {
      console.error('Error loading centers:', error);
      toast.error('Error al cargar centros');
    } finally {
      setLoadingCenters(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const eventData = {
        ...data,
        estimatedStudents: data.estimatedStudents ? parseInt(data.estimatedStudents) : null,
      };

      // Remove empty optional fields
      Object.keys(eventData).forEach(key => {
        if (eventData[key] === '' || eventData[key] === null || eventData[key] === undefined) {
          delete eventData[key];
        }
      });

      await apiClient.agenda.create(eventData);

      toast.success('Evento creado correctamente');
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error(error.response?.data?.error?.message || 'Error al crear evento');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emooti-blue-600" />
            Crear Nuevo Evento
          </DialogTitle>
          <DialogDescription>
            Programa un nuevo evento en la agenda
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Información Básica
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="title">Título del Evento *</Label>
                <Input
                  id="title"
                  placeholder="Ej: Evaluación Grupo 3º A"
                  {...register('title', {
                    required: 'El título es requerido',
                    minLength: {
                      value: 3,
                      message: 'El título debe tener al menos 3 caracteres',
                    },
                  })}
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventType">Tipo de Evento *</Label>
                <Select
                  onValueChange={(value) => setValue('eventType', value)}
                  value={watch('eventType')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="centerId">Centro *</Label>
                <Select
                  onValueChange={(value) => setValue('centerId', value)}
                  value={watch('centerId')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar centro" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingCenters ? (
                      <SelectItem value="loading" disabled>
                        Cargando centros...
                      </SelectItem>
                    ) : (
                      centers.map((center) => (
                        <SelectItem key={center.id} value={center.id}>
                          {center.name} ({center.code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.centerId && (
                  <p className="text-sm text-red-600">{errors.centerId.message}</p>
                )}
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Detalles adicionales del evento..."
                  rows={3}
                  {...register('description')}
                />
              </div>
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Fecha y Hora
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Inicio *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  {...register('startDate', {
                    required: 'La fecha de inicio es requerida',
                  })}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Fin *</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  {...register('endDate', {
                    required: 'La fecha de fin es requerida',
                  })}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location and Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Ubicación y Detalles
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  placeholder="Ej: Sala 3, Aula 2B, etc."
                  {...register('location')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedStudents">Estudiantes Estimados</Label>
                <Input
                  id="estimatedStudents"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register('estimatedStudents')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select
                  onValueChange={(value) => setValue('priority', value)}
                  value={watch('priority')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || loadingCenters}
              className="emooti-gradient text-white"
            >
              {loading ? 'Creando...' : 'Crear Evento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
