import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

// API
import { apiClient } from '@/lib/api';

const STATUS_OPTIONS = [
  { value: 'INVESTIGATING', label: 'Investigando' },
  { value: 'RESOLVED', label: 'Resuelta' },
  { value: 'FALSE_POSITIVE', label: 'Falso Positivo' },
];

export default function ResolveAlertModal({ open, onClose, onSuccess, alert }) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    defaultValues: {
      status: 'INVESTIGATING',
      resolutionNotes: '',
    },
  });

  const status = watch('status');

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      await apiClient.security.updateAnomalyAlert(alert.id, {
        status: data.status,
        resolutionNotes: data.resolutionNotes || undefined,
      });

      toast.success('Alerta actualizada correctamente');
      reset();
      onSuccess();
    } catch (error) {
      console.error('Error updating anomaly alert:', error);
      toast.error(error.response?.data?.error?.message || 'Error al actualizar la alerta');
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emooti-blue-600" />
            Resolver Alerta de Anomalía
          </DialogTitle>
          <DialogDescription>
            Actualiza el estado de la alerta y añade notas de resolución
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Alert Info */}
          <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-semibold">Tipo:</span> {alert.type}
              </div>
              <div>
                <span className="font-semibold">Severidad:</span> {alert.severity}
              </div>
              <div className="col-span-2">
                <span className="font-semibold">Descripción:</span> {alert.description}
              </div>
              {alert.user && (
                <div className="col-span-2">
                  <span className="font-semibold">Usuario:</span> {alert.user.fullName} ({alert.user.email})
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">
              Nuevo Estado <span className="text-red-500">*</span>
            </Label>
            <Select
              value={status}
              onValueChange={(value) => setValue('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resolution Notes */}
          <div className="space-y-2">
            <Label htmlFor="resolutionNotes">
              Notas de Resolución
            </Label>
            <Textarea
              id="resolutionNotes"
              placeholder="Describe las acciones tomadas, hallazgos, o razones para la resolución..."
              rows={5}
              {...register('resolutionNotes')}
            />
            <p className="text-xs text-slate-500">
              Las notas son opcionales pero recomendadas para mantener un historial completo
            </p>
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
              {loading ? 'Actualizando...' : 'Actualizar Alerta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
