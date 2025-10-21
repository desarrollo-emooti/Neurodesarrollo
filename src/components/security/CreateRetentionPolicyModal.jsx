import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Database } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Checkbox } from '@/components/ui/checkbox';

// API
import { apiClient } from '@/lib/api';

const ENTITY_TYPES = [
  { value: 'User', label: 'Usuario' },
  { value: 'Student', label: 'Estudiante' },
  { value: 'TestResult', label: 'Resultado de Test' },
  { value: 'TestAssignment', label: 'Asignación de Test' },
  { value: 'AuditLog', label: 'Registro de Auditoría' },
  { value: 'Invoice', label: 'Factura' },
  { value: 'Authorization', label: 'Autorización' },
];

export default function CreateRetentionPolicyModal({ open, onClose, onSuccess }) {
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
      entityType: 'User',
      retentionYears: 5,
      triggerField: 'createdAt',
      description: '',
      legalBasis: '',
      autoApply: false,
      gracePeriodDays: 30,
      notifyBeforeDays: 7,
    },
  });

  const autoApply = watch('autoApply');
  const entityType = watch('entityType');

  const onSubmit = async (data) => {
    try {
      // Validations
      if (!data.description || data.description.length < 10) {
        toast.error('La descripción debe tener al menos 10 caracteres');
        return;
      }

      if (!data.legalBasis || data.legalBasis.length < 10) {
        toast.error('La base legal debe tener al menos 10 caracteres');
        return;
      }

      if (data.retentionYears < 1) {
        toast.error('El período de retención debe ser al menos 1 año');
        return;
      }

      setLoading(true);

      const policyData = {
        entityType: data.entityType,
        retentionYears: parseInt(data.retentionYears),
        triggerField: data.triggerField,
        description: data.description,
        legalBasis: data.legalBasis,
        autoApply: data.autoApply || false,
        gracePeriodDays: parseInt(data.gracePeriodDays) || 30,
        notifyBeforeDays: parseInt(data.notifyBeforeDays) || 7,
      };

      await apiClient.security.createRetentionPolicy(policyData);

      toast.success('Política de retención creada correctamente');
      reset();
      onSuccess();
    } catch (error) {
      console.error('Error creating retention policy:', error);
      toast.error(error.response?.data?.error?.message || 'Error al crear política de retención');
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emooti-blue-600" />
            Nueva Política de Retención de Datos
          </DialogTitle>
          <DialogDescription>
            Define las reglas de retención y eliminación automática de datos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
              Información Básica
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Entity Type */}
              <div className="space-y-2">
                <Label htmlFor="entityType">
                  Tipo de Entidad <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={entityType}
                  onValueChange={(value) => setValue('entityType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Retention Years */}
              <div className="space-y-2">
                <Label htmlFor="retentionYears">
                  Años de Retención <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="retentionYears"
                  type="number"
                  min="1"
                  placeholder="Ej: 5"
                  {...register('retentionYears', {
                    required: 'Los años de retención son requeridos',
                    min: {
                      value: 1,
                      message: 'Debe ser al menos 1 año',
                    },
                  })}
                />
                {errors.retentionYears && (
                  <p className="text-sm text-red-600">{errors.retentionYears.message}</p>
                )}
              </div>

              {/* Trigger Field */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="triggerField">
                  Campo Disparador <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="triggerField"
                  placeholder="Ej: createdAt, updatedAt, lastAccessDate"
                  {...register('triggerField', {
                    required: 'El campo disparador es requerido',
                    minLength: {
                      value: 2,
                      message: 'Debe tener al menos 2 caracteres',
                    },
                  })}
                />
                {errors.triggerField && (
                  <p className="text-sm text-red-600">{errors.triggerField.message}</p>
                )}
                <p className="text-xs text-slate-500">
                  Campo de fecha que se usará para calcular si los datos deben eliminarse
                </p>
              </div>
            </div>
          </div>

          {/* Description and Legal Basis */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
              Descripción y Base Legal
            </h3>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Descripción <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe el propósito y alcance de esta política..."
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
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Legal Basis */}
            <div className="space-y-2">
              <Label htmlFor="legalBasis">
                Base Legal <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="legalBasis"
                placeholder="Ej: RGPD Art. 17, LOPDGDD Art. 11, etc."
                rows={3}
                {...register('legalBasis', {
                  required: 'La base legal es requerida',
                  minLength: {
                    value: 10,
                    message: 'La base legal debe tener al menos 10 caracteres',
                  },
                })}
              />
              {errors.legalBasis && (
                <p className="text-sm text-red-600">{errors.legalBasis.message}</p>
              )}
              <p className="text-xs text-slate-500">
                Referencia legal que justifica esta política de retención
              </p>
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
              Configuración
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Grace Period Days */}
              <div className="space-y-2">
                <Label htmlFor="gracePeriodDays">Período de Gracia (días)</Label>
                <Input
                  id="gracePeriodDays"
                  type="number"
                  min="0"
                  placeholder="30"
                  {...register('gracePeriodDays', {
                    min: {
                      value: 0,
                      message: 'Debe ser 0 o mayor',
                    },
                  })}
                />
                {errors.gracePeriodDays && (
                  <p className="text-sm text-red-600">{errors.gracePeriodDays.message}</p>
                )}
                <p className="text-xs text-slate-500">
                  Días adicionales antes de la eliminación definitiva
                </p>
              </div>

              {/* Notify Before Days */}
              <div className="space-y-2">
                <Label htmlFor="notifyBeforeDays">Notificar Antes (días)</Label>
                <Input
                  id="notifyBeforeDays"
                  type="number"
                  min="0"
                  placeholder="7"
                  {...register('notifyBeforeDays', {
                    min: {
                      value: 0,
                      message: 'Debe ser 0 o mayor',
                    },
                  })}
                />
                {errors.notifyBeforeDays && (
                  <p className="text-sm text-red-600">{errors.notifyBeforeDays.message}</p>
                )}
                <p className="text-xs text-slate-500">
                  Días de antelación para notificar antes de eliminar
                </p>
              </div>
            </div>

            {/* Auto Apply */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoApply"
                checked={autoApply}
                onCheckedChange={(checked) => setValue('autoApply', checked)}
              />
              <Label htmlFor="autoApply" className="cursor-pointer">
                Aplicar Automáticamente
              </Label>
            </div>
            <p className="text-xs text-slate-500 ml-6">
              Si está marcado, la política se ejecutará automáticamente según el calendario configurado.
              Si no, requerirá aprobación manual para cada ejecución.
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
              {loading ? 'Creando...' : 'Crear Política'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
