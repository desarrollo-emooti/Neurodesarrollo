import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import {
  User,
  Lock,
  Activity,
  BarChart3,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  Calendar,
} from 'lucide-react';

// Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

// API & Store
import { apiClient } from '@/lib/api';
import useAuthStore from '@/store/authStore';

// Charts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Constants
const USER_TYPES = {
  ADMINISTRADOR: { label: 'Administrador', color: 'bg-red-100 text-red-800' },
  CLINICA: { label: 'Clínica', color: 'bg-blue-100 text-blue-800' },
  ORIENTADOR: { label: 'Orientador', color: 'bg-green-100 text-green-800' },
  EXAMINADOR: { label: 'Examinador', color: 'bg-purple-100 text-purple-800' },
  FAMILIA: { label: 'Familia', color: 'bg-yellow-100 text-yellow-800' },
};

const USER_STATUS = {
  ACTIVE: { label: 'Activo', color: 'bg-green-100 text-green-800' },
  PENDING_INVITATION: { label: 'Invitación Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  INACTIVE: { label: 'Inactivo', color: 'bg-slate-100 text-slate-800' },
};

const ACTION_COLORS = {
  LOGIN: 'bg-blue-100 text-blue-800',
  DATA_ACCESS: 'bg-green-100 text-green-800',
  DATA_MODIFICATION: 'bg-yellow-100 text-yellow-800',
  DATA_EXPORT: 'bg-purple-100 text-purple-800',
  DATA_DELETION: 'bg-red-100 text-red-800',
  LOGOUT: 'bg-slate-100 text-slate-800',
};

const PAYMENT_METHODS = {
  INTERNAL: 'Interno',
  STRIPE: 'Stripe',
};

export default function Profile() {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('info');

  // Profile state
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Password state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Activity state
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [activitiesTotalPages, setActivitiesTotalPages] = useState(1);
  const [activitiesFilters, setActivitiesFilters] = useState({
    startDate: '',
    endDate: '',
  });
  const [expandedActivity, setExpandedActivity] = useState(null);

  // Statistics state
  const [statistics, setStatistics] = useState(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);

  // Profile form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm();

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    watch: watchPassword,
    reset: resetPassword,
  } = useForm();

  const newPassword = watchPassword('newPassword', '');

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'info') {
      loadProfile();
    } else if (activeTab === 'activity') {
      loadActivity();
    } else if (activeTab === 'statistics') {
      loadStatistics();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'activity') {
      loadActivity();
    }
  }, [activitiesPage, activitiesFilters]);

  // Load Profile
  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.profile.get();
      const profileData = response.data.data;

      // Set all form values
      Object.entries(profileData).forEach(([key, value]) => {
        setValue(key, value || '');
      });

      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  // Save Profile
  const onSubmitProfile = async (data) => {
    try {
      setSaving(true);

      // Only send editable fields
      const updateData = {
        phone: data.phone,
        address: data.address,
        postalCode: data.postalCode,
        city: data.city,
        province: data.province,
        autonomousCommunity: data.autonomousCommunity,
        country: data.country,
      };

      // Add professional info if user is CLINICA or EXAMINADOR
      if (profile?.userType === 'CLINICA' || profile?.userType === 'EXAMINADOR') {
        updateData.specialty = data.specialty;
        updateData.licenseNumber = data.licenseNumber;
        updateData.allowedEtapas = data.allowedEtapas;
        updateData.allowedCourses = data.allowedCourses;
        updateData.allowedGroups = data.allowedGroups;
      }

      // Add payment info
      updateData.paymentMethod = data.paymentMethod;
      updateData.bankIban = data.bankIban;
      updateData.bankName = data.bankName;

      await apiClient.profile.update(updateData);
      toast.success('Perfil actualizado correctamente');
      loadProfile(); // Reload
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.error?.message || 'Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  // Change Password
  const onSubmitPassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    try {
      setChangingPassword(true);
      await apiClient.profile.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      toast.success('Contraseña cambiada correctamente');
      resetPassword();
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.error?.message || 'Error al cambiar contraseña');
    } finally {
      setChangingPassword(false);
    }
  };

  // Load Activity
  const loadActivity = async () => {
    try {
      setActivitiesLoading(true);
      const params = {
        page: activitiesPage,
        limit: 20,
        ...Object.fromEntries(
          Object.entries(activitiesFilters).filter(([_, v]) => v !== '')
        ),
      };
      const response = await apiClient.profile.getActivity(params);
      setActivities(response.data.data || []);
      setActivitiesTotalPages(response.data.meta?.totalPages || 1);
    } catch (error) {
      console.error('Error loading activity:', error);
      toast.error('Error al cargar actividad');
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Load Statistics
  const loadStatistics = async () => {
    try {
      setStatisticsLoading(true);
      const response = await apiClient.profile.getStatistics();
      setStatistics(response.data.data);
    } catch (error) {
      console.error('Error loading statistics:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setStatisticsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (password.length === 0) return null;
    if (password.length < 8) return { label: 'Débil', color: 'bg-red-500' };
    if (password.length < 12) return { label: 'Media', color: 'bg-yellow-500' };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { label: 'Media', color: 'bg-yellow-500' };
    return { label: 'Fuerte', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
    } catch {
      return dateString;
    }
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  const clearActivityFilters = () => {
    setActivitiesFilters({ startDate: '', endDate: '' });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <User className="w-8 h-8 text-emooti-blue-600" />
            Mi Perfil
          </h1>
          <p className="text-slate-600 mt-1">
            Gestiona tu información personal, contraseña y actividad
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">
            <User className="w-4 h-4 mr-2" />
            Mi Información
          </TabsTrigger>
          <TabsTrigger value="password">
            <Lock className="w-4 h-4 mr-2" />
            Cambiar Contraseña
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="w-4 h-4 mr-2" />
            Mi Actividad
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Estadísticas
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Mi Información */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6">
                  {/* Datos Personales (Read-only) */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
                      Datos Personales
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Nombre Completo</Label>
                        <Input
                          id="fullName"
                          {...register('fullName')}
                          disabled
                          className="bg-slate-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          {...register('email')}
                          disabled
                          className="bg-slate-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dni">DNI</Label>
                        <Input
                          id="dni"
                          {...register('dni')}
                          disabled
                          className="bg-slate-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                        <Input
                          id="birthDate"
                          value={profile?.birthDate ? formatDateOnly(profile.birthDate) : ''}
                          disabled
                          className="bg-slate-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nationality">Nacionalidad</Label>
                        <Input
                          id="nationality"
                          {...register('nationality')}
                          disabled
                          className="bg-slate-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="userType">Tipo de Usuario</Label>
                        <div className="mt-2">
                          {profile?.userType && (
                            <Badge className={USER_TYPES[profile.userType]?.color}>
                              {USER_TYPES[profile.userType]?.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Estado</Label>
                        <div className="mt-2">
                          {profile?.status && (
                            <Badge className={USER_STATUS[profile.status]?.color}>
                              {USER_STATUS[profile.status]?.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Datos de Contacto (Editable) */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
                      Datos de Contacto
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono *</Label>
                        <Input
                          id="phone"
                          placeholder="Ej: +34 123 456 789"
                          {...register('phone', { required: 'El teléfono es obligatorio' })}
                        />
                        {errors.phone && (
                          <p className="text-xs text-red-500">{errors.phone.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input
                          id="address"
                          placeholder="Ej: Calle Principal, 123"
                          {...register('address')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Código Postal</Label>
                        <Input
                          id="postalCode"
                          placeholder="Ej: 28001"
                          {...register('postalCode')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Ciudad</Label>
                        <Input
                          id="city"
                          placeholder="Ej: Madrid"
                          {...register('city')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="province">Provincia</Label>
                        <Input
                          id="province"
                          placeholder="Ej: Madrid"
                          {...register('province')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="autonomousCommunity">Comunidad Autónoma</Label>
                        <Input
                          id="autonomousCommunity"
                          placeholder="Ej: Comunidad de Madrid"
                          {...register('autonomousCommunity')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">País</Label>
                        <Input
                          id="country"
                          placeholder="Ej: España"
                          {...register('country')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Información Profesional (Conditional) */}
                  {(profile?.userType === 'CLINICA' || profile?.userType === 'EXAMINADOR') && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
                        Información Profesional
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="specialty">Especialidad</Label>
                          <Input
                            id="specialty"
                            placeholder="Ej: Psicología Clínica"
                            {...register('specialty')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="licenseNumber">Número de Colegiado</Label>
                          <Input
                            id="licenseNumber"
                            placeholder="Ej: 12345"
                            {...register('licenseNumber')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="allowedEtapas">Etapas Permitidas</Label>
                          <Input
                            id="allowedEtapas"
                            placeholder="Separadas por comas"
                            {...register('allowedEtapas')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="allowedCourses">Cursos Permitidos</Label>
                          <Input
                            id="allowedCourses"
                            placeholder="Separados por comas"
                            {...register('allowedCourses')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="allowedGroups">Grupos Permitidos</Label>
                          <Input
                            id="allowedGroups"
                            placeholder="Separados por comas"
                            {...register('allowedGroups')}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Datos de Pago */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
                      Datos de Pago
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Método de Pago</Label>
                        <Select
                          value={watch('paymentMethod') || ''}
                          onValueChange={(value) => setValue('paymentMethod', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar método" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INTERNAL">Interno</SelectItem>
                            <SelectItem value="STRIPE">Stripe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankIban">IBAN</Label>
                        <Input
                          id="bankIban"
                          placeholder="Ej: ES12 1234 1234 12 1234567890"
                          {...register('bankIban')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Nombre del Banco</Label>
                        <Input
                          id="bankName"
                          placeholder="Ej: Banco Santander"
                          {...register('bankName')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="emooti-gradient text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Cambiar Contraseña */}
        <TabsContent value="password" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emooti-blue-600" />
                Cambiar Contraseña
              </CardTitle>
              <CardDescription>
                Actualiza tu contraseña para mantener tu cuenta segura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
                <div className="space-y-4">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Contraseña Actual *</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="Introduce tu contraseña actual"
                        {...registerPassword('currentPassword', {
                          required: 'La contraseña actual es obligatoria',
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4 text-slate-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="text-xs text-red-500">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva Contraseña *</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Introduce tu nueva contraseña"
                        {...registerPassword('newPassword', {
                          required: 'La nueva contraseña es obligatoria',
                          minLength: {
                            value: 8,
                            message: 'La contraseña debe tener al menos 8 caracteres',
                          },
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4 text-slate-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="text-xs text-red-500">{passwordErrors.newPassword.message}</p>
                    )}

                    {/* Password Strength Indicator */}
                    {passwordStrength && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-200 rounded">
                            <div
                              className={`h-2 rounded ${passwordStrength.color} transition-all`}
                              style={{
                                width:
                                  passwordStrength.label === 'Débil'
                                    ? '33%'
                                    : passwordStrength.label === 'Media'
                                    ? '66%'
                                    : '100%',
                              }}
                            />
                          </div>
                          <span className="text-xs text-slate-600">{passwordStrength.label}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirma tu nueva contraseña"
                        {...registerPassword('confirmPassword', {
                          required: 'Debes confirmar la nueva contraseña',
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 text-slate-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-xs text-red-500">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={changingPassword}
                    className="emooti-gradient text-white"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {changingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Mi Actividad */}
        <TabsContent value="activity" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-900">Filtros</h3>
                {Object.values(activitiesFilters).some((v) => v !== '') && (
                  <Button variant="ghost" size="sm" onClick={clearActivityFilters}>
                    Limpiar filtros
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha Inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={activitiesFilters.startDate}
                    onChange={(e) =>
                      setActivitiesFilters({ ...activitiesFilters, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha Fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={activitiesFilters.endDate}
                    onChange={(e) =>
                      setActivitiesFilters({ ...activitiesFilters, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Fecha y Hora
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Acción
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Tipo de Recurso
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        ID de Recurso
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        IP
                      </th>
                      <th className="p-4 text-right text-sm font-semibold text-slate-700">
                        Detalles
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activitiesLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i}>
                          <td colSpan={6} className="p-4">
                            <Skeleton className="h-12 w-full" />
                          </td>
                        </tr>
                      ))
                    ) : activities.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No hay actividad registrada
                        </td>
                      </tr>
                    ) : (
                      activities.map((activity) => (
                        <React.Fragment key={activity.id}>
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="p-4 text-sm text-slate-900">
                              {formatDate(activity.timestamp)}
                            </td>
                            <td className="p-4">
                              <Badge className={ACTION_COLORS[activity.action] || 'bg-slate-100 text-slate-800'}>
                                {activity.action}
                              </Badge>
                            </td>
                            <td className="p-4 text-sm text-slate-900">
                              {activity.resourceType || '-'}
                            </td>
                            <td className="p-4 text-sm text-slate-900 font-mono">
                              {activity.resourceId
                                ? activity.resourceId.length > 20
                                  ? `${activity.resourceId.substring(0, 20)}...`
                                  : activity.resourceId
                                : '-'}
                            </td>
                            <td className="p-4 text-sm text-slate-900 font-mono">
                              {activity.ipAddress || '-'}
                            </td>
                            <td className="p-4 text-right">
                              {activity.details && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setExpandedActivity(
                                      expandedActivity === activity.id ? null : activity.id
                                    )
                                  }
                                >
                                  {expandedActivity === activity.id ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                            </td>
                          </motion.tr>
                          {expandedActivity === activity.id && activity.details && (
                            <tr>
                              <td colSpan={6} className="p-4 bg-slate-50">
                                <pre className="text-xs overflow-x-auto bg-white p-4 rounded border">
                                  {JSON.stringify(activity.details, null, 2)}
                                </pre>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {activitiesTotalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActivitiesPage((p) => Math.max(1, p - 1))}
                    disabled={activitiesPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-slate-600">
                    Página {activitiesPage} de {activitiesTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActivitiesPage((p) => Math.min(activitiesTotalPages, p + 1))}
                    disabled={activitiesPage === activitiesTotalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Estadísticas */}
        <TabsContent value="statistics" className="space-y-6">
          {statisticsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Total de Logins</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">
                          {statistics?.totalLogins || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Accesos a Datos</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">
                          {statistics?.totalDataAccess || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Activity className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Modificaciones</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">
                          {statistics?.totalDataModifications || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Exportaciones</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">
                          {statistics?.totalDataExports || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-emooti-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-600">Último Login</p>
                        <p className="text-lg font-semibold text-slate-900 mt-1">
                          {statistics?.lastLogin ? formatDate(statistics.lastLogin) : 'Nunca'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-emooti-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-600">Recurso Más Accedido</p>
                        <div className="mt-1">
                          {statistics?.mostAccessedResource ? (
                            <Badge className="bg-blue-100 text-blue-800">
                              {statistics.mostAccessedResource}
                            </Badge>
                          ) : (
                            <span className="text-sm text-slate-500">Sin datos</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Actividad por Día (Últimos 30 días)</CardTitle>
                  <CardDescription>
                    Visualización de tu actividad diaria en la plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {statistics?.activityByDay && statistics.activityByDay.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={statistics.activityByDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(date) => formatDateOnly(date)}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(date) => formatDate(date)}
                          formatter={(value) => [value, 'Actividades']}
                        />
                        <Legend />
                        <Bar dataKey="count" fill="#3b82f6" name="Actividades" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-500">
                      No hay datos de actividad disponibles
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
