import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  CreditCard,
  Upload,
  Eye,
  EyeOff,
  X,
  ChevronDown,
  Check,
} from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';

// User types and specialties
const USER_TYPES = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'CLINICA', label: 'Clínica' },
  { value: 'ORIENTADOR', label: 'Orientador' },
  { value: 'EXAMINADOR', label: 'Examinador' },
  { value: 'FAMILIA', label: 'Familia' },
];

const SPECIALTIES = [
  'Psicología',
  'Neuropsicología',
  'Logopedia',
  'Terapeuta Ocupacional',
  'Psiquiatría',
  'Nutrición',
  'Fisioterapia',
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

const PAYMENT_METHODS = [
  { value: 'transferencia_bancaria', label: 'Transferencia Bancaria' },
  { value: 'giro_bancario', label: 'Giro Bancario' },
  { value: 'stripe', label: 'Stripe' },
];

// Spanish locations data (simplified)
const COMUNIDADES = [
  'Andalucía', 'Aragón', 'Asturias', 'Baleares', 'Canarias', 'Cantabria',
  'Castilla y León', 'Castilla-La Mancha', 'Cataluña', 'Comunidad Valenciana',
  'Extremadura', 'Galicia', 'Madrid', 'Murcia', 'Navarra', 'País Vasco', 'La Rioja'
];

const EMOOTI_TESTS = [
  { id: 'Batelle_SCR', name: 'Batelle SCR' },
  { id: 'C_Logopedia', name: 'C. Logopedia' },
  { id: 'C_Sensorimotor', name: 'C. Sensorimotor' },
  { id: 'E2P', name: 'E2P' },
];

export default function CreateUserModal({ open, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Centers and inventory data
  const [centers, setCenters] = useState([]);
  const [inventoryTests, setInventoryTests] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    // Basic data
    userType: '',
    fullName: '',
    email: '',
    dni: '',
    phone: '',
    birthDate: '',
    nationality: 'Española',

    // Address
    address: '',
    country: 'España',
    autonomousCommunity: 'Madrid',
    province: '',
    city: '',
    postalCode: '',

    // Role-specific fields
    centerIds: [], // For CLINICA, EXAMINADOR, ORIENTADOR
    specialty: '', // For CLINICA
    licenseNumber: '', // For CLINICA (optional)

    // Access filters (ORIENTADOR, EXAMINADOR)
    allowedEtapas: [],
    allowedCourses: [],
    allowedGroups: [],

    // Payment data (FAMILIA)
    paymentMethod: '',
    bankIban: '',
    bankName: '',
  });

  const [errors, setErrors] = useState({});

  // Load centers and tests on mount
  useEffect(() => {
    if (open) {
      loadCenters();
      loadInventoryTests();
      resetForm();
    }
  }, [open]);

  const loadCenters = async () => {
    try {
      const response = await apiClient.centers.getAll();
      setCenters(response.data.data || []);
    } catch (error) {
      // If centers endpoint fails, use empty array
      setCenters([]);
    }
  };

  const loadInventoryTests = async () => {
    try {
      const response = await apiClient.inventory.getAll({ category: 'Pruebas' });
      setInventoryTests(response.data.data || []);
    } catch (error) {
      // If inventory endpoint fails, use empty array
      setInventoryTests([]);
    }
  };

  const resetForm = () => {
    setFormData({
      userType: '',
      fullName: '',
      email: '',
      dni: '',
      phone: '',
      birthDate: '',
      nationality: 'Española',
      address: '',
      country: 'España',
      autonomousCommunity: 'Madrid',
      province: '',
      city: '',
      postalCode: '',
      centerIds: [],
      specialty: '',
      licenseNumber: '',
      allowedEtapas: [],
      allowedCourses: [],
      allowedGroups: [],
      paymentMethod: '',
      bankIban: '',
      bankName: '',
    });
    setErrors({});
    setStep(1);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const toggleArrayValue = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.userType) newErrors.userType = 'Tipo de usuario obligatorio';
    if (!formData.fullName) newErrors.fullName = 'Nombre completo obligatorio';
    if (!formData.email) newErrors.email = 'Email obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!formData.dni) newErrors.dni = 'DNI obligatorio';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (['ORIENTADOR', 'CLINICA', 'EXAMINADOR'].includes(formData.userType) && formData.centerIds.length === 0) {
      newErrors.centerIds = 'Seleccione al menos un centro';
    }

    if (formData.userType === 'CLINICA' && !formData.specialty) {
      newErrors.specialty = 'Especialidad obligatoria para clínica';
    }

    if (formData.userType === 'FAMILIA' && !formData.paymentMethod) {
      newErrors.paymentMethod = 'Método de pago obligatorio';
    }

    if (formData.userType === 'FAMILIA' && ['transferencia_bancaria', 'giro_bancario'].includes(formData.paymentMethod)) {
      if (!formData.bankIban) newErrors.bankIban = 'IBAN obligatorio';
      if (!formData.bankName) newErrors.bankName = 'Banco obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    // No validation needed in step 3 (just summary)
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    try {
      // Prepare data for API
      const userData = {
        ...formData,
        status: 'ACTIVE',
      };

      // Call API
      const response = await apiClient.users.create(userData);

      toast.success('Usuario creado correctamente');
      resetForm();

      // Let parent handle closing modal and reloading data
      onSuccess?.(response.data.data);
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      {/* User Type */}
      <div className="space-y-2">
        <Label htmlFor="userType" className="required">Tipo de Usuario</Label>
        <Select value={formData.userType} onValueChange={(value) => handleChange('userType', value)}>
          <SelectTrigger className={errors.userType ? 'border-red-500' : ''}>
            <SelectValue placeholder="Seleccione tipo de usuario" />
          </SelectTrigger>
          <SelectContent>
            {USER_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.userType && <p className="text-sm text-red-500">{errors.userType}</p>}
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="fullName" className="required">Nombre Completo</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          placeholder="Juan García López"
          className={errors.fullName ? 'border-red-500' : ''}
        />
        {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="required">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="usuario@ejemplo.com"
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
      </div>

      {/* DNI */}
      <div className="space-y-2">
        <Label htmlFor="dni" className="required">DNI/NIE</Label>
        <Input
          id="dni"
          value={formData.dni}
          onChange={(e) => handleChange('dni', e.target.value)}
          placeholder="12345678A"
          className={errors.dni ? 'border-red-500' : ''}
        />
        {errors.dni && <p className="text-sm text-red-500">{errors.dni}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+34 600 000 000"
          />
        </div>

        {/* Birth Date */}
        <div className="space-y-2">
          <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
          <Input
            id="birth_date"
            type="date"
            value={formData.birthDate}
            onChange={(e) => handleChange('birthDate', e.target.value)}
          />
        </div>
      </div>

      {/* Nationality */}
      <div className="space-y-2">
        <Label htmlFor="nationality">Nacionalidad</Label>
        <Input
          id="nationality"
          value={formData.nationality}
          onChange={(e) => handleChange('nationality', e.target.value)}
          placeholder="Española"
        />
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="Calle, número, piso"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Autonomous Community */}
        <div className="space-y-2">
          <Label htmlFor="autonomous_community">Comunidad Autónoma</Label>
          <Select value={formData.autonomousCommunity} onValueChange={(value) => handleChange('autonomousCommunity', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMUNIDADES.map(com => (
                <SelectItem key={com} value={com}>{com}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Postal Code */}
        <div className="space-y-2">
          <Label htmlFor="postal_code">Código Postal</Label>
          <Input
            id="postal_code"
            value={formData.postalCode}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            placeholder="28001"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Province */}
        <div className="space-y-2">
          <Label htmlFor="province">Provincia</Label>
          <Input
            id="province"
            value={formData.province}
            onChange={(e) => handleChange('province', e.target.value)}
            placeholder="Madrid"
          />
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="Madrid"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* ORIENTADOR, CLINICA, EXAMINADOR: Multiple Centers */}
      {['ORIENTADOR', 'CLINICA', 'EXAMINADOR'].includes(formData.userType) && (
        <div className="space-y-2">
          <Label className="required">Centros con Acceso</Label>
          <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
            {centers.map(center => (
              <div key={center.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`center-${center.id}`}
                  checked={formData.centerIds.includes(center.id)}
                  onCheckedChange={() => toggleArrayValue('centerIds', center.id)}
                />
                <Label htmlFor={`center-${center.id}`} className="cursor-pointer">
                  {center.name}
                </Label>
              </div>
            ))}
          </div>
          {errors.centerIds && <p className="text-sm text-red-500">{errors.centerIds}</p>}
        </div>
      )}

      {/* CLINICA: Specialty */}
      {formData.userType === 'CLINICA' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="specialty" className="required">Especialidad</Label>
            <Select value={formData.specialty} onValueChange={(value) => handleChange('specialty', value)}>
              <SelectTrigger className={errors.specialty ? 'border-red-500' : ''}>
                <SelectValue placeholder="Seleccione especialidad" />
              </SelectTrigger>
              <SelectContent>
                {SPECIALTIES.map(spec => (
                  <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.specialty && <p className="text-sm text-red-500">{errors.specialty}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="license_number">Número de Colegiado (Opcional)</Label>
            <Input
              id="license_number"
              value={formData.licenseNumber}
              onChange={(e) => handleChange('licenseNumber', e.target.value)}
              placeholder="123456"
            />
          </div>
        </>
      )}

      {/* ORIENTADOR, EXAMINADOR: Access Filters */}
      {['ORIENTADOR', 'EXAMINADOR'].includes(formData.userType) && (
        <div className="space-y-4 border-t pt-4">
          <h4 className="font-semibold text-sm text-slate-700">Filtros de Acceso (Opcional)</h4>
          <p className="text-xs text-slate-500">Si se dejan vacíos, tendrá acceso a todas las etapas/cursos/grupos</p>

          {/* Etapas */}
          <div className="space-y-2">
            <Label>Etapas Educativas</Label>
            <div className="border rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
              {ETAPAS.map(etapa => (
                <div key={etapa} className="flex items-center space-x-2">
                  <Checkbox
                    id={`etapa-${etapa}`}
                    checked={formData.allowedEtapas.includes(etapa)}
                    onCheckedChange={() => toggleArrayValue('allowedEtapas', etapa)}
                  />
                  <Label htmlFor={`etapa-${etapa}`} className="cursor-pointer text-sm">
                    {etapa}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Cursos */}
          <div className="space-y-2">
            <Label>Cursos</Label>
            <div className="border rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
              {CURSOS.map(curso => (
                <div key={curso} className="flex items-center space-x-2">
                  <Checkbox
                    id={`curso-${curso}`}
                    checked={formData.allowedCourses.includes(curso)}
                    onCheckedChange={() => toggleArrayValue('allowedCourses', curso)}
                  />
                  <Label htmlFor={`curso-${curso}`} className="cursor-pointer text-sm">
                    {curso}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Grupos */}
          <div className="space-y-2">
            <Label>Grupos/Clases</Label>
            <div className="border rounded-lg p-3 flex flex-wrap gap-2">
              {GRUPOS.map(grupo => (
                <div key={grupo} className="flex items-center space-x-2">
                  <Checkbox
                    id={`grupo-${grupo}`}
                    checked={formData.allowedGroups.includes(grupo)}
                    onCheckedChange={() => toggleArrayValue('allowedGroups', grupo)}
                  />
                  <Label htmlFor={`grupo-${grupo}`} className="cursor-pointer text-sm">
                    {grupo}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FAMILIA: Payment Method */}
      {formData.userType === 'FAMILIA' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment_method" className="required">Método de Pago</Label>
            <Select value={formData.paymentMethod} onValueChange={(value) => handleChange('paymentMethod', value)}>
              <SelectTrigger className={errors.payment_method ? 'border-red-500' : ''}>
                <SelectValue placeholder="Seleccione método de pago" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(method => (
                  <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.payment_method && <p className="text-sm text-red-500">{errors.payment_method}</p>}
          </div>

          {/* Bank details for transfer/giro */}
          {['transferencia_bancaria', 'giro_bancario'].includes(formData.paymentMethod) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="bankIban" className="required">IBAN</Label>
                <Input
                  id="bankIban"
                  value={formData.bankIban}
                  onChange={(e) => handleChange('bankIban', e.target.value)}
                  placeholder="ES00 0000 0000 0000 0000 0000"
                  className={errors.bankIban ? 'border-red-500' : ''}
                />
                {errors.bankIban && <p className="text-sm text-red-500">{errors.bankIban}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankName" className="required">Banco</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => handleChange('bankName', e.target.value)}
                  placeholder="Nombre del banco"
                  className={errors.bankName ? 'border-red-500' : ''}
                />
                {errors.bankName && <p className="text-sm text-red-500">{errors.bankName}</p>}
              </div>

              {formData.paymentMethod === 'transferencia_bancaria' && (
                <div className="space-y-2">
                  <Label htmlFor="bank_ccc_document">Documento CCC (Opcional)</Label>
                  <Input
                    id="bank_ccc_document"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      // Handle file upload
                      toast.info('Subida de archivo en desarrollo');
                    }}
                  />
                </div>
              )}

              {formData.paymentMethod === 'giro_bancario' && (
                <div className="space-y-2">
                  <Label htmlFor="sepa_mandate">Mandato SEPA (Opcional)</Label>
                  <Input
                    id="sepa_mandate"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      // Handle file upload
                      toast.info('Subida de archivo en desarrollo');
                    }}
                  />
                </div>
              )}
            </>
          )}

          {formData.paymentMethod === 'stripe' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                Se creará automáticamente un cliente en Stripe cuando se guarde el usuario.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      {/* Summary */}
      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3">Resumen</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Tipo de usuario:</span>
            <span className="font-medium">
              {USER_TYPES.find(t => t.value === formData.userType)?.label}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Nombre:</span>
            <span className="font-medium">{formData.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Email:</span>
            <span className="font-medium">{formData.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Estado:</span>
            <span className="font-medium text-green-600">
              Activo
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Complete los datos del nuevo usuario. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        {/* Steps Indicator */}
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step >= s
                  ? "bg-emooti-blue-600 text-white"
                  : "bg-slate-200 text-slate-600"
              )}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div className={cn(
                  "w-24 h-1 mx-2",
                  step > s ? "bg-emooti-blue-600" : "bg-slate-200"
                )} />
              )}
            </div>
          ))}
        </div>

        <div className="text-center mb-4">
          <p className="text-sm font-medium text-slate-700">
            {step === 1 && 'Datos Básicos'}
            {step === 2 && 'Configuración de Rol'}
            {step === 3 && 'Contraseña y Finalización'}
          </p>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Buttons */}
        <DialogFooter className="flex justify-between sm:justify-between mt-4">
          <div>
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handleBack}>
                Atrás
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            {step < 3 ? (
              <Button type="button" onClick={handleNext}>
                Siguiente
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creando...' : 'Crear Usuario'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
