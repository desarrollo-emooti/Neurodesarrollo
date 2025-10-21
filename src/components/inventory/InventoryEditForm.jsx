import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Package, MapPin, Archive, Truck, Settings } from 'lucide-react';

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

// API
import { apiClient } from '@/lib/api';

// Constants
const INVENTORY_CATEGORIES = [
  { value: 'INFORMATICA', label: 'Informática' },
  { value: 'MOBILIARIO', label: 'Mobiliario' },
  { value: 'PROMOCIONAL', label: 'Promocional' },
  { value: 'PRUEBAS', label: 'Pruebas' },
];

const INVENTORY_STATUS = [
  { value: 'LIBRE', label: 'Libre' },
  { value: 'OCUPADO', label: 'Ocupado' },
  { value: 'REPARACION', label: 'Reparación' },
];

const TEST_TYPES = [
  { value: 'LINK', label: 'Link' },
  { value: 'FISICA', label: 'Física' },
];

export default function InventoryEditForm({ open, onClose, onSuccess, item }) {
  const [loading, setLoading] = useState(false);

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
      category: 'INFORMATICA',
      itemType: '',
      inventoryNumber: '',
      status: 'LIBRE',
      location: '',
      maintenanceLocation: '',
      purchaseDate: '',
      serialNumber: '',
      stockControlEnabled: false,
      stock: 0,
      stockMinimo: 0,
      supplier: '',
      supplierWebsite: '',
      supplierEmail: '',
      supplierPhone: '',
      testType: '',
      requiresStaff: false,
      requiresTablet: false,
    },
  });

  const category = watch('category');
  const stockControlEnabled = watch('stockControlEnabled');

  useEffect(() => {
    if (item && open) {
      reset({
        code: item.code || '',
        name: item.name || '',
        category: item.category || 'INFORMATICA',
        itemType: item.itemType || '',
        inventoryNumber: item.inventoryNumber || '',
        status: item.status || 'LIBRE',
        location: item.location || '',
        maintenanceLocation: item.maintenanceLocation || '',
        purchaseDate: item.purchaseDate ? item.purchaseDate.split('T')[0] : '',
        serialNumber: item.serialNumber || '',
        stockControlEnabled: item.stockControlEnabled || false,
        stock: item.stock || 0,
        stockMinimo: item.stockMinimo || 0,
        supplier: item.supplier || '',
        supplierWebsite: item.supplierWebsite || '',
        supplierEmail: item.supplierEmail || '',
        supplierPhone: item.supplierPhone || '',
        testType: item.testType || '',
        requiresStaff: item.requiresStaff || false,
        requiresTablet: item.requiresTablet || false,
      });
    }
  }, [item, open, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const itemData = { ...data };

      // Remove empty optional fields
      Object.keys(itemData).forEach(key => {
        if (itemData[key] === '' || itemData[key] === null || itemData[key] === undefined) {
          delete itemData[key];
        }
      });

      // Validate email if provided
      if (itemData.supplierEmail && !itemData.supplierEmail.includes('@')) {
        toast.error('El email del proveedor no es válido');
        return;
      }

      // Validate URL if provided
      if (itemData.supplierWebsite && !itemData.supplierWebsite.startsWith('http')) {
        itemData.supplierWebsite = 'https://' + itemData.supplierWebsite;
      }

      await apiClient.inventory.update(item.id, itemData);

      toast.success('Item actualizado correctamente');
      onSuccess();
    } catch (error) {
      console.error('Error updating inventory item:', error);
      toast.error(error.response?.data?.error?.message || 'Error al actualizar item');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emooti-blue-600" />
            Editar Item de Inventario
          </DialogTitle>
          <DialogDescription>
            Modifica los datos del item {item?.code}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Información Básica
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  placeholder="Ej: INF-001"
                  {...register('code', {
                    required: 'El código es requerido',
                  })}
                />
                {errors.code && (
                  <p className="text-sm text-red-600">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Monitor HP 24 pulgadas"
                  {...register('name', {
                    required: 'El nombre es requerido',
                  })}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <Select
                  onValueChange={(value) => setValue('category', value)}
                  value={category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {INVENTORY_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemType">Tipo de Item</Label>
                <Input
                  id="itemType"
                  placeholder="Ej: Monitor, Teclado, Silla..."
                  {...register('itemType')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inventoryNumber">Número de Inventario</Label>
                <Input
                  id="inventoryNumber"
                  placeholder="Ej: 2024-001"
                  {...register('inventoryNumber')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">Número de Serie</Label>
                <Input
                  id="serialNumber"
                  placeholder="Ej: SN123456789"
                  {...register('serialNumber')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Fecha de Compra</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  {...register('purchaseDate')}
                />
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
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  placeholder="Ej: Almacén principal, Oficina 3"
                  {...register('location')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenanceLocation">Ubicación para Mantenimiento</Label>
                <Input
                  id="maintenanceLocation"
                  placeholder="Ej: Taller externo"
                  {...register('maintenanceLocation')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  onValueChange={(value) => setValue('status', value)}
                  value={watch('status')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {INVENTORY_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Stock Control */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <Archive className="w-4 h-4" />
              Control de Stock
            </h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stockControlEnabled"
                  checked={stockControlEnabled}
                  onCheckedChange={(checked) => setValue('stockControlEnabled', checked)}
                />
                <Label htmlFor="stockControlEnabled" className="cursor-pointer">
                  Habilitar control de stock
                </Label>
              </div>

              {stockControlEnabled && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Actual</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      placeholder="0"
                      {...register('stock', {
                        valueAsNumber: true,
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stockMinimo">Stock Mínimo</Label>
                    <Input
                      id="stockMinimo"
                      type="number"
                      min="0"
                      placeholder="0"
                      {...register('stockMinimo', {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Supplier Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Información del Proveedor
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Proveedor</Label>
                <Input
                  id="supplier"
                  placeholder="Ej: HP Store"
                  {...register('supplier')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierWebsite">Sitio Web del Proveedor</Label>
                <Input
                  id="supplierWebsite"
                  type="url"
                  placeholder="Ej: https://www.proveedor.com"
                  {...register('supplierWebsite')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierEmail">Email del Proveedor</Label>
                <Input
                  id="supplierEmail"
                  type="email"
                  placeholder="Ej: contacto@proveedor.com"
                  {...register('supplierEmail')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierPhone">Teléfono del Proveedor</Label>
                <Input
                  id="supplierPhone"
                  placeholder="Ej: +34 912 345 678"
                  {...register('supplierPhone')}
                />
              </div>
            </div>
          </div>

          {/* Test Configuration - Only for PRUEBAS category */}
          {category === 'PRUEBAS' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configuración de Pruebas
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testType">Tipo de Prueba</Label>
                  <Select
                    onValueChange={(value) => setValue('testType', value)}
                    value={watch('testType')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de prueba" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Ninguno</SelectItem>
                      {TEST_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requiresStaff"
                      checked={watch('requiresStaff')}
                      onCheckedChange={(checked) => setValue('requiresStaff', checked)}
                    />
                    <Label htmlFor="requiresStaff" className="cursor-pointer">
                      Requiere personal
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requiresTablet"
                      checked={watch('requiresTablet')}
                      onCheckedChange={(checked) => setValue('requiresTablet', checked)}
                    />
                    <Label htmlFor="requiresTablet" className="cursor-pointer">
                      Requiere tablet
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

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
              {loading ? 'Actualizando...' : 'Actualizar Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
