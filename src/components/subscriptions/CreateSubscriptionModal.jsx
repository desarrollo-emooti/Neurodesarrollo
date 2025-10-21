import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CreditCard, User, Settings, Receipt, Search, X } from 'lucide-react';

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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

// API
import { apiClient } from '@/lib/api';

// Constants
const PAYMENT_TYPES = [
  { value: 'B2B', label: 'B2B' },
  { value: 'B2B2C', label: 'B2B2C' },
];

export default function CreateSubscriptionModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [centers, setCenters] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');

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
      paymentType: 'B2B',
      centerId: '',
      recipientName: '',
      recipientEmail: '',
      pricePerStudent: '',
      startDate: '',
      isRecurring: false,
      nextBillingDate: '',
      isActive: true,
    },
  });

  const selectedCenterId = watch('centerId');
  const isRecurring = watch('isRecurring');
  const pricePerStudent = watch('pricePerStudent');
  const startDate = watch('startDate');

  useEffect(() => {
    if (open) {
      loadCenters();
    }
  }, [open]);

  useEffect(() => {
    if (selectedCenterId) {
      loadStudents(selectedCenterId);
    } else {
      setStudents([]);
      setSelectedStudents([]);
    }
  }, [selectedCenterId]);

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

  const loadStudents = async (centerId) => {
    try {
      setLoadingStudents(true);
      const response = await apiClient.students.getAll({ centerId, limit: 1000 });
      setStudents(response.data.data || []);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Error al cargar estudiantes');
    } finally {
      setLoadingStudents(false);
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const filteredStudents = students.filter(student => {
    if (!studentSearch) return true;
    const search = studentSearch.toLowerCase();
    return (
      student.studentId?.toLowerCase().includes(search) ||
      student.fullName?.toLowerCase().includes(search) ||
      student.course?.toLowerCase().includes(search) ||
      student.etapa?.toLowerCase().includes(search)
    );
  });

  const onSubmit = async (data) => {
    try {
      // Validations
      if (selectedStudents.length === 0) {
        toast.error('Debes seleccionar al menos un estudiante');
        return;
      }

      if (!data.recipientEmail.includes('@')) {
        toast.error('El email del receptor no es válido');
        return;
      }

      if (parseFloat(data.pricePerStudent) <= 0) {
        toast.error('El precio por estudiante debe ser mayor a 0');
        return;
      }

      if (data.isRecurring && !data.nextBillingDate) {
        toast.error('La próxima fecha de facturación es requerida para suscripciones recurrentes');
        return;
      }

      if (data.isRecurring && data.nextBillingDate && data.startDate) {
        const start = new Date(data.startDate);
        const next = new Date(data.nextBillingDate);
        if (next <= start) {
          toast.error('La próxima fecha de facturación debe ser posterior a la fecha de inicio');
          return;
        }
      }

      setLoading(true);

      const subscriptionData = {
        ...data,
        studentIds: selectedStudents,
        pricePerStudent: parseFloat(data.pricePerStudent),
      };

      // Remove empty optional fields
      Object.keys(subscriptionData).forEach(key => {
        if (subscriptionData[key] === '' || subscriptionData[key] === null || subscriptionData[key] === undefined) {
          delete subscriptionData[key];
        }
      });

      await apiClient.subscriptions.create(subscriptionData);

      toast.success('Suscripción creada correctamente');
      reset();
      setSelectedStudents([]);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error(error.response?.data?.error?.message || 'Error al crear suscripción');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      setSelectedStudents([]);
      setStudentSearch('');
      onClose();
    }
  };

  // Calculate total
  const calculateTotal = () => {
    const price = parseFloat(pricePerStudent) || 0;
    const count = selectedStudents.length;
    return (price * count).toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emooti-blue-600" />
            Crear Nueva Suscripción
          </DialogTitle>
          <DialogDescription>
            Configura una nueva suscripción de facturación
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 1. Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Información Básica
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Nombre de la Configuración *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Suscripción Mensual Colegio ABC"
                  {...register('name', {
                    required: 'El nombre es requerido',
                    minLength: {
                      value: 3,
                      message: 'El nombre debe tener al menos 3 caracteres',
                    },
                  })}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentType">Tipo de Pago *</Label>
                <Select
                  onValueChange={(value) => setValue('paymentType', value)}
                  value={watch('paymentType')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="centerId">Centro *</Label>
                <Select
                  onValueChange={(value) => setValue('centerId', value)}
                  value={watch('centerId')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar centro" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingCenters ? (
                      <SelectItem value="loading" disabled>
                        Cargando centros...
                      </SelectItem>
                    ) : (
                      centers.map((center) => (
                        <SelectItem key={center.id} value={center.id}>
                          {center.name} ({center.code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.centerId && (
                  <p className="text-sm text-red-600">{errors.centerId.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* 2. Recipient Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Destinatario
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipientName">Nombre del Receptor *</Label>
                <Input
                  id="recipientName"
                  placeholder="Ej: Juan Pérez"
                  {...register('recipientName', {
                    required: 'El nombre del receptor es requerido',
                  })}
                />
                {errors.recipientName && (
                  <p className="text-sm text-red-600">{errors.recipientName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientEmail">Email del Receptor *</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  placeholder="Ej: juan@example.com"
                  {...register('recipientEmail', {
                    required: 'El email del receptor es requerido',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido',
                    },
                  })}
                />
                {errors.recipientEmail && (
                  <p className="text-sm text-red-600">{errors.recipientEmail.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* 3. Billing Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuración de Facturación
            </h3>

            <div className="space-y-4">
              {/* Student Selection */}
              <div className="space-y-2">
                <Label>Estudiantes * ({selectedStudents.length} seleccionados)</Label>

                {!selectedCenterId ? (
                  <p className="text-sm text-slate-500 italic">
                    Primero selecciona un centro para cargar los estudiantes
                  </p>
                ) : loadingStudents ? (
                  <p className="text-sm text-slate-500 italic">Cargando estudiantes...</p>
                ) : students.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">
                    No hay estudiantes disponibles en este centro
                  </p>
                ) : (
                  <div className="space-y-2">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Buscar estudiante..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="pl-10"
                      />
                      {studentSearch && (
                        <button
                          type="button"
                          onClick={() => setStudentSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Student List */}
                    <div className="border rounded-lg max-h-64 overflow-y-auto">
                      {filteredStudents.length === 0 ? (
                        <p className="p-4 text-sm text-slate-500 text-center">
                          No se encontraron estudiantes
                        </p>
                      ) : (
                        filteredStudents.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center gap-3 p-3 hover:bg-slate-50 border-b last:border-b-0 cursor-pointer"
                            onClick={() => toggleStudentSelection(student.id)}
                          >
                            <Checkbox
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={() => toggleStudentSelection(student.id)}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">
                                {student.studentId} - {student.fullName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {student.etapa} - {student.course}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Selected Students */}
                    {selectedStudents.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg">
                        {selectedStudents.map((studentId) => {
                          const student = students.find(s => s.id === studentId);
                          if (!student) return null;
                          return (
                            <Badge
                              key={studentId}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {student.fullName}
                              <button
                                type="button"
                                onClick={() => toggleStudentSelection(studentId)}
                                className="ml-1 hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerStudent">Precio por Estudiante (€) *</Label>
                  <Input
                    id="pricePerStudent"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej: 25.00"
                    {...register('pricePerStudent', {
                      required: 'El precio por estudiante es requerido',
                      min: {
                        value: 0.01,
                        message: 'El precio debe ser mayor a 0',
                      },
                    })}
                  />
                  {errors.pricePerStudent && (
                    <p className="text-sm text-red-600">{errors.pricePerStudent.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de Inicio *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...register('startDate', {
                      required: 'La fecha de inicio es requerida',
                    })}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-red-600">{errors.startDate.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isRecurring"
                    checked={isRecurring}
                    onCheckedChange={(checked) => setValue('isRecurring', checked)}
                  />
                  <Label htmlFor="isRecurring" className="cursor-pointer">
                    ¿Es recurrente?
                  </Label>
                </div>

                {isRecurring && (
                  <div className="pl-6 space-y-2">
                    <Label htmlFor="nextBillingDate">Próxima Fecha de Facturación *</Label>
                    <Input
                      id="nextBillingDate"
                      type="date"
                      min={startDate}
                      {...register('nextBillingDate', {
                        required: isRecurring ? 'La próxima fecha de facturación es requerida para suscripciones recurrentes' : false,
                      })}
                    />
                    {errors.nextBillingDate && (
                      <p className="text-sm text-red-600">{errors.nextBillingDate.message}</p>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={watch('isActive')}
                    onCheckedChange={(checked) => setValue('isActive', checked)}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    ¿Está activa?
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Summary */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Resumen
            </h3>

            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Estudiantes seleccionados:</span>
                <span className="font-medium text-slate-900">{selectedStudents.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Precio por estudiante:</span>
                <span className="font-medium text-slate-900">
                  {pricePerStudent ? `${parseFloat(pricePerStudent).toFixed(2)} €` : '0.00 €'}
                </span>
              </div>
              <div className="flex justify-between text-base border-t pt-2">
                <span className="font-semibold text-slate-900">Total:</span>
                <span className="font-bold text-emooti-blue-600">
                  {calculateTotal()} €
                </span>
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
              disabled={loading || loadingCenters || loadingStudents}
              className="emooti-gradient text-white"
            >
              {loading ? 'Creando...' : 'Crear Suscripción'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
