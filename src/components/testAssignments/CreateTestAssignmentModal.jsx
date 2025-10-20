import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ClipboardList, User, Calendar, FileText, AlertCircle, Link as LinkIcon } from 'lucide-react';

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
const TEST_STATUS_OPTIONS = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'SI', label: 'Completada' },
  { value: 'NO', label: 'No realizada' },
  { value: 'NA', label: 'N/A' },
];

const PRIORITY_OPTIONS = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
];

const CONSENT_OPTIONS = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'SI', label: 'Sí' },
  { value: 'NO', label: 'No' },
  { value: 'NA', label: 'N/A' },
];

export default function CreateTestAssignmentModal({ open, onClose, onSuccess }) {
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    defaultValues: {
      studentId: '',
      testTitle: '',
      testLink: '',
      testDate: '',
      testStatus: 'PENDIENTE',
      consentGiven: 'PENDIENTE',
      priority: 'MEDIA',
      notes: '',
    },
  });

  // Load students when modal opens
  useEffect(() => {
    if (open) {
      loadStudents();
    }
  }, [open]);

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await apiClient.students.getAll();
      setStudents(response.data.data || []);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Error al cargar estudiantes');
    } finally {
      setLoadingStudents(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Prepare assignment data
      const assignmentData = {
        ...data,
        assignedBy: currentUser.id,
        assignedDate: new Date().toISOString(),
        active: true,
      };

      // Remove empty optional fields
      Object.keys(assignmentData).forEach(key => {
        if (assignmentData[key] === '' || assignmentData[key] === null || assignmentData[key] === undefined) {
          delete assignmentData[key];
        }
      });

      await apiClient.testAssignments.create(assignmentData);

      toast.success('Asignación de prueba creada correctamente');
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating test assignment:', error);
      toast.error(error.response?.data?.error?.message || 'Error al crear asignación de prueba');
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

  // Get today's date in YYYY-MM-DD format for min date
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emooti-blue-600" />
            Crear Nueva Asignación de Prueba
          </DialogTitle>
          <DialogDescription>
            Asigne una prueba a un estudiante
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Student Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Estudiante
            </h3>

            <div className="space-y-2">
              <Label htmlFor="studentId">Seleccionar Estudiante *</Label>
              <Select
                onValueChange={(value) => setValue('studentId', value)}
                value={watch('studentId')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estudiante" />
                </SelectTrigger>
                <SelectContent>
                  {loadingStudents ? (
                    <SelectItem value="loading" disabled>
                      Cargando estudiantes...
                    </SelectItem>
                  ) : (
                    students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.fullName} ({student.studentId}) - {student.center?.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.studentId && (
                <p className="text-sm text-red-600">{errors.studentId.message}</p>
              )}
            </div>
          </div>

          {/* Test Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Información de la Prueba
            </h3>

            <div className="space-y-2">
              <Label htmlFor="testTitle">Título de la Prueba *</Label>
              <Input
                id="testTitle"
                placeholder="Ej: Test de Raven's Progresivo, WISC-V, etc."
                {...register('testTitle', {
                  required: 'El título de la prueba es requerido',
                  minLength: {
                    value: 3,
                    message: 'El título debe tener al menos 3 caracteres',
                  },
                })}
              />
              {errors.testTitle && (
                <p className="text-sm text-red-600">{errors.testTitle.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="testLink" className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Enlace de la Prueba (opcional)
              </Label>
              <Input
                id="testLink"
                type="url"
                placeholder="https://..."
                {...register('testLink', {
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Debe ser una URL válida (http:// o https://)',
                  },
                })}
              />
              {errors.testLink && (
                <p className="text-sm text-red-600">{errors.testLink.message}</p>
              )}
              <p className="text-xs text-slate-500">
                Se puede generar un código QR con este enlace para que el estudiante acceda a la prueba
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="testDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha de Realización de la Prueba
                </Label>
                <Input
                  id="testDate"
                  type="date"
                  min={getTodayDate()}
                  {...register('testDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="testStatus">Estado de la Prueba</Label>
                <Select
                  onValueChange={(value) => setValue('testStatus', value)}
                  defaultValue="PENDIENTE"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEST_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Priority and Consent */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Prioridad y Consentimiento
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select
                  onValueChange={(value) => setValue('priority', value)}
                  defaultValue="MEDIA"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="consentGiven">Consentimiento</Label>
                <Select
                  onValueChange={(value) => setValue('consentGiven', value)}
                  defaultValue="PENDIENTE"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Consentimiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONSENT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
              Notas Adicionales
            </h3>

            <div className="space-y-2">
              <Label htmlFor="notes">Observaciones o Instrucciones</Label>
              <Textarea
                id="notes"
                placeholder="Añada cualquier nota relevante sobre esta asignación..."
                rows={4}
                {...register('notes')}
              />
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
              disabled={loading || loadingStudents}
              className="emooti-gradient text-white"
            >
              {loading ? 'Creando...' : 'Crear Asignación'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
