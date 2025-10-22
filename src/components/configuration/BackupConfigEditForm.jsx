import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Database, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { apiClient } from '@/lib/api';

const BACKUP_TYPES = [
  { value: 'full', label: 'Completo' },
  { value: 'incremental', label: 'Incremental' },
  { value: 'differential', label: 'Diferencial' },
];

export default function BackupConfigEditForm({ open, onClose, config, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      backupType: 'full',
      retentionDays: 30,
      storageLocation: '',
      isActive: true,
    },
  });

  const backupType = watch('backupType');
  const isActive = watch('isActive');

  // Pre-populate form when config changes
  useEffect(() => {
    if (open && config) {
      setValue('name', config.name || '');
      setValue('description', config.description || '');
      setValue('backupType', config.backupType || 'full');
      setValue('retentionDays', config.retentionDays || 30);
      setValue('storageLocation', config.storageLocation || '');
      setValue('isActive', config.isActive ?? true);
    }
  }, [open, config, setValue]);

  const onSubmit = async (data) => {
    try {
      // Validate name
      if (!data.name || data.name.trim().length < 3) {
        toast.error('El nombre debe tener al menos 3 caracteres');
        return;
      }

      // Validate description
      if (!data.description || data.description.trim().length < 10) {
        toast.error('La descripción debe tener al menos 10 caracteres');
        return;
      }

      // Validate backup type
      if (!data.backupType) {
        toast.error('El tipo de backup es requerido');
        return;
      }

      // Validate retention days
      if (!data.retentionDays || parseInt(data.retentionDays) < 1) {
        toast.error('Los días de retención deben ser al menos 1');
        return;
      }

      // Validate storage location
      if (!data.storageLocation || data.storageLocation.trim().length === 0) {
        toast.error('La ubicación de almacenamiento es requerida');
        return;
      }

      setSubmitting(true);

      await apiClient.configuration.updateBackupConfiguration(config.id, {
        name: data.name.trim(),
        description: data.description.trim(),
        backupType: data.backupType,
        retentionDays: parseInt(data.retentionDays),
        storageLocation: data.storageLocation.trim(),
        isActive: data.isActive ?? true,
      });

      toast.success('Configuración de backup actualizada correctamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating backup configuration:', error);
      toast.error(
        error.response?.data?.error?.message || 'Error al actualizar la configuración de backup'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      reset();
      onClose();
    }
  };

  if (!config) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emooti-blue-600" />
            Editar Configuración de Backup
          </DialogTitle>
          <DialogDescription>
            Modifica la configuración de respaldos automáticos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
              Información Básica
            </h3>

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ej: Backup Diario de Producción"
                  {...register('name', {
                    required: 'El nombre es requerido',
                    minLength: {
                      value: 3,
                      message: 'El nombre debe tener al menos 3 caracteres',
                    },
                  })}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Descripción <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe el propósito y alcance de este backup..."
                  rows={3}
                  {...register('description', {
                    required: 'La descripción es requerida',
                    minLength: {
                      value: 10,
                      message: 'La descripción debe tener al menos 10 caracteres',
                    },
                  })}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Backup Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
              Configuración del Backup
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Backup Type */}
              <div className="space-y-2">
                <Label htmlFor="backupType">
                  Tipo de Backup <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={backupType}
                  onValueChange={(value) => setValue('backupType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {BACKUP_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  {backupType === 'full' && 'Copia completa de todos los datos'}
                  {backupType === 'incremental' && 'Solo cambios desde el último backup'}
                  {backupType === 'differential' && 'Cambios desde el último backup completo'}
                </p>
              </div>

              {/* Retention Days */}
              <div className="space-y-2">
                <Label htmlFor="retentionDays">
                  Días de Retención <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="retentionDays"
                  type="number"
                  min="1"
                  placeholder="30"
                  {...register('retentionDays', {
                    required: 'Los días de retención son requeridos',
                    min: {
                      value: 1,
                      message: 'Debe ser al menos 1 día',
                    },
                  })}
                />
                {errors.retentionDays && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.retentionDays.message}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Número de días que se mantendrán los backups
                </p>
              </div>

              {/* Storage Location */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="storageLocation">
                  Ubicación de Almacenamiento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="storageLocation"
                  placeholder="Ej: /backups/production o s3://bucket-name/backups"
                  {...register('storageLocation', {
                    required: 'La ubicación de almacenamiento es requerida',
                  })}
                />
                {errors.storageLocation && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.storageLocation.message}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Ruta o URI donde se almacenarán los backups
                </p>
              </div>
            </div>
          </div>

          {/* Active */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Activo
            </Label>
          </div>
          <p className="text-xs text-slate-500 ml-6">
            Si está marcado, esta configuración se ejecutará automáticamente según el calendario
            programado
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="emooti-gradient text-white"
            >
              {submitting ? 'Actualizando...' : 'Actualizar Configuración'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
