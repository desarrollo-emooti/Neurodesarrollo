import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { UserPlus, User, Hash, Calendar, MapPin, FileText, CreditCard, Building2 } from 'lucide-react';

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
import { Skeleton } from '@/components/ui/skeleton';

// API
import { apiClient } from '@/lib/api';

// Auth Store
import useAuthStore from '@/store/authStore';

// Etapa options
const ETAPA_OPTIONS = [
  { value: 'EDUCACION_INFANTIL', label: 'Educación Infantil' },
  { value: 'EDUCACION_PRIMARIA', label: 'Educación Primaria' },
  { value: 'ESO', label: 'ESO' },
  { value: 'BACHILLERATO', label: 'Bachillerato' },
  { value: 'FORMACION_PROFESIONAL', label: 'Formación Profesional' },
];

const CONSENT_OPTIONS = [
  { value: 'SI', label: 'Sí' },
  { value: 'NO', label: 'No' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'NA', label: 'N/A' },
];

const PAYMENT_TYPE_OPTIONS = [
  { value: 'ESCUELA', label: 'Escuela' },
  { value: 'FAMILIA', label: 'Familia' },
  { value: 'SEGURO', label: 'Seguro' },
  { value: 'SUBVENCION', label: 'Subvención' },
  { value: 'GRATUITO', label: 'Gratuito' },
  { value: 'NA', label: 'N/A' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'PAGADO', label: 'Pagado' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'NA', label: 'N/A' },
];

const GENDER_OPTIONS = [
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Femenino', label: 'Femenino' },
  { value: 'Otro', label: 'Otro' },
];

export default function StudentEditForm({ open, onClose, onSuccess, student }) {
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [centers, setCenters] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm();

  useEffect(() => {
    if (student && open) {
      loadStudentData();
      loadCenters();
    }
  }, [student, open]);

  const loadCenters = async () => {
    try {
      setLoadingCenters(true);
      const response = await apiClient.centers.getAll();
      setCenters(response.data.data || []);
    } catch (error) {
      console.error('Error loading centers:', error);
      toast.error('Error al cargar centros');
    } finally {
      setLoadingCenters(false);
    }
  };

  const loadStudentData = async () => {
    try {
      setLoadingData(true);

      // If we have full student data, use it directly
      if (student.fullName && student.centerId) {
        // Format birthDate for input[type="date"]
        const birthDate = student.birthDate
          ? new Date(student.birthDate).toISOString().split('T')[0]
          : '';

        reset({
          studentId: student.studentId || '',
          nia: student.nia || '',
          fullName: student.fullName || '',
          dni: student.dni || '',
          phone: student.phone || '',
          birthDate: birthDate,
          gender: student.gender || '',
          nationality: student.nationality || 'Española',
          etapa: student.etapa || 'EDUCACION_PRIMARIA',
          course: student.course || '',
          classGroup: student.classGroup || '',
          centerId: student.centerId || '',
          disabilityDegree: student.disabilityDegree || 0,
          specialEducationalNeeds: student.specialEducationalNeeds || '',
          medicalObservations: student.medicalObservations || '',
          generalObservations: student.generalObservations || '',
          consentGiven: student.consentGiven || 'PENDIENTE',
          paymentType: student.paymentType || 'NA',
          paymentStatus: student.paymentStatus || 'NA',
          active: student.active !== undefined ? student.active : true,
        });
      } else {
        // Otherwise fetch full details
        const response = await apiClient.students.getById(student.id);
        const fullStudent = response.data.data;

        // Format birthDate for input[type="date"]
        const birthDate = fullStudent.birthDate
          ? new Date(fullStudent.birthDate).toISOString().split('T')[0]
          : '';

        reset({
          studentId: fullStudent.studentId || '',
          nia: fullStudent.nia || '',
          fullName: fullStudent.fullName || '',
          dni: fullStudent.dni || '',
          phone: fullStudent.phone || '',
          birthDate: birthDate,
          gender: fullStudent.gender || '',
          nationality: fullStudent.nationality || 'Española',
          etapa: fullStudent.etapa || 'EDUCACION_PRIMARIA',
          course: fullStudent.course || '',
          classGroup: fullStudent.classGroup || '',
          centerId: fullStudent.centerId || '',
          disabilityDegree: fullStudent.disabilityDegree || 0,
          specialEducationalNeeds: fullStudent.specialEducationalNeeds || '',
          medicalObservations: fullStudent.medicalObservations || '',
          generalObservations: fullStudent.generalObservations || '',
          consentGiven: fullStudent.consentGiven || 'PENDIENTE',
          paymentType: fullStudent.paymentType || 'NA',
          paymentStatus: fullStudent.paymentStatus || 'NA',
          active: fullStudent.active !== undefined ? fullStudent.active : true,
        });
      }
    } catch (error) {
      console.error('Error loading student:', error);
      toast.error('Error al cargar datos del estudiante');
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Prepare student data
      const studentData = {
        ...data,
        disabilityDegree: parseInt(data.disabilityDegree) || 0,
      };

      // Remove empty optional fields
      Object.keys(studentData).forEach(key => {
        if (studentData[key] === '' && key !== 'studentId' && key !== 'nia' && key !== 'dni') {
          studentData[key] = null;
        }
      });

      await apiClient.students.update(student.id, studentData);

      toast.success('Estudiante actualizado correctamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error(error.response?.data?.error?.message || 'Error al actualizar estudiante');
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

  if (loadingData || loadingCenters) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
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
            <User className="w-5 h-5 text-emooti-blue-600" />
            Editar Estudiante
          </DialogTitle>
          <DialogDescription>
            Modifique la información del estudiante
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
              Información Básica
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nombre Completo *
                </Label>
                <Input
                  id="fullName"
                  placeholder="Nombre y apellidos del estudiante"
                  {...register('fullName', {
                    required: 'El nombre completo es requerido',
                    minLength: {
                      value: 3,
                      message: 'El nombre debe tener al menos 3 caracteres',
                    },
                  })}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-600">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha de Nacimiento *
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  {...register('birthDate', {
                    required: 'La fecha de nacimiento es requerida',
                  })}
                />
                {errors.birthDate && (
                  <p className="text-sm text-red-600">{errors.birthDate.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentId" className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  ID del Estudiante
                </Label>
                <Input
                  id="studentId"
                  placeholder="EST001"
                  {...register('studentId')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nia">NIA</Label>
                <Input
                  id="nia"
                  placeholder="Número de identificación del alumno"
                  {...register('nia')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dni">DNI/NIE</Label>
                <Input
                  id="dni"
                  placeholder="12345678A"
                  {...register('dni')}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Género</Label>
                <Select
                  onValueChange={(value) => setValue('gender', value)}
                  value={watch('gender')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar género" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationality">Nacionalidad</Label>
                <Input
                  id="nationality"
                  placeholder="Española"
                  {...register('nationality')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  placeholder="+34 600 000 000"
                  {...register('phone')}
                />
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
              Información Académica
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="centerId" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Centro Educativo *
                </Label>
                <Select
                  onValueChange={(value) => setValue('centerId', value)}
                  value={watch('centerId')}
                  disabled={currentUser?.userType === 'ORIENTADOR'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar centro" />
                  </SelectTrigger>
                  <SelectContent>
                    {centers.map((center) => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.name} ({center.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.centerId && (
                  <p className="text-sm text-red-600">{errors.centerId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="etapa">Etapa Educativa *</Label>
                <Select
                  onValueChange={(value) => setValue('etapa', value)}
                  value={watch('etapa')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {ETAPA_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course">Curso *</Label>
                <Input
                  id="course"
                  placeholder="1º, 2º, 3º..."
                  {...register('course', {
                    required: 'El curso es requerido',
                  })}
                />
                {errors.course && (
                  <p className="text-sm text-red-600">{errors.course.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="classGroup">Grupo/Clase *</Label>
                <Input
                  id="classGroup"
                  placeholder="A, B, C..."
                  {...register('classGroup', {
                    required: 'El grupo es requerido',
                  })}
                />
                {errors.classGroup && (
                  <p className="text-sm text-red-600">{errors.classGroup.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Medical & Special Needs */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Necesidades Especiales y Observaciones Médicas
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="disabilityDegree">
                  Grado de Discapacidad (%)
                </Label>
                <Input
                  id="disabilityDegree"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  {...register('disabilityDegree')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialEducationalNeeds">
                  Necesidades Educativas Especiales
                </Label>
                <Input
                  id="specialEducationalNeeds"
                  placeholder="Describe las necesidades especiales"
                  {...register('specialEducationalNeeds')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalObservations">
                Observaciones Médicas
              </Label>
              <Textarea
                id="medicalObservations"
                placeholder="Alergias, medicación, condiciones médicas relevantes..."
                rows={3}
                {...register('medicalObservations')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="generalObservations">
                Observaciones Generales
              </Label>
              <Textarea
                id="generalObservations"
                placeholder="Información adicional relevante..."
                rows={3}
                {...register('generalObservations')}
              />
            </div>
          </div>

          {/* Consent & Payment */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Consentimiento y Pago
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consentGiven">Consentimiento</Label>
                <Select
                  onValueChange={(value) => setValue('consentGiven', value)}
                  value={watch('consentGiven')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado del consentimiento" />
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

              <div className="space-y-2">
                <Label htmlFor="paymentType">Tipo de Pago</Label>
                <Select
                  onValueChange={(value) => setValue('paymentType', value)}
                  value={watch('paymentType')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Estado del Pago</Label>
                <Select
                  onValueChange={(value) => setValue('paymentStatus', value)}
                  value={watch('paymentStatus')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado del pago" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              disabled={loading}
              className="emooti-gradient text-white"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
