import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { X, Building2, MapPin, Phone, Mail, User, Hash } from 'lucide-react';

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

// Spanish provinces and autonomous communities
const AUTONOMOUS_COMMUNITIES = [
  'Andalucía', 'Aragón', 'Asturias', 'Islas Baleares', 'Canarias',
  'Cantabria', 'Castilla y León', 'Castilla-La Mancha', 'Cataluña',
  'Comunidad Valenciana', 'Extremadura', 'Galicia', 'Madrid',
  'Murcia', 'Navarra', 'País Vasco', 'La Rioja', 'Ceuta', 'Melilla'
];

const PROVINCES_BY_COMMUNITY = {
  'Madrid': ['Madrid'],
  'Cataluña': ['Barcelona', 'Girona', 'Lleida', 'Tarragona'],
  'Andalucía': ['Almería', 'Cádiz', 'Córdoba', 'Granada', 'Huelva', 'Jaén', 'Málaga', 'Sevilla'],
  'Comunidad Valenciana': ['Alicante', 'Castellón', 'Valencia'],
  // Add more as needed
};

export default function CreateCenterModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    defaultValues: {
      code: '',
      name: '',
      type: 'PUBLICO',
      phone: '',
      email: '',
      responsable: '',
      totalStudents: 0,
      address: '',
      country: 'España',
      autonomousCommunity: '',
      province: '',
      city: '',
      postalCode: '',
      observations: '',
    },
  });

  const watchedCommunity = watch('autonomousCommunity');

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Convert totalStudents to integer
      const centerData = {
        ...data,
        totalStudents: parseInt(data.totalStudents) || 0,
      };

      await apiClient.centers.create(centerData);

      toast.success('Centro creado correctamente');
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating center:', error);
      toast.error(error.response?.data?.error?.message || 'Error al crear centro');
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

  const availableProvinces = watchedCommunity
    ? PROVINCES_BY_COMMUNITY[watchedCommunity] || []
    : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emooti-blue-600" />
            Crear Nuevo Centro
          </DialogTitle>
          <DialogDescription>
            Complete la información del centro educativo
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
                <Label htmlFor="code" className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Código del Centro *
                </Label>
                <Input
                  id="code"
                  placeholder="CEN001"
                  {...register('code', {
                    required: 'El código es requerido',
                    pattern: {
                      value: /^[A-Z0-9_-]+$/,
                      message: 'Solo mayúsculas, números, guiones y guiones bajos',
                    },
                  })}
                />
                {errors.code && (
                  <p className="text-sm text-red-600">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Centro *</Label>
                <Select
                  onValueChange={(value) => setValue('type', value)}
                  defaultValue="PUBLICO"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLICO">Público</SelectItem>
                    <SelectItem value="CONCERTADO">Concertado</SelectItem>
                    <SelectItem value="PRIVADO">Privado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Nombre del Centro *
              </Label>
              <Input
                id="name"
                placeholder="Nombre completo del centro"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="responsable" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Responsable
                </Label>
                <Input
                  id="responsable"
                  placeholder="Nombre del director/responsable"
                  {...register('responsable')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalStudents">Número de Estudiantes</Label>
                <Input
                  id="totalStudents"
                  type="number"
                  placeholder="0"
                  {...register('totalStudents')}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
              Información de Contacto
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  placeholder="+34 900 000 000"
                  {...register('phone')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@centro.com"
                  {...register('email', {
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Email inválido',
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Dirección
            </h3>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección Completa *</Label>
              <Input
                id="address"
                placeholder="Calle, número, etc."
                {...register('address', {
                  required: 'La dirección es requerida',
                })}
              />
              {errors.address && (
                <p className="text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="autonomousCommunity">Comunidad Autónoma *</Label>
                <Select
                  onValueChange={(value) => {
                    setValue('autonomousCommunity', value);
                    setValue('province', ''); // Reset province when community changes
                    setSelectedCommunity(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTONOMOUS_COMMUNITIES.map((community) => (
                      <SelectItem key={community} value={community}>
                        {community}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">Provincia *</Label>
                <Select
                  onValueChange={(value) => setValue('province', value)}
                  disabled={!watchedCommunity || availableProvinces.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProvinces.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ciudad *</Label>
                <Input
                  id="city"
                  placeholder="Madrid"
                  {...register('city', {
                    required: 'La ciudad es requerida',
                  })}
                />
                {errors.city && (
                  <p className="text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Código Postal *</Label>
                <Input
                  id="postalCode"
                  placeholder="28001"
                  {...register('postalCode', {
                    required: 'El código postal es requerido',
                    pattern: {
                      value: /^[0-9]{5}$/,
                      message: 'Debe ser un código postal de 5 dígitos',
                    },
                  })}
                />
                {errors.postalCode && (
                  <p className="text-sm text-red-600">{errors.postalCode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  placeholder="España"
                  {...register('country')}
                />
              </div>
            </div>
          </div>

          {/* Observations */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
              Observaciones
            </h3>

            <div className="space-y-2">
              <Label htmlFor="observations">Notas adicionales</Label>
              <Textarea
                id="observations"
                placeholder="Información adicional sobre el centro..."
                rows={3}
                {...register('observations')}
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
              disabled={loading}
              className="emooti-gradient text-white"
            >
              {loading ? 'Creando...' : 'Crear Centro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
