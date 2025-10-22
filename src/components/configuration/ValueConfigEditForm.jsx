import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, X, Save, AlertCircle } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api';

const VALUATION_OPTIONS = [
  { value: 'Sin problema', label: 'Sin problema' },
  { value: 'Revisar', label: 'Revisar' },
  { value: 'Urgente', label: 'Urgente' },
  { value: 'Alerta', label: 'Alerta' },
];

export default function ValueConfigEditForm({ open, onClose, config, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [rules, setRules] = useState([
    { minValue: 0, maxValue: 100, valuation: 'Sin problema', color: '#22c55e' },
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm({
    defaultValues: {
      testTitle: '',
    },
  });

  // Pre-populate form when config changes
  useEffect(() => {
    if (open && config) {
      setValue('testTitle', config.testTitle || '');

      if (config.rules && Array.isArray(config.rules) && config.rules.length > 0) {
        setRules(config.rules);
      } else {
        setRules([{ minValue: 0, maxValue: 100, valuation: 'Sin problema', color: '#22c55e' }]);
      }
    }
  }, [open, config, setValue]);

  const addRule = () => {
    setRules([
      ...rules,
      { minValue: 0, maxValue: 100, valuation: 'Sin problema', color: '#22c55e' },
    ]);
  };

  const removeRule = (index) => {
    if (rules.length > 1) {
      setRules(rules.filter((_, i) => i !== index));
    } else {
      toast.error('Debe haber al menos una regla');
    }
  };

  const updateRule = (index, field, value) => {
    const newRules = [...rules];
    newRules[index][field] = value;
    setRules(newRules);
  };

  const validateRules = () => {
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];

      if (!rule.minValue && rule.minValue !== 0) {
        toast.error(`Regla ${i + 1}: El valor mínimo es requerido`);
        return false;
      }

      if (!rule.maxValue && rule.maxValue !== 0) {
        toast.error(`Regla ${i + 1}: El valor máximo es requerido`);
        return false;
      }

      if (parseFloat(rule.minValue) >= parseFloat(rule.maxValue)) {
        toast.error(`Regla ${i + 1}: El valor mínimo debe ser menor que el valor máximo`);
        return false;
      }

      if (!rule.valuation) {
        toast.error(`Regla ${i + 1}: La valoración es requerida`);
        return false;
      }

      if (!rule.color) {
        toast.error(`Regla ${i + 1}: El color es requerido`);
        return false;
      }
    }

    return true;
  };

  const onSubmit = async (data) => {
    try {
      // Validate test title
      if (!data.testTitle || data.testTitle.trim().length < 3) {
        toast.error('El título del test debe tener al menos 3 caracteres');
        return;
      }

      // Validate rules
      if (!validateRules()) {
        return;
      }

      setSubmitting(true);

      await apiClient.configuration.updateValueConfiguration(config.id, {
        testTitle: data.testTitle.trim(),
        rules: rules.map((rule) => ({
          minValue: parseFloat(rule.minValue),
          maxValue: parseFloat(rule.maxValue),
          valuation: rule.valuation,
          color: rule.color.trim(),
        })),
      });

      toast.success('Configuración de valores actualizada correctamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating value configuration:', error);
      toast.error(
        error.response?.data?.error?.message || 'Error al actualizar la configuración de valores'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      reset();
      setRules([{ minValue: 0, maxValue: 100, valuation: 'Sin problema', color: '#22c55e' }]);
      onClose();
    }
  };

  if (!config) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-emooti-blue-600" />
            Editar Configuración de Valores
          </DialogTitle>
          <DialogDescription>
            Modifica la configuración de valores para el test
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Test Title */}
          <div className="space-y-2">
            <Label htmlFor="testTitle">
              Título del Test <span className="text-red-500">*</span>
            </Label>
            <Input
              id="testTitle"
              placeholder="Ej: Test de Desarrollo Motor"
              {...register('testTitle', {
                required: 'El título del test es requerido',
                minLength: {
                  value: 3,
                  message: 'El título debe tener al menos 3 caracteres',
                },
              })}
            />
            {errors.testTitle && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.testTitle.message}
              </p>
            )}
          </div>

          {/* Rules */}
          <div className="space-y-3">
            <Label>
              Reglas <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-slate-500">
              Define los rangos de valores y sus valoraciones correspondientes
            </p>

            {rules.map((rule, index) => (
              <div key={index} className="flex items-end gap-2 p-3 bg-slate-50 rounded-lg">
                <div className="flex-1 grid grid-cols-4 gap-2">
                  {/* Min Value */}
                  <div>
                    <Label className="text-xs">Valor Mínimo</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={rule.minValue}
                      onChange={(e) => updateRule(index, 'minValue', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  {/* Max Value */}
                  <div>
                    <Label className="text-xs">Valor Máximo</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={rule.maxValue}
                      onChange={(e) => updateRule(index, 'maxValue', e.target.value)}
                      placeholder="100"
                    />
                  </div>

                  {/* Valuation */}
                  <div>
                    <Label className="text-xs">Valoración</Label>
                    <Select
                      value={rule.valuation}
                      onValueChange={(value) => updateRule(index, 'valuation', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {VALUATION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Color */}
                  <div>
                    <Label className="text-xs">Color</Label>
                    <Input
                      type="text"
                      value={rule.color}
                      onChange={(e) => updateRule(index, 'color', e.target.value)}
                      placeholder="#22c55e"
                    />
                  </div>
                </div>

                {/* Remove Button */}
                {rules.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeRule(index)}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}

            {/* Add Rule Button */}
            <Button type="button" variant="outline" onClick={addRule} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Añadir Regla
            </Button>
          </div>

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
