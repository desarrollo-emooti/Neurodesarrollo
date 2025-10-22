import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, X, FileText, AlertCircle } from 'lucide-react';
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

const TEMPLATE_TYPES = [
  { value: 'pruebas', label: 'Pruebas' },
  { value: 'resultados', label: 'Resultados' },
  { value: 'usuarios', label: 'Usuarios' },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Fecha' },
  { value: 'boolean', label: 'Booleano' },
  { value: 'select', label: 'Selección' },
];

export default function CreateImportTemplateModal({ open, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [fields, setFields] = useState([
    {
      fieldName: '',
      fieldType: 'text',
      isRequired: false,
      description: '',
      options: '',
      destinationField: '',
    },
  ]);

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
      templateType: 'pruebas',
      relatedTestId: '',
      active: true,
    },
  });

  const templateType = watch('templateType');
  const active = watch('active');

  const addField = () => {
    setFields([
      ...fields,
      {
        fieldName: '',
        fieldType: 'text',
        isRequired: false,
        description: '',
        options: '',
        destinationField: '',
      },
    ]);
  };

  const removeField = (index) => {
    if (fields.length > 1) {
      setFields(fields.filter((_, i) => i !== index));
    } else {
      toast.error('Debe haber al menos un campo');
    }
  };

  const updateField = (index, field, value) => {
    const newFields = [...fields];
    newFields[index][field] = value;
    setFields(newFields);
  };

  const validateFields = () => {
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];

      if (!field.fieldName || field.fieldName.trim().length === 0) {
        toast.error(`Campo ${i + 1}: El nombre del campo es requerido`);
        return false;
      }

      if (!field.fieldType) {
        toast.error(`Campo ${i + 1}: El tipo de campo es requerido`);
        return false;
      }

      if (!field.description || field.description.trim().length === 0) {
        toast.error(`Campo ${i + 1}: La descripción es requerida`);
        return false;
      }

      if (!field.destinationField || field.destinationField.trim().length === 0) {
        toast.error(`Campo ${i + 1}: El campo destino es requerido`);
        return false;
      }

      if (field.fieldType === 'select' && (!field.options || field.options.trim().length === 0)) {
        toast.error(`Campo ${i + 1}: Las opciones son requeridas para campos de selección`);
        return false;
      }
    }

    return true;
  };

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

      // Validate template type
      if (!data.templateType) {
        toast.error('El tipo de plantilla es requerido');
        return;
      }

      // Validate fields
      if (!validateFields()) {
        return;
      }

      setSubmitting(true);

      await apiClient.configuration.createImportTemplate({
        name: data.name.trim(),
        description: data.description.trim(),
        templateType: data.templateType,
        relatedTestId: data.relatedTestId?.trim() || null,
        fields: fields.map((field) => ({
          fieldName: field.fieldName.trim(),
          fieldType: field.fieldType,
          isRequired: field.isRequired || false,
          description: field.description.trim(),
          options: field.fieldType === 'select' ? field.options.trim() : null,
          destinationField: field.destinationField.trim(),
        })),
        active: data.active || true,
      });

      toast.success('Plantilla de importación creada correctamente');
      reset();
      setFields([
        {
          fieldName: '',
          fieldType: 'text',
          isRequired: false,
          description: '',
          options: '',
          destinationField: '',
        },
      ]);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating import template:', error);
      toast.error(
        error.response?.data?.error?.message || 'Error al crear la plantilla de importación'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      reset();
      setFields([
        {
          fieldName: '',
          fieldType: 'text',
          isRequired: false,
          description: '',
          options: '',
          destinationField: '',
        },
      ]);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emooti-blue-600" />
            Nueva Plantilla de Importación
          </DialogTitle>
          <DialogDescription>
            Crea una plantilla para importar datos de diferentes formatos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
              Información Básica
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ej: Importación de Resultados Q1"
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

              {/* Template Type */}
              <div className="space-y-2">
                <Label htmlFor="templateType">
                  Tipo <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={templateType}
                  onValueChange={(value) => setValue('templateType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">
                  Descripción <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe el propósito y formato de esta plantilla..."
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

              {/* Related Test ID */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="relatedTestId">ID de Test Relacionado</Label>
                <Input
                  id="relatedTestId"
                  placeholder="Ej: test-123 (opcional)"
                  {...register('relatedTestId')}
                />
                <p className="text-xs text-slate-500">
                  Opcional: Asocia esta plantilla a un test específico
                </p>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
              Campos <span className="text-red-500">*</span>
            </h3>
            <p className="text-xs text-slate-500">
              Define los campos que se importarán y cómo se mapearán
            </p>

            {fields.map((field, index) => (
              <div key={index} className="p-3 bg-slate-50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Campo {index + 1}</Label>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeField(index)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Eliminar
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Field Name */}
                  <div className="space-y-1">
                    <Label className="text-xs">Nombre del Campo</Label>
                    <Input
                      value={field.fieldName}
                      onChange={(e) => updateField(index, 'fieldName', e.target.value)}
                      placeholder="Ej: nombre_completo"
                    />
                  </div>

                  {/* Field Type */}
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo</Label>
                    <Select
                      value={field.fieldType}
                      onValueChange={(value) => updateField(index, 'fieldType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <Label className="text-xs">Descripción</Label>
                    <Input
                      value={field.description}
                      onChange={(e) => updateField(index, 'description', e.target.value)}
                      placeholder="Ej: Nombre completo del estudiante"
                    />
                  </div>

                  {/* Destination Field */}
                  <div className="space-y-1">
                    <Label className="text-xs">Campo Destino</Label>
                    <Input
                      value={field.destinationField}
                      onChange={(e) => updateField(index, 'destinationField', e.target.value)}
                      placeholder="Ej: fullName"
                    />
                  </div>

                  {/* Options (only for select type) */}
                  {field.fieldType === 'select' && (
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Opciones (separadas por comas)</Label>
                      <Input
                        value={field.options}
                        onChange={(e) => updateField(index, 'options', e.target.value)}
                        placeholder="Ej: Opción 1, Opción 2, Opción 3"
                      />
                    </div>
                  )}

                  {/* Is Required */}
                  <div className="col-span-2 flex items-center space-x-2">
                    <Checkbox
                      id={`field-required-${index}`}
                      checked={field.isRequired}
                      onCheckedChange={(checked) => updateField(index, 'isRequired', checked)}
                    />
                    <Label htmlFor={`field-required-${index}`} className="cursor-pointer text-xs">
                      Campo Requerido
                    </Label>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Field Button */}
            <Button type="button" variant="outline" onClick={addField} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Añadir Campo
            </Button>
          </div>

          {/* Active */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="active"
              checked={active}
              onCheckedChange={(checked) => setValue('active', checked)}
            />
            <Label htmlFor="active" className="cursor-pointer">
              Activo
            </Label>
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
              {submitting ? 'Creando...' : 'Crear Plantilla'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
