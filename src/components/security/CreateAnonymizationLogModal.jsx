import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye } from 'lucide-react';

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

// API
import { apiClient } from '@/lib/api';

const ENTITY_TYPES = [
  { value: 'User', label: 'Usuario' },
  { value: 'Student', label: 'Estudiante' },
  { value: 'TestResult', label: 'Resultado de Test' },
  { value: 'TestAssignment', label: 'Asignación de Test' },
  { value: 'Invoice', label: 'Factura' },
  { value: 'Authorization', label: 'Autorización' },
];

const ANONYMIZATION_METHODS = [
  { value: 'k-anonymity', label: 'K-Anonymity' },
  { value: 'differential-privacy', label: 'Differential Privacy' },
  { value: 'data-masking', label: 'Data Masking' },
  { value: 'generalization', label: 'Generalization' },
  { value: 'suppression', label: 'Suppression' },
  { value: 'pseudonymization', label: 'Pseudonymization' },
];

export default function CreateAnonymizationLogModal({ open, onClose, onSuccess }) {
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
      requestId: '',
      entityType: 'User',
      recordsProcessed: 0,
      anonymizationMethod: 'k-anonymity',
      kAnonymityScore: '',
      purpose: '',
    },
  });

  const entityType = watch('entityType');
  const anonymizationMethod = watch('anonymizationMethod');

  const onSubmit = async (data) => {
    try {
      // Validations
      if (!data.requestId || data.requestId.length < 3) {
        toast.error('El ID de solicitud debe tener al menos 3 caracteres');
        return;
      }

      if (!data.purpose || data.purpose.length < 10) {
        toast.error('El propósito debe tener al menos 10 caracteres');
        return;
      }

      if (data.recordsProcessed < 0) {
        toast.error('El número de registros procesados no puede ser negativo');
        return;
      }

      setLoading(true);

      const logData = {
        requestId: data.requestId,
        entityType: data.entityType,
        recordsProcessed: parseInt(data.recordsProcessed),
        anonymizationMethod: data.anonymizationMethod,
        kAnonymityScore: data.kAnonymityScore ? parseFloat(data.kAnonymityScore) : undefined,
        purpose: data.purpose,
      };

      await apiClient.security.createAnonymizationLog(logData);

      toast.success('Registro de anonimización creado correctamente');
      reset();
      onSuccess();
    } catch (error) {
      console.error('Error creating anonymization log:', error);
      toast.error(error.response?.data?.error?.message || 'Error al crear registro de anonimización');
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-emooti-blue-600" />
            Nuevo Registro de Anonimización
          </DialogTitle>
          <DialogDescription>
            Registra un proceso de anonimización de datos para cumplimiento normativo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Request Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
              Información de la Solicitud
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Request ID */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="requestId">
                  ID de Solicitud <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="requestId"
                  placeholder="Ej: ANON-2024-001"
                  {...register('requestId', {
                    required: 'El ID de solicitud es requerido',
                    minLength: {
                      value: 3,
                      message: 'Debe tener al menos 3 caracteres',
                    },
                  })}
                />
                {errors.requestId && (
                  <p className="text-sm text-red-600">{errors.requestId.message}</p>
                )}
                <p className="text-xs text-slate-500">
                  Identificador único para rastrear esta solicitud de anonimización
                </p>
              </div>

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

              {/* Records Processed */}
              <div className="space-y-2">
                <Label htmlFor="recordsProcessed">
                  Registros Procesados <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="recordsProcessed"
                  type="number"
                  min="0"
                  placeholder="Ej: 100"
                  {...register('recordsProcessed', {
                    required: 'El número de registros es requerido',
                    min: {
                      value: 0,
                      message: 'Debe ser 0 o mayor',
                    },
                  })}
                />
                {errors.recordsProcessed && (
                  <p className="text-sm text-red-600">{errors.recordsProcessed.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Anonymization Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
              Detalles de Anonimización
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Anonymization Method */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="anonymizationMethod">
                  Método de Anonimización <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={anonymizationMethod}
                  onValueChange={(value) => setValue('anonymizationMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    {ANONYMIZATION_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Técnica utilizada para anonimizar los datos
                </p>
              </div>

              {/* K-Anonymity Score */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="kAnonymityScore">K-Anonymity Score</Label>
                <Input
                  id="kAnonymityScore"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej: 5.0 (opcional)"
                  {...register('kAnonymityScore')}
                />
                <p className="text-xs text-slate-500">
                  Puntuación de k-anonimato alcanzada (opcional)
                </p>
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div className="space-y-2">
            <Label htmlFor="purpose">
              Propósito <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="purpose"
              placeholder="Describe el propósito de esta anonimización: investigación, análisis, compartición de datos, etc."
              rows={4}
              {...register('purpose', {
                required: 'El propósito es requerido',
                minLength: {
                  value: 10,
                  message: 'El propósito debe tener al menos 10 caracteres',
                },
              })}
            />
            {errors.purpose && (
              <p className="text-sm text-red-600">{errors.purpose.message}</p>
            )}
            <p className="text-xs text-slate-500">
              Justificación y objetivo del proceso de anonimización
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
              {loading ? 'Creando...' : 'Crear Registro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
