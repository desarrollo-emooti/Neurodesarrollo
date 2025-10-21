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
import { Skeleton } from '@/components/ui/skeleton';

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

export default function DeviceEditForm({ open, onClose, onSuccess, device }) {
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [centers, setCenters] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm();

  useEffect(() => {
    if (device && open) {
      loadDeviceData();
      loadCenters();
      loadInventoryItems();
    }
  }, [device, open]);

  const loadCenters = async () => {
    try {
      const response = await apiClient.centers.getAll();
      setCenters(response.data.data || []);
    } catch (error) {
      console.error('Error loading centers:', error);
    }
  };

  const loadInventoryItems = async () => {
    try {
      const response = await apiClient.inventory.getAll();
      setInventoryItems(response.data.data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const loadDeviceData = async () => {
    try {
      setLoadingData(true);

      if (device.name) {
        // Use device data directly if available
        reset({
          name: device.name || '',
          type: device.type || 'IPAD',
          serial: device.serial || '',
          model: device.model || '',
          centerId: device.centerId || '',
          location: device.location || '',
          status: device.status || 'ACTIVO',
          usageStatus: device.usageStatus || 'LIBRE',
          inventoryItemId: device.inventoryItemId || '',
        });
      } else {
        // Otherwise fetch full details
        const response = await apiClient.devices.getById(device.id);
        const fullDevice = response.data.data;

        reset({
          name: fullDevice.name || '',
          type: fullDevice.type || 'IPAD',
          serial: fullDevice.serial || '',
          model: fullDevice.model || '',
          centerId: fullDevice.centerId || '',
          location: fullDevice.location || '',
          status: fullDevice.status || 'ACTIVO',
          usageStatus: fullDevice.usageStatus || 'LIBRE',
          inventoryItemId: fullDevice.inventoryItemId || '',
        });
      }
    } catch (error) {
      console.error('Error loading device:', error);
      toast.error('Error al cargar datos del dispositivo');
    } finally {
      setLoadingData(false);
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

      await apiClient.devices.update(device.id, deviceData);

      toast.success('Dispositivo actualizado correctamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating device:', error);
      toast.error(error.response?.data?.error?.message || 'Error al actualizar dispositivo');
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

  if (loadingData) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl">
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emooti-blue-600" />
            Editar Dispositivo
          </DialogTitle>
          <DialogDescription>
            Modifique la información del dispositivo
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
                  disabled
                  {...register('serial', {
                    required: 'El número de serie es requerido',
                  })}
                />
                <p className="text-xs text-slate-500">El número de serie no se puede modificar</p>
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
                    {inventoryItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} ({item.code})
                      </SelectItem>
                    ))}
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
