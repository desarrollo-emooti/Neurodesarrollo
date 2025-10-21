import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Calendar, Clock, Plus, List } from 'lucide-react';

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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// API
import { apiClient } from '@/lib/api';

// Auth Store
import useAuthStore from '@/store/authStore';

export default function DeviceReservations({ open, onClose, device }) {
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [agendaEvents, setAgendaEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    defaultValues: {
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      agendaEventId: '',
    },
  });

  useEffect(() => {
    if (device && open) {
      loadReservations();
      loadAgendaEvents();
    }
  }, [device, open]);

  const loadReservations = async () => {
    try {
      setLoadingData(true);
      const response = await apiClient.devices.getReservations(device.id);
      setReservations(response.data.data || []);
    } catch (error) {
      console.error('Error loading reservations:', error);
      toast.error('Error al cargar reservas');
    } finally {
      setLoadingData(false);
    }
  };

  const loadAgendaEvents = async () => {
    try {
      const response = await apiClient.agenda.getAll();
      setAgendaEvents(response.data.data || []);
    } catch (error) {
      console.error('Error loading agenda events:', error);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const reservationData = {
        startDate: data.startDate,
        endDate: data.endDate,
      };

      // Add agendaEventId only if selected
      if (data.agendaEventId && data.agendaEventId !== '') {
        reservationData.agendaEventId = data.agendaEventId;
      }

      await apiClient.devices.createReservation(device.id, reservationData);

      toast.success('Reserva creada correctamente');
      reset();
      setShowForm(false);
      loadReservations();
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error(error.response?.data?.error?.message || 'Error al crear reserva');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      setShowForm(false);
      onClose();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { label: 'Activa', variant: 'default' },
      COMPLETED: { label: 'Completada', variant: 'secondary' },
      CANCELLED: { label: 'Cancelada', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' };

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  if (loadingData) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emooti-blue-600" />
            Reservas del Dispositivo
          </DialogTitle>
          <DialogDescription>
            {device.name} - {device.serial}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Reservations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
                <List className="w-4 h-4" />
                Reservas Existentes ({reservations.length})
              </h3>
              {!showForm && (
                <Button
                  size="sm"
                  onClick={() => setShowForm(true)}
                  className="emooti-gradient text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Reserva
                </Button>
              )}
            </div>

            {reservations.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay reservas para este dispositivo</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="border rounded-lg p-4 bg-slate-50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-600" />
                        <span className="font-medium text-sm">
                          {formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}
                        </span>
                      </div>
                      {getStatusBadge(reservation.status)}
                    </div>
                    {reservation.agendaEventId && (
                      <p className="text-xs text-slate-600">
                        Vinculado a evento de agenda
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create New Reservation Form */}
          {showForm && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Crear Nueva Reserva
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    reset();
                  }}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Fecha de Inicio *</Label>
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
                    <Label htmlFor="endDate">Fecha de Fin *</Label>
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

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="agendaEventId">Evento de Agenda (Opcional)</Label>
                    <Select
                      onValueChange={(value) => setValue('agendaEventId', value)}
                      value={watch('agendaEventId')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar evento (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Ninguno</SelectItem>
                        {agendaEvents.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.title} - {formatDate(event.startDate)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      reset();
                    }}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="emooti-gradient text-white"
                  >
                    {loading ? 'Creando...' : 'Crear Reserva'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
