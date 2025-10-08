import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Shield,
  Settings,
  CreditCard,
  FileText,
  Eye,
  EyeOff,
  Save,
  X,
  AlertTriangle,
  Users as UsersIcon,
} from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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

const RELATIONSHIP_TYPES = [
  { value: 'padre', label: 'Padre' },
  { value: 'madre', label: 'Madre' },
  { value: 'tutor_legal', label: 'Tutor Legal' },
  { value: 'abuelo', label: 'Abuelo' },
  { value: 'abuela', label: 'Abuela' },
  { value: 'hermano', label: 'Hermano' },
  { value: 'hermana', label: 'Hermana' },
  { value: 'otro', label: 'Otro' },
];

export default function UserEditForm({ user, onSave, onCancel }) {
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(false);
  const [centers, setCenters] = useState([]);
  const [inventoryTests, setInventoryTests] = useState([]);
  const [relatedStudents, setRelatedStudents] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Determine if user is a base44 user (protected fields)
  const isBase44User = user?.status === 'active' || user?.status === 'invitation_sent';
  const isPreRegistered = user?.status === 'pending_invitation';

  useEffect(() => {
    if (user) {
      // Convert camelCase from backend to snake_case for form
      const snakeCaseUser = {
        ...user,
        user_type: user.userType || user.user_type,
        full_name: user.fullName || user.full_name,
        birth_date: user.birthDate || user.birth_date,
        autonomous_community: user.autonomousCommunity || user.autonomous_community,
        postal_code: user.postalCode || user.postal_code,
        center_id: user.centerId || user.center_id,
        center_ids: user.centerIds || user.center_ids,
        license_number: user.licenseNumber || user.license_number,
        allowed_etapas: user.allowedEtapas || user.allowed_etapas,
        allowed_courses: user.allowedCourses || user.allowed_courses,
        allowed_groups: user.allowedGroups || user.allowed_groups,
        allowed_tests: user.allowedTests || user.allowed_tests,
        payment_method: user.paymentMethod || user.payment_method,
        bank_iban: user.bankIban || user.bank_iban,
        bank_name: user.bankName || user.bank_name,
      };

      setFormData(snakeCaseUser);
      setOriginalData(snakeCaseUser);
      loadCenters();
      loadInventoryTests();
      if (snakeCaseUser.user_type === 'FAMILIA') {
        loadRelatedStudents(user.id);
      }
    }
  }, [user]);

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
      // If inventory endpoint fails, just use empty array
      // Inventory tests are optional for user configuration
      setInventoryTests([]);
    }
  };

  const loadRelatedStudents = async (userId) => {
    try {
      const response = await apiClient.students.getByFamily(userId);
      setRelatedStudents(response.data.data || []);
    } catch (error) {
      // If students endpoint fails, just use empty array
      setRelatedStudents([]);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const toggleArrayValue = (field, value) => {
    const currentArray = formData[field] || [];
    setFormData(prev => ({
      ...prev,
      [field]: currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value]
    }));
  };

  const handleSave = async () => {
    // Validate
    const newErrors = {};

    // Check protected fields for base44 users
    if (isBase44User) {
      const protectedFields = ['full_name', 'email'];
      const hasProtectedChanges = protectedFields.some(field =>
        formData[field] && formData[field] !== originalData[field]
      );

      if (hasProtectedChanges) {
        toast.warning('Nombre y email están protegidos para usuarios invitados');
        // Remove protected fields from update
        protectedFields.forEach(field => {
          if (formData[field] !== originalData[field]) {
            formData[field] = originalData[field];
          }
        });
      }
    }

    // Role-specific validations
    if (formData.user_type === 'ORIENTADOR' && !formData.center_id) {
      newErrors.center_id = 'Centro obligatorio';
    }

    if (['CLINICA', 'EXAMINADOR'].includes(formData.user_type) && (!formData.center_ids || formData.center_ids.length === 0)) {
      newErrors.center_ids = 'Seleccione al menos un centro';
    }

    if (formData.user_type === 'CLINICA' && !formData.specialty) {
      newErrors.specialty = 'Especialidad obligatoria';
    }

    if (formData.user_type === 'EXAMINADOR' && (!formData.allowed_tests || formData.allowed_tests.length === 0)) {
      newErrors.allowed_tests = 'Seleccione al menos una prueba';
    }

    // Password validation
    if (formData.new_password) {
      if (formData.new_password.length < 6) {
        newErrors.new_password = 'Mínimo 6 caracteres';
      }
      if (formData.new_password !== formData.confirm_new_password) {
        newErrors.confirm_new_password = 'Las contraseñas no coinciden';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Build camelCase data object directly from formData
      const camelCaseData = {};

      // Only include fields that have actually been modified
      if (formData.user_type !== undefined) camelCaseData.userType = formData.user_type;
      if (formData.full_name !== undefined) camelCaseData.fullName = formData.full_name;
      if (formData.email !== undefined) camelCaseData.email = formData.email;
      if (formData.dni !== undefined) camelCaseData.dni = formData.dni;
      if (formData.phone !== undefined) camelCaseData.phone = formData.phone;
      if (formData.birth_date !== undefined) camelCaseData.birthDate = formData.birth_date;
      if (formData.nationality !== undefined) camelCaseData.nationality = formData.nationality;
      if (formData.address !== undefined) camelCaseData.address = formData.address;
      if (formData.country !== undefined) camelCaseData.country = formData.country;
      if (formData.autonomous_community !== undefined) camelCaseData.autonomousCommunity = formData.autonomous_community;
      if (formData.province !== undefined) camelCaseData.province = formData.province;
      if (formData.city !== undefined) camelCaseData.city = formData.city;
      if (formData.postal_code !== undefined) camelCaseData.postalCode = formData.postal_code;
      if (formData.center_id !== undefined) camelCaseData.centerId = formData.center_id;
      if (formData.center_ids !== undefined) camelCaseData.centerIds = formData.center_ids;
      if (formData.specialty !== undefined) camelCaseData.specialty = formData.specialty;
      if (formData.license_number !== undefined) camelCaseData.licenseNumber = formData.license_number;
      if (formData.allowed_etapas !== undefined) camelCaseData.allowedEtapas = formData.allowed_etapas;
      if (formData.allowed_courses !== undefined) camelCaseData.allowedCourses = formData.allowed_courses;
      if (formData.allowed_groups !== undefined) camelCaseData.allowedGroups = formData.allowed_groups;
      if (formData.allowed_tests !== undefined) camelCaseData.allowedTests = formData.allowed_tests;
      if (formData.payment_method !== undefined) camelCaseData.paymentMethod = formData.payment_method;
      if (formData.bank_iban !== undefined) camelCaseData.bankIban = formData.bank_iban;
      if (formData.bank_name !== undefined) camelCaseData.bankName = formData.bank_name;
      if (formData.status !== undefined) camelCaseData.status = formData.status;
      if (formData.active !== undefined) camelCaseData.active = formData.active;

      // Handle password change if provided
      if (formData.new_password) {
        // For pre-registered users, setting password activates them
        if (isPreRegistered) {
          camelCaseData.status = 'ACTIVE';
        }
        // Note: Password is intentionally NOT sent - backend handles it separately
      }

      // Remove empty string values - convert to null
      Object.keys(camelCaseData).forEach(key => {
        if (camelCaseData[key] === '') {
          camelCaseData[key] = null;
        }
      });

      if (Object.keys(camelCaseData).length === 0) {
        toast.info('No hay cambios para guardar');
        return;
      }

      console.log('Sending update data:', JSON.stringify(camelCaseData, null, 2));
      const response = await apiClient.users.update(user.id, camelCaseData);
      console.log('Update successful:', response.data);
      toast.success('Usuario actualizado correctamente');
      onSave?.();
    } catch (error) {
      console.error('Error updating user:', error);

      if (error.response?.data?.message?.includes('full_name')) {
        toast.error('El nombre no se puede modificar para usuarios invitados');
      } else if (error.response?.data?.message?.includes('email')) {
        toast.error('El email no se puede modificar');
      } else if (error.response?.data?.message?.includes('permission')) {
        toast.error('No tienes permisos para modificar este usuario');
      } else {
        toast.error(error.response?.data?.message || 'Error al actualizar usuario');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      {/* Warning for base44 users */}
      {isBase44User && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Usuario invitado por base44</p>
              <p className="text-sm text-amber-700 mt-1">
                El nombre y email están protegidos y solo pueden ser modificados por el usuario desde su perfil personal.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 1. Identificación del Usuario */}
      <Card className="p-6 border-l-4 border-l-blue-500">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2 text-blue-600" />
          Identificación del Usuario
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>ID Usuario</Label>
            <Input value={formData.user_id || 'N/A'} disabled className="bg-slate-50" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_type">Tipo de Usuario</Label>
            <Select value={formData.user_type || ''} onValueChange={(value) => handleChange('user_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione tipo" />
              </SelectTrigger>
              <SelectContent>
                {USER_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre Completo</Label>
            <Input
              id="full_name"
              value={formData.full_name || ''}
              onChange={(e) => handleChange('full_name', e.target.value)}
              disabled={isBase44User}
              className={isBase44User ? 'bg-slate-50' : ''}
            />
            {isBase44User && (
              <p className="text-xs text-amber-600">Campo protegido</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={isBase44User}
              className={isBase44User ? 'bg-slate-50' : ''}
            />
            {isBase44User && (
              <p className="text-xs text-amber-600">Campo protegido</p>
            )}
          </div>
        </div>
      </Card>

      {/* 2. Información Personal */}
      <Card className="p-6 border-l-4 border-l-green-500">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <Phone className="w-5 h-5 mr-2 text-green-600" />
          Información Personal
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <div className="flex space-x-2">
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+34 600 000 000"
              />
              {formData.phone && (
                <Button variant="outline" size="sm" onClick={() => window.open(`tel:${formData.phone}`)}>
                  <Phone className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dni">DNI/NIE</Label>
            <Input
              id="dni"
              value={formData.dni || ''}
              onChange={(e) => handleChange('dni', e.target.value)}
              placeholder="12345678A"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date || ''}
              onChange={(e) => handleChange('birth_date', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationality">Nacionalidad</Label>
            <Input
              id="nationality"
              value={formData.nationality || ''}
              onChange={(e) => handleChange('nationality', e.target.value)}
              placeholder="Española"
            />
          </div>
        </div>
      </Card>

      {/* 3. Dirección */}
      <Card className="p-6 border-l-4 border-l-cyan-500">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-cyan-600" />
          Dirección
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Dirección Completa</Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Calle, número, piso"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                value={formData.country || 'España'}
                onChange={(e) => handleChange('country', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="autonomous_community">Comunidad Autónoma</Label>
              <Select value={formData.autonomous_community || ''} onValueChange={(value) => handleChange('autonomous_community', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {COMUNIDADES.map(com => (
                    <SelectItem key={com} value={com}>{com}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">Provincia</Label>
              <Input
                id="province"
                value={formData.province || ''}
                onChange={(e) => handleChange('province', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Código Postal</Label>
              <Input
                id="postal_code"
                value={formData.postal_code || ''}
                onChange={(e) => handleChange('postal_code', e.target.value)}
                placeholder="28001"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Configuración Profesional (Orientador/Clínica/Examinador) */}
      {['ORIENTADOR', 'CLINICA', 'EXAMINADOR'].includes(formData.user_type) && (
        <Card className="p-6 border-l-4 border-l-pink-500">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-pink-600" />
            Configuración Profesional
          </h3>

          {formData.user_type === 'ORIENTADOR' && (
            <div className="space-y-2">
              <Label htmlFor="center_id" className="required">Centro Educativo</Label>
              <Select value={formData.center_id || ''} onValueChange={(value) => handleChange('center_id', value)}>
                <SelectTrigger className={errors.center_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Seleccione centro" />
                </SelectTrigger>
                <SelectContent>
                  {centers.map(center => (
                    <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.center_id && <p className="text-sm text-red-500">{errors.center_id}</p>}
            </div>
          )}

          {['CLINICA', 'EXAMINADOR'].includes(formData.user_type) && (
            <div className="space-y-2">
              <Label className="required">Centros Educativos con Acceso</Label>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                {centers.map(center => (
                  <div key={center.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`center-${center.id}`}
                      checked={formData.center_ids?.includes(center.id)}
                      onCheckedChange={() => toggleArrayValue('center_ids', center.id)}
                    />
                    <Label htmlFor={`center-${center.id}`} className="cursor-pointer">
                      {center.name}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.center_ids && <p className="text-sm text-red-500">{errors.center_ids}</p>}
            </div>
          )}

          {formData.user_type === 'CLINICA' && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="specialty" className="required">Especialidad</Label>
                <Select value={formData.specialty || ''} onValueChange={(value) => handleChange('specialty', value)}>
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
                <Label htmlFor="license_number">Número de Colegiado</Label>
                <Input
                  id="license_number"
                  value={formData.license_number || ''}
                  onChange={(e) => handleChange('license_number', e.target.value)}
                  placeholder="123456"
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 5. Filtros de Acceso a Datos (Orientador/Examinador) */}
      {['ORIENTADOR', 'EXAMINADOR'].includes(formData.user_type) && (
        <Card className="p-6 border-l-4 border-l-purple-500">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-purple-600" />
            Filtros de Acceso a Datos
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Si se dejan vacíos, tendrá acceso a todas las etapas/cursos/grupos de sus centros asignados
          </p>

          <div className="space-y-4">
            {/* Etapas */}
            <div className="space-y-2">
              <Label>Etapas Educativas</Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
                {ETAPAS.map(etapa => (
                  <div key={etapa} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-etapa-${etapa}`}
                      checked={formData.allowed_etapas?.includes(etapa)}
                      onCheckedChange={() => toggleArrayValue('allowed_etapas', etapa)}
                    />
                    <Label htmlFor={`edit-etapa-${etapa}`} className="cursor-pointer text-sm">
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
                      id={`edit-curso-${curso}`}
                      checked={formData.allowed_courses?.includes(curso)}
                      onCheckedChange={() => toggleArrayValue('allowed_courses', curso)}
                    />
                    <Label htmlFor={`edit-curso-${curso}`} className="cursor-pointer text-sm">
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
                      id={`edit-grupo-${grupo}`}
                      checked={formData.allowed_groups?.includes(grupo)}
                      onCheckedChange={() => toggleArrayValue('allowed_groups', grupo)}
                    />
                    <Label htmlFor={`edit-grupo-${grupo}`} className="cursor-pointer text-sm">
                      {grupo}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 6. Pruebas que puede realizar (Examinador) */}
      {formData.user_type === 'EXAMINADOR' && (
        <Card className="p-6 border-l-4 border-l-indigo-500">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-indigo-600" />
            Pruebas que puede realizar
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Seleccione las pruebas que este examinador puede asignar y realizar
          </p>

          <div className="space-y-4">
            {/* EMOOTI Tests */}
            <div className="border rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-slate-700">Pruebas EMOOTI</p>
              {EMOOTI_TESTS.map(test => (
                <div key={test.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-test-${test.id}`}
                    checked={formData.allowed_tests?.includes(test.id)}
                    onCheckedChange={() => toggleArrayValue('allowed_tests', test.id)}
                  />
                  <Label htmlFor={`edit-test-${test.id}`} className="cursor-pointer text-sm">
                    {test.name}
                  </Label>
                </div>
              ))}
            </div>

            {/* Inventory Tests */}
            {inventoryTests.length > 0 && (
              <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                <p className="text-sm font-medium text-slate-700">Pruebas de Inventario</p>
                {inventoryTests.map(test => (
                  <div key={test.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-inv-test-${test.id}`}
                      checked={formData.allowed_tests?.includes(test.id)}
                      onCheckedChange={() => toggleArrayValue('allowed_tests', test.id)}
                    />
                    <Label htmlFor={`edit-inv-test-${test.id}`} className="cursor-pointer text-sm">
                      {test.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
            {errors.allowed_tests && <p className="text-sm text-red-500">{errors.allowed_tests}</p>}
          </div>
        </Card>
      )}

      {/* 7. Gestión Económica (Familia) */}
      {formData.user_type === 'FAMILIA' && (
        <Card className="p-6 border-l-4 border-l-purple-500">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-purple-600" />
            Gestión Económica
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment_method">Método de Pago</Label>
              <Select value={formData.payment_method || ''} onValueChange={(value) => handleChange('payment_method', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione método de pago" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(method => (
                    <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {['transferencia_bancaria', 'giro_bancario'].includes(formData.payment_method) && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_iban">IBAN</Label>
                  <Input
                    id="bank_iban"
                    value={formData.bank_iban || ''}
                    onChange={(e) => handleChange('bank_iban', e.target.value)}
                    placeholder="ES00 0000 0000 0000 0000 0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_name">Banco</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name || ''}
                    onChange={(e) => handleChange('bank_name', e.target.value)}
                    placeholder="Nombre del banco"
                  />
                </div>
              </div>
            )}

            {formData.payment_method === 'stripe' && formData.stripe_customer_id && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  Cliente Stripe ID: <span className="font-mono">{formData.stripe_customer_id}</span>
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 8. Alumnos Relacionados (Familia) */}
      {formData.user_type === 'FAMILIA' && (
        <Card className="p-6 border-l-4 border-l-teal-500">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <UsersIcon className="w-5 h-5 mr-2 text-teal-600" />
            Alumnos Relacionados
          </h3>

          {relatedStudents.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              No hay alumnos relacionados con este familiar
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-2">Alumno</th>
                    <th className="text-left p-2">Centro</th>
                    <th className="text-left p-2">Etapa</th>
                    <th className="text-left p-2">Curso</th>
                    <th className="text-left p-2">Grupo</th>
                    <th className="text-left p-2">Relación</th>
                    <th className="text-left p-2">Contactos</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedStudents.map(student => (
                    <tr key={student.id} className="border-b hover:bg-slate-50">
                      <td className="p-2">{student.full_name}</td>
                      <td className="p-2">{student.center_name || 'N/A'}</td>
                      <td className="p-2">{student.etapa || 'N/A'}</td>
                      <td className="p-2">{student.course || 'N/A'}</td>
                      <td className="p-2">{student.class_group || 'N/A'}</td>
                      <td className="p-2">
                        <Badge variant="outline">
                          {student.relationship_type || 'N/A'}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex space-x-1">
                          {student.is_primary_contact && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">Principal</Badge>
                          )}
                          {student.emergency_contact && (
                            <Badge className="bg-red-100 text-red-800 text-xs">Emergencia</Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* 9. Observaciones */}
      <Card className="p-6 border-l-4 border-l-amber-500">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-amber-600" />
          Observaciones
        </h3>
        <Textarea
          value={formData.observations || ''}
          onChange={(e) => handleChange('observations', e.target.value)}
          placeholder="Notas adicionales sobre el usuario..."
          rows={4}
        />
      </Card>

      {/* 10. Establecer Nueva Contraseña */}
      <Card className="p-6 border-l-4 border-l-red-500">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-red-600" />
          Establecer Nueva Contraseña
        </h3>

        {isPreRegistered && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <p className="text-sm text-blue-900">
              Al establecer una contraseña, este usuario pasará de estado "Pendiente" a "Activo"
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="new_password">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showPassword ? 'text' : 'password'}
                value={formData.new_password || ''}
                onChange={(e) => handleChange('new_password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={errors.new_password ? 'border-red-500' : ''}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.new_password && <p className="text-sm text-red-500">{errors.new_password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_new_password">Confirmar Contraseña</Label>
            <div className="relative">
              <Input
                id="confirm_new_password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirm_new_password || ''}
                onChange={(e) => handleChange('confirm_new_password', e.target.value)}
                placeholder="Repita la contraseña"
                className={errors.confirm_new_password ? 'border-red-500' : ''}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirm_new_password && <p className="text-sm text-red-500">{errors.confirm_new_password}</p>}
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 sticky bottom-0 bg-white p-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </div>
  );
}
