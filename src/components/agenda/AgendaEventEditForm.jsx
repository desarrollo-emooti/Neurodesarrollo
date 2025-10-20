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
import { Skeleton } from '@/components/ui/skeleton';

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

const APPROVAL_STATUS_OPTIONS = [
  { value: 'PENDING_APPROVAL', label: 'Pendiente' },
  { value: 'APPROVED', label: 'Aprobado' },
  { value: 'REQUEST_CANCELLATION', label: 'Solicitud de Cancelación' },
  { value: 'REQUEST_MODIFICATION', label: 'Solicitud de Modificación' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

export default function AgendaEventEditForm({ open, onClose, onSuccess, event }) {
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [centers, setCenters] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm();

  useEffect(() => {
    if (event && open) {
      loadEventData();
      loadCenters();
    }
  }, [event, open]);

  const loadCenters = async () => {
    try {
      const response = await apiClient.centers.getAll();
      setCenters(response.data.data || []);
    } catch (error) {
      console.error('Error loading centers:', error);
    }
  };

  const loadEventData = async () => {
    try {
      setLoadingData(true);

      if (event.title) {
        // Use event data directly if available
        const startDate = event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '';
        const endDate = event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '';

        reset({
          title: event.title || '',
          eventType: event.eventType || 'EVALUACION',
          centerId: event.centerId || '',
          startDate: startDate,
          endDate: endDate,
          description: event.description || '',
          location: event.location || '',
          estimatedStudents: event.estimatedStudents || '',
          priority: event.priority || 'MEDIA',
          approvalStatus: event.approvalStatus || 'PENDING_APPROVAL',
        });
      } else {
        // Otherwise fetch full details
        const response = await apiClient.agenda.getById(event.id);
        const fullEvent = response.data.data;

        const startDate = fullEvent.startDate ? new Date(fullEvent.startDate).toISOString().slice(0, 16) : '';
        const endDate = fullEvent.endDate ? new Date(fullEvent.endDate).toISOString().slice(0, 16) : '';

        reset({
          title: fullEvent.title || '',
          eventType: fullEvent.eventType || 'EVALUACION',
          centerId: fullEvent.centerId || '',
          startDate: startDate,
          endDate: endDate,
          description: fullEvent.description || '',
          location: fullEvent.location || '',
          estimatedStudents: fullEvent.estimatedStudents || '',
          priority: fullEvent.priority || 'MEDIA',
          approvalStatus: fullEvent.approvalStatus || 'PENDING_APPROVAL',
        });
      }
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Error al cargar datos del evento');
    } finally {
      setLoadingData(false);
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

      await apiClient.agenda.update(event.id, eventData);

      toast.success('Evento actualizado correctamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error(error.response?.data?.error?.message || 'Error al actualizar evento');
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

  if (loadingData) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emooti-blue-600" />
            Editar Evento
          </DialogTitle>
          <DialogDescription>
            Modifique la información del evento
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
                    {centers.map((center) => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.name} ({center.code})
                      </SelectItem>
                    ))}
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

              <div className="space-y-2">
                <Label htmlFor="approvalStatus">Estado de Aprobación</Label>
                <Select
                  onValueChange={(value) => setValue('approvalStatus', value)}
                  value={watch('approvalStatus')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPROVAL_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
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
              disabled={loading}
              className="emooti-gradient text-white"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
