import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Smartphone, MapPin, Settings } from 'lucide-react';

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
const DEVICE_TYPES = [
  { value: 'IPAD', label: 'iPad' },
  { value: 'TABLET', label: 'Tablet' },
  { value: 'SMARTPHONE', label: 'Smartphone' },
  { value: 'LAPTOP', label: 'Laptop' },
];

const DEVICE_STATUS = [
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'INACTIVO', label: 'Inactivo' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
];

const USAGE_STATUS = [
  { value: 'LIBRE', label: 'Libre' },
  { value: 'EN_USO', label: 'En Uso' },
  { value: 'RESERVADO', label: 'Reservado' },
];

export default function CreateDeviceModal({ open, onClose, onSuccess }) {
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [centers, setCenters] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

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
      type: 'IPAD',
      serial: '',
      model: '',
      centerId: '',
      location: '',
      status: 'ACTIVO',
      usageStatus: 'LIBRE',
      inventoryItemId: '',
    },
  });

  useEffect(() => {
    if (open) {
      loadCenters();
      loadInventoryItems();
    }
  }, [open]);

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

  const loadInventoryItems = async () => {
    try {
      setLoadingInventory(true);
      const response = await apiClient.inventory.getAll();
      setInventoryItems(response.data.data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoadingInventory(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const deviceData = { ...data };

      // Remove empty optional fields
      Object.keys(deviceData).forEach(key => {
        if (deviceData[key] === '' || deviceData[key] === null || deviceData[key] === undefined) {
          delete deviceData[key];
        }
      });

      await apiClient.devices.create(deviceData);

      toast.success('Dispositivo creado correctamente');
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating device:', error);
      toast.error(error.response?.data?.error?.message || 'Error al crear dispositivo');
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
            <Smartphone className="w-5 h-5 text-emooti-blue-600" />
            Crear Nuevo Dispositivo
          </DialogTitle>
          <DialogDescription>
            Registra un nuevo dispositivo en el sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Información Básica
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Nombre del Dispositivo *</Label>
                <Input
                  id="name"
                  placeholder="Ej: iPad Pro - Sala 3"
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
                <Label htmlFor="type">Tipo de Dispositivo *</Label>
                <Select
                  onValueChange={(value) => setValue('type', value)}
                  value={watch('type')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serial">Número de Serie *</Label>
                <Input
                  id="serial"
                  placeholder="Ej: ABC123456789"
                  {...register('serial', {
                    required: 'El número de serie es requerido',
                  })}
                />
                {errors.serial && (
                  <p className="text-sm text-red-600">{errors.serial.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  placeholder="Ej: iPad Pro 12.9"
                  {...register('model')}
                />
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

          {/* Location and Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Ubicación y Estado
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación Física</Label>
                <Input
                  id="location"
                  placeholder="Ej: Sala 3, Armario 2"
                  {...register('location')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inventoryItemId">Artículo de Inventario</Label>
                <Select
                  onValueChange={(value) => setValue('inventoryItemId', value)}
                  value={watch('inventoryItemId')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar artículo (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ninguno</SelectItem>
                    {loadingInventory ? (
                      <SelectItem value="loading" disabled>
                        Cargando inventario...
                      </SelectItem>
                    ) : (
                      inventoryItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado del Dispositivo</Label>
                <Select
                  onValueChange={(value) => setValue('status', value)}
                  value={watch('status')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="usageStatus">Estado de Uso</Label>
                <Select
                  onValueChange={(value) => setValue('usageStatus', value)}
                  value={watch('usageStatus')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado de uso" />
                  </SelectTrigger>
                  <SelectContent>
                    {USAGE_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
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
              disabled={loading || loadingCenters}
              className="emooti-gradient text-white"
            >
              {loading ? 'Creando...' : 'Crear Dispositivo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
