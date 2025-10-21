import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FileText, User, Settings, Receipt } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

// API
import { apiClient } from '@/lib/api';

// Constants
const CLIENT_TYPES = [
  { value: 'B2B', label: 'B2B' },
  { value: 'B2B2C', label: 'B2B2C' },
];

const INVOICE_STATUS = [
  { value: 'EMITIDA', label: 'Emitida' },
  { value: 'ENVIADA', label: 'Enviada' },
  { value: 'PAGADA', label: 'Pagada' },
  { value: 'CANCELADA', label: 'Cancelada' },
  { value: 'ABONADA', label: 'Abonada' },
];

const PAYMENT_METHODS = [
  { value: 'INTERNAL', label: 'Interno' },
  { value: 'STRIPE', label: 'Stripe' },
];

export default function InvoiceEditForm({ open, onClose, onSuccess, invoice }) {
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
      clientType: invoice?.clientType || 'B2B',
      clientName: invoice?.clientName || '',
      clientCifDni: invoice?.clientCifDni || '',
      clientAddress: invoice?.clientAddress || '',
      clientEmail: invoice?.clientEmail || '',
      concept: invoice?.concept || '',
      subtotal: invoice?.subtotal || '',
      vatRate: invoice?.vatRate || '21',
      status: invoice?.status || 'EMITIDA',
      paymentMethod: invoice?.paymentMethod || 'INTERNAL',
      stripeInvoiceId: invoice?.stripeInvoiceId || '',
      pdfUrl: invoice?.pdfUrl || '',
    },
  });

  useEffect(() => {
    if (invoice) {
      setValue('clientType', invoice.clientType);
      setValue('clientName', invoice.clientName);
      setValue('clientCifDni', invoice.clientCifDni);
      setValue('clientAddress', invoice.clientAddress);
      setValue('clientEmail', invoice.clientEmail);
      setValue('concept', invoice.concept);
      setValue('subtotal', invoice.subtotal);
      setValue('vatRate', invoice.vatRate);
      setValue('status', invoice.status);
      setValue('paymentMethod', invoice.paymentMethod);
      setValue('stripeInvoiceId', invoice.stripeInvoiceId || '');
      setValue('pdfUrl', invoice.pdfUrl || '');
    }
  }, [invoice, setValue]);

  const subtotal = watch('subtotal');
  const vatRate = watch('vatRate');

  const calculateVatAmount = () => {
    const base = parseFloat(subtotal) || 0;
    const vat = parseFloat(vatRate) || 0;
    return (base * vat) / 100;
  };

  const calculateTotal = () => {
    const base = parseFloat(subtotal) || 0;
    const vat = calculateVatAmount();
    return base + vat;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const onSubmit = async (data) => {
    try {
      // Validations
      if (!data.clientEmail.includes('@')) {
        toast.error('El email del cliente no es válido');
        return;
      }

      const baseAmount = parseFloat(data.subtotal);
      if (baseAmount <= 0) {
        toast.error('La base imponible debe ser mayor a 0');
        return;
      }

      const taxRate = parseFloat(data.vatRate);
      if (taxRate < 0 || taxRate > 100) {
        toast.error('El tipo de IVA debe estar entre 0 y 100');
        return;
      }

      setLoading(true);

      const vatAmount = calculateVatAmount();
      const totalAmount = calculateTotal();

      const updateData = {
        clientName: data.clientName,
        clientCifDni: data.clientCifDni,
        clientAddress: data.clientAddress,
        clientEmail: data.clientEmail,
        concept: data.concept,
        subtotal: baseAmount,
        vatRate: taxRate,
        vatAmount: vatAmount,
        totalAmount: totalAmount,
        status: data.status,
        paymentMethod: data.paymentMethod,
      };

      // Add optional fields
      if (data.stripeInvoiceId) {
        updateData.stripeInvoiceId = data.stripeInvoiceId;
      }

      if (data.pdfUrl) {
        updateData.pdfUrl = data.pdfUrl;
      }

      await apiClient.invoices.update(invoice.id, updateData);

      toast.success('Factura actualizada correctamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error(error.response?.data?.error?.message || 'Error al actualizar factura');
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emooti-blue-600" />
            Editar Factura {invoice?.invoiceNumber}
          </DialogTitle>
          <DialogDescription>
            Modifica los datos de la factura
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 1. Información de la Factura */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Información de la Factura
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número de Factura</Label>
                <Input
                  disabled
                  value={invoice?.invoiceNumber || ''}
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">
                  El número de factura no se puede modificar
                </p>
              </div>

              <div className="space-y-2">
                <Label>Fecha de Emisión</Label>
                <Input
                  disabled
                  value={invoice?.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('es-ES') : ''}
                  className="bg-slate-50"
                />
              </div>

              {invoice?.isCreditNote && (
                <div className="col-span-2">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-sm text-orange-800 font-medium">
                      Esta es una nota de crédito (abono)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Datos del Cliente */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Datos del Cliente
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientType">Tipo de Cliente</Label>
                <Input
                  disabled
                  value={CLIENT_TYPES.find(t => t.value === invoice?.clientType)?.label || invoice?.clientType}
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">
                  El tipo de cliente no se puede modificar
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientName">Nombre del Cliente *</Label>
                <Input
                  id="clientName"
                  placeholder="Ej: Empresa S.L."
                  {...register('clientName', {
                    required: 'El nombre del cliente es requerido',
                    minLength: {
                      value: 3,
                      message: 'El nombre debe tener al menos 3 caracteres',
                    },
                  })}
                />
                {errors.clientName && (
                  <p className="text-sm text-red-600">{errors.clientName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientEmail">Email del Cliente *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="Ej: cliente@example.com"
                  {...register('clientEmail', {
                    required: 'El email del cliente es requerido',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido',
                    },
                  })}
                />
                {errors.clientEmail && (
                  <p className="text-sm text-red-600">{errors.clientEmail.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientCifDni">NIF/CIF *</Label>
                <Input
                  id="clientCifDni"
                  placeholder="Ej: B12345678"
                  {...register('clientCifDni', {
                    required: 'El NIF/CIF es requerido',
                  })}
                />
                {errors.clientCifDni && (
                  <p className="text-sm text-red-600">{errors.clientCifDni.message}</p>
                )}
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="clientAddress">Dirección Completa *</Label>
                <Textarea
                  id="clientAddress"
                  placeholder="Calle, número, ciudad, código postal..."
                  rows={3}
                  {...register('clientAddress', {
                    required: 'La dirección es requerida',
                  })}
                />
                {errors.clientAddress && (
                  <p className="text-sm text-red-600">{errors.clientAddress.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* 3. Detalles de Facturación */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Detalles de Facturación
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="concept">Concepto *</Label>
                <Textarea
                  id="concept"
                  placeholder="Descripción de los servicios o productos facturados..."
                  rows={3}
                  {...register('concept', {
                    required: 'El concepto es requerido',
                    minLength: {
                      value: 10,
                      message: 'El concepto debe tener al menos 10 caracteres',
                    },
                  })}
                />
                {errors.concept && (
                  <p className="text-sm text-red-600">{errors.concept.message}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subtotal">Base Imponible (€) *</Label>
                  <Input
                    id="subtotal"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Ej: 1000.00"
                    {...register('subtotal', {
                      required: 'La base imponible es requerida',
                      min: {
                        value: 0.01,
                        message: 'La base debe ser mayor a 0',
                      },
                    })}
                  />
                  {errors.subtotal && (
                    <p className="text-sm text-red-600">{errors.subtotal.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vatRate">Tipo de IVA (%) *</Label>
                  <Input
                    id="vatRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="Ej: 21"
                    {...register('vatRate', {
                      required: 'El tipo de IVA es requerido',
                      min: {
                        value: 0,
                        message: 'El IVA debe ser 0 o mayor',
                      },
                      max: {
                        value: 100,
                        message: 'El IVA no puede superar el 100%',
                      },
                    })}
                  />
                  {errors.vatRate && (
                    <p className="text-sm text-red-600">{errors.vatRate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Total (€)</Label>
                  <Input
                    disabled
                    value={formatCurrency(calculateTotal())}
                    className="bg-slate-50 font-semibold text-emooti-blue-600"
                  />
                  <p className="text-xs text-slate-500">
                    Calculado automáticamente
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Estado *</Label>
                  <Select
                    onValueChange={(value) => setValue('status', value)}
                    value={watch('status')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {INVOICE_STATUS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Método de Pago *</Label>
                  <Select
                    onValueChange={(value) => setValue('paymentMethod', value)}
                    value={watch('paymentMethod')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {watch('paymentMethod') === 'STRIPE' && (
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="stripeInvoiceId">ID de Factura Stripe</Label>
                    <Input
                      id="stripeInvoiceId"
                      placeholder="Ej: in_1234567890"
                      {...register('stripeInvoiceId')}
                    />
                  </div>
                )}

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="pdfUrl">URL del PDF</Label>
                  <Input
                    id="pdfUrl"
                    placeholder="URL del PDF generado"
                    {...register('pdfUrl')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Resumen */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Resumen
            </h3>

            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Cliente:</span>
                <span className="font-medium text-slate-900">
                  {watch('clientName') || '-'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tipo:</span>
                <span className="font-medium text-slate-900">
                  {CLIENT_TYPES.find(t => t.value === invoice?.clientType)?.label || invoice?.clientType}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Base imponible:</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(parseFloat(subtotal) || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">IVA ({vatRate}%):</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(calculateVatAmount())}
                </span>
              </div>
              <div className="flex justify-between text-base border-t pt-2">
                <span className="font-semibold text-slate-900">Total:</span>
                <span className="font-bold text-emooti-blue-600">
                  {formatCurrency(calculateTotal())}
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
