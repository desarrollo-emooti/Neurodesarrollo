import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Edit2, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';

const USER_TYPES = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'CLINICA', label: 'Clínica' },
  { value: 'ORIENTADOR', label: 'Orientador' },
  { value: 'EXAMINADOR', label: 'Examinador' },
  { value: 'FAMILIA', label: 'Familia' },
];

const STATUS_TYPES = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'pending_invitation', label: 'Pendiente de Invitación' },
];

const ETAPAS = [
  'Educación Infantil',
  'Educación Primaria',
  'ESO',
  'Bachillerato',
  'Formación Profesional',
];

const CURSOS = [
  '1º Infantil', '2º Infantil', '3º Infantil',
  '1º Primaria', '2º Primaria', '3º Primaria', '4º Primaria', '5º Primaria', '6º Primaria',
  '1º ESO', '2º ESO', '3º ESO', '4º ESO',
  '1º Bachillerato', '2º Bachillerato',
  'FP Grado Medio', 'FP Grado Superior',
];

const GRUPOS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export default function BulkEditModal({ open, onClose, selectedUsers, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [centers, setCenters] = useState([]);

  // Fields to update
  const [updateFields, setUpdateFields] = useState({
    user_type: false,
    status: false,
    center_id: false,
    center_ids: false,
    allowed_etapas: false,
    allowed_courses: false,
    allowed_groups: false,
  });

  // Values for fields
  const [values, setValues] = useState({
    user_type: '',
    status: '',
    center_id: '',
    center_ids: [],
    allowed_etapas: [],
    allowed_courses: [],
    allowed_groups: [],
  });

  React.useEffect(() => {
    if (open) {
      loadCenters();
      resetForm();
    }
  }, [open]);

  const loadCenters = async () => {
    try {
      const response = await apiClient.centers.getAll();
      setCenters(response.data.data || []);
    } catch (error) {
      console.error('Error loading centers:', error);
      setCenters([
        { id: 'CTR_001', name: 'Centro Madrid' },
        { id: 'CTR_002', name: 'Centro Barcelona' },
      ]);
    }
  };

  const resetForm = () => {
    setUpdateFields({
      user_type: false,
      status: false,
      center_id: false,
      center_ids: false,
      allowed_etapas: false,
      allowed_courses: false,
      allowed_groups: false,
    });
    setValues({
      user_type: '',
      status: '',
      center_id: '',
      center_ids: [],
      allowed_etapas: [],
      allowed_courses: [],
      allowed_groups: [],
    });
  };

  const toggleUpdateField = (field) => {
    setUpdateFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleValueChange = (field, value) => {
    setValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleArrayValue = (field, value) => {
    setValues(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const handleBulkUpdate = async () => {
    // Prepare update data
    const updateData = {};
    Object.keys(updateFields).forEach(field => {
      if (updateFields[field]) {
        updateData[field] = values[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      toast.error('Seleccione al menos un campo para actualizar');
      return;
    }

    setLoading(true);
    try {
      // Call API for bulk update
      await apiClient.users.bulkUpdate({
        user_ids: selectedUsers,
        update_data: updateData,
      });

      toast.success(`${selectedUsers.length} usuarios actualizados correctamente`);
      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error in bulk update:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const selectedFieldsCount = Object.values(updateFields).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit2 className="w-5 h-5" />
            <span>Edición Masiva de Usuarios</span>
          </DialogTitle>
          <DialogDescription>
            Seleccione los campos que desea actualizar para los {selectedUsers?.length || 0} usuarios seleccionados.
          </DialogDescription>
        </DialogHeader>

        {/* Warning */}
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900">Advertencia</p>
              <p className="text-xs text-amber-700 mt-1">
                Los cambios se aplicarán a TODOS los usuarios seleccionados.
                Los campos protegidos de usuarios invitados por base44 no se modificarán.
              </p>
            </div>
          </div>
        </Card>

        {/* Selected fields counter */}
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            {selectedFieldsCount} campo(s) seleccionado(s) para actualizar
          </p>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-1 space-y-4">
          {/* User Type */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Checkbox
                id="update-user-type"
                checked={updateFields.user_type}
                onCheckedChange={() => toggleUpdateField('user_type')}
              />
              <Label htmlFor="update-user-type" className="cursor-pointer font-medium">
                Tipo de Usuario
              </Label>
            </div>
            {updateFields.user_type && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Select value={values.user_type} onValueChange={(value) => handleValueChange('user_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}
          </div>

          {/* Status */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Checkbox
                id="update-status"
                checked={updateFields.status}
                onCheckedChange={() => toggleUpdateField('status')}
              />
              <Label htmlFor="update-status" className="cursor-pointer font-medium">
                Estado
              </Label>
            </div>
            {updateFields.status && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Select value={values.status} onValueChange={(value) => handleValueChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_TYPES.map(status => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}
          </div>

          {/* Center (single) */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Checkbox
                id="update-center"
                checked={updateFields.center_id}
                onCheckedChange={() => toggleUpdateField('center_id')}
              />
              <Label htmlFor="update-center" className="cursor-pointer font-medium">
                Centro (para Orientadores)
              </Label>
            </div>
            {updateFields.center_id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Select value={values.center_id} onValueChange={(value) => handleValueChange('center_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione centro" />
                  </SelectTrigger>
                  <SelectContent>
                    {centers.map(center => (
                      <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}
          </div>

          {/* Centers (multiple) */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Checkbox
                id="update-centers"
                checked={updateFields.center_ids}
                onCheckedChange={() => toggleUpdateField('center_ids')}
              />
              <Label htmlFor="update-centers" className="cursor-pointer font-medium">
                Centros (para Clínicas y Examinadores)
              </Label>
            </div>
            {updateFields.center_ids && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 max-h-48 overflow-y-auto"
              >
                {centers.map(center => (
                  <div key={center.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`bulk-center-${center.id}`}
                      checked={values.center_ids.includes(center.id)}
                      onCheckedChange={() => toggleArrayValue('center_ids', center.id)}
                    />
                    <Label htmlFor={`bulk-center-${center.id}`} className="cursor-pointer text-sm">
                      {center.name}
                    </Label>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Etapas */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Checkbox
                id="update-etapas"
                checked={updateFields.allowed_etapas}
                onCheckedChange={() => toggleUpdateField('allowed_etapas')}
              />
              <Label htmlFor="update-etapas" className="cursor-pointer font-medium">
                Etapas Educativas Permitidas
              </Label>
            </div>
            {updateFields.allowed_etapas && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 max-h-48 overflow-y-auto"
              >
                {ETAPAS.map(etapa => (
                  <div key={etapa} className="flex items-center space-x-2">
                    <Checkbox
                      id={`bulk-etapa-${etapa}`}
                      checked={values.allowed_etapas.includes(etapa)}
                      onCheckedChange={() => toggleArrayValue('allowed_etapas', etapa)}
                    />
                    <Label htmlFor={`bulk-etapa-${etapa}`} className="cursor-pointer text-sm">
                      {etapa}
                    </Label>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Cursos */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Checkbox
                id="update-cursos"
                checked={updateFields.allowed_courses}
                onCheckedChange={() => toggleUpdateField('allowed_courses')}
              />
              <Label htmlFor="update-cursos" className="cursor-pointer font-medium">
                Cursos Permitidos
              </Label>
            </div>
            {updateFields.allowed_courses && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 max-h-48 overflow-y-auto"
              >
                {CURSOS.map(curso => (
                  <div key={curso} className="flex items-center space-x-2">
                    <Checkbox
                      id={`bulk-curso-${curso}`}
                      checked={values.allowed_courses.includes(curso)}
                      onCheckedChange={() => toggleArrayValue('allowed_courses', curso)}
                    />
                    <Label htmlFor={`bulk-curso-${curso}`} className="cursor-pointer text-sm">
                      {curso}
                    </Label>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Grupos */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Checkbox
                id="update-grupos"
                checked={updateFields.allowed_groups}
                onCheckedChange={() => toggleUpdateField('allowed_groups')}
              />
              <Label htmlFor="update-grupos" className="cursor-pointer font-medium">
                Grupos/Clases Permitidos
              </Label>
            </div>
            {updateFields.allowed_groups && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2"
              >
                {GRUPOS.map(grupo => (
                  <div key={grupo} className="flex items-center space-x-2">
                    <Checkbox
                      id={`bulk-grupo-${grupo}`}
                      checked={values.allowed_groups.includes(grupo)}
                      onCheckedChange={() => toggleArrayValue('allowed_groups', grupo)}
                    />
                    <Label htmlFor={`bulk-grupo-${grupo}`} className="cursor-pointer text-sm">
                      {grupo}
                    </Label>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleBulkUpdate} disabled={loading || selectedFieldsCount === 0}>
            <Check className="w-4 h-4 mr-2" />
            {loading ? 'Actualizando...' : `Actualizar ${selectedUsers?.length || 0} Usuario(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
