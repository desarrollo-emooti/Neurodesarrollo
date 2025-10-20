import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FileText, User, Calendar, BarChart3, AlertCircle } from 'lucide-react';

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
const INTERPRETATION_OPTIONS = [
  { value: 'MUY_BAJO', label: 'Muy Bajo' },
  { value: 'BAJO', label: 'Bajo' },
  { value: 'MEDIO_BAJO', label: 'Medio-Bajo' },
  { value: 'MEDIO', label: 'Medio' },
  { value: 'MEDIO_ALTO', label: 'Medio-Alto' },
  { value: 'ALTO', label: 'Alto' },
  { value: 'MUY_ALTO', label: 'Muy Alto' },
];

export default function CreateTestResultModal({ open, onClose, onSuccess }) {
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
      testName: '',
      academicYear: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
      executionDate: new Date().toISOString().split('T')[0],
      rawScore: '',
      percentile: '',
      standardScore: '',
      interpretation: 'MEDIO',
      observations: '',
      incidents: '',
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

      // Prepare result data
      const resultData = {
        ...data,
        rawScore: data.rawScore ? parseFloat(data.rawScore) : null,
        percentile: data.percentile ? parseInt(data.percentile) : null,
        standardScore: data.standardScore ? parseFloat(data.standardScore) : null,
      };

      // Remove empty optional fields
      Object.keys(resultData).forEach(key => {
        if (resultData[key] === '' || resultData[key] === null || resultData[key] === undefined) {
          delete resultData[key];
        }
      });

      await apiClient.testResults.create(resultData);

      toast.success('Resultado de prueba creado correctamente');
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating test result:', error);
      toast.error(error.response?.data?.error?.message || 'Error al crear resultado de prueba');
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emooti-blue-600" />
            Crear Nuevo Resultado de Prueba
          </DialogTitle>
          <DialogDescription>
            Registre manualmente un resultado de evaluación
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
              <Label htmlFor="studentId">Estudiante *</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="testName">Nombre de la Prueba *</Label>
                <Input
                  id="testName"
                  placeholder="Ej: WISC-V, Raven's Matrices Progresivas, etc."
                  {...register('testName', {
                    required: 'El nombre de la prueba es requerido',
                    minLength: {
                      value: 3,
                      message: 'El nombre debe tener al menos 3 caracteres',
                    },
                  })}
                />
                {errors.testName && (
                  <p className="text-sm text-red-600">{errors.testName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="academicYear">Año Académico *</Label>
                <Input
                  id="academicYear"
                  placeholder="2024/2025"
                  {...register('academicYear', {
                    required: 'El año académico es requerido',
                  })}
                />
                {errors.academicYear && (
                  <p className="text-sm text-red-600">{errors.academicYear.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="executionDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha de Realización *
                </Label>
                <Input
                  id="executionDate"
                  type="date"
                  {...register('executionDate', {
                    required: 'La fecha de realización es requerida',
                  })}
                />
                {errors.executionDate && (
                  <p className="text-sm text-red-600">{errors.executionDate.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Scores and Results */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Puntuaciones y Resultados
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rawScore">Puntuación Bruta</Label>
                <Input
                  id="rawScore"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('rawScore')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentile">Percentil (0-100)</Label>
                <Input
                  id="percentile"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="50"
                  {...register('percentile', {
                    min: { value: 0, message: 'Mínimo 0' },
                    max: { value: 100, message: 'Máximo 100' },
                  })}
                />
                {errors.percentile && (
                  <p className="text-sm text-red-600">{errors.percentile.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="standardScore">Puntuación Estándar</Label>
                <Input
                  id="standardScore"
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  {...register('standardScore')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interpretation">Interpretación</Label>
              <Select
                onValueChange={(value) => setValue('interpretation', value)}
                defaultValue="MEDIO"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar interpretación" />
                </SelectTrigger>
                <SelectContent>
                  {INTERPRETATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Observations */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Observaciones
            </h3>

            <div className="space-y-2">
              <Label htmlFor="observations">Observaciones Generales</Label>
              <Textarea
                id="observations"
                placeholder="Comentarios sobre el resultado, contexto de la evaluación..."
                rows={3}
                {...register('observations')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="incidents">Incidencias Durante la Prueba</Label>
              <Textarea
                id="incidents"
                placeholder="Interrupciones, dificultades técnicas, comportamiento del estudiante..."
                rows={3}
                {...register('incidents')}
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
              {loading ? 'Creando...' : 'Crear Resultado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
