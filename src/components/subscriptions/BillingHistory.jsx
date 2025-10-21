import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Receipt, Plus, Calendar, Users, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

// API
import { apiClient } from '@/lib/api';

// Constants
const BILLING_STATUS = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  ENVIADA: { label: 'Enviada', color: 'bg-blue-100 text-blue-800', icon: FileText },
  PAGADA: { label: 'Pagada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELADA: { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function BillingHistory({ open, onClose, subscription }) {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatingBilling, setGeneratingBilling] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState('');
  const [billingDate, setBillingDate] = useState('');

  useEffect(() => {
    if (open && subscription) {
      loadBillings();
      // Set default billing date to today
      setBillingDate(new Date().toISOString().split('T')[0]);
    }
  }, [open, subscription]);

  const loadBillings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.subscriptions.getBillings(subscription.id);
      setBillings(response.data.data || []);
    } catch (error) {
      console.error('Error loading billings:', error);
      toast.error('Error al cargar el historial de facturación');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBilling = async () => {
    try {
      if (!billingPeriod) {
        toast.error('El periodo de facturación es requerido');
        return;
      }

      if (!billingDate) {
        toast.error('La fecha de facturación es requerida');
        return;
      }

      setGeneratingBilling(true);

      await apiClient.subscriptions.generateBilling(subscription.id, {
        billingPeriod,
        billingDate,
      });

      toast.success('Factura generada correctamente');
      setShowGenerateModal(false);
      setBillingPeriod('');
      setBillingDate(new Date().toISOString().split('T')[0]);
      loadBillings();
    } catch (error) {
      console.error('Error generating billing:', error);
      toast.error(error.response?.data?.error?.message || 'Error al generar factura');
    } finally {
      setGeneratingBilling(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStatusIcon = (status) => {
    const StatusIcon = BILLING_STATUS[status]?.icon || Clock;
    return <StatusIcon className="w-4 h-4" />;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emooti-blue-600" />
              Historial de Facturación
            </DialogTitle>
            <DialogDescription>
              Suscripción: {subscription?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Subscription Info */}
            <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-600">Tipo de Pago</p>
                <p className="text-sm font-medium text-slate-900">{subscription?.paymentType}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Centro</p>
                <p className="text-sm font-medium text-slate-900">{subscription?.center?.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Receptor</p>
                <p className="text-sm font-medium text-slate-900">{subscription?.recipientName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Estado</p>
                <Badge className={subscription?.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                  {subscription?.isActive ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
            </div>

            {/* Generate Billing Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => setShowGenerateModal(true)}
                className="emooti-gradient text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Generar Nueva Factura
              </Button>
            </div>

            {/* Billings Table */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : billings.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-lg font-medium text-slate-600">No hay facturas generadas</p>
                <p className="text-sm text-slate-500 mt-1">
                  Genera la primera factura para esta suscripción
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-left text-xs font-semibold text-slate-700">Periodo</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-700">Fecha</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-700">Estudiantes</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-700">Monto</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-700">Estado</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-700">Enviada</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-700">Pagada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {billings.map((billing) => (
                      <tr key={billing.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span className="text-sm text-slate-900">{billing.billingPeriod}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-slate-900">
                            {formatDate(billing.billingDate)}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 text-sm text-slate-900">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span>{billing.numberOfStudents}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm font-medium text-slate-900">
                            {formatCurrency(billing.totalAmount)}
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge className={BILLING_STATUS[billing.status]?.color || 'bg-slate-100'}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(billing.status)}
                              {BILLING_STATUS[billing.status]?.label || billing.status}
                            </div>
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-slate-600">
                            {formatDate(billing.sentDate)}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-slate-600">
                            {formatDate(billing.paidDate)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary */}
            {billings.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total de facturas:</span>
                  <span className="font-medium text-slate-900">{billings.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Facturas pagadas:</span>
                  <span className="font-medium text-green-600">
                    {billings.filter(b => b.status === 'PAGADA').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Facturas pendientes:</span>
                  <span className="font-medium text-yellow-600">
                    {billings.filter(b => b.status === 'PENDIENTE').length}
                  </span>
                </div>
                <div className="flex justify-between text-base border-t pt-2">
                  <span className="font-semibold text-slate-900">Total facturado:</span>
                  <span className="font-bold text-emooti-blue-600">
                    {formatCurrency(billings.reduce((sum, b) => sum + b.totalAmount, 0))}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Billing Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-emooti-blue-600" />
              Generar Nueva Factura
            </DialogTitle>
            <DialogDescription>
              Crea una nueva factura para esta suscripción
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="billingPeriod">Periodo de Facturación *</Label>
              <Input
                id="billingPeriod"
                placeholder="Ej: Enero 2024"
                value={billingPeriod}
                onChange={(e) => setBillingPeriod(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Especifica el periodo al que corresponde esta factura
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingDate">Fecha de Facturación *</Label>
              <Input
                id="billingDate"
                type="date"
                value={billingDate}
                onChange={(e) => setBillingDate(e.target.value)}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                Se generará una factura para <strong>{subscription?.studentIds?.length || 0} estudiantes</strong> a{' '}
                <strong>{formatCurrency(subscription?.pricePerStudent || 0)}</strong> cada uno.
              </p>
              <p className="text-sm font-semibold text-blue-900 mt-1">
                Total: {formatCurrency((subscription?.studentIds?.length || 0) * (subscription?.pricePerStudent || 0))}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowGenerateModal(false);
                setBillingPeriod('');
                setBillingDate(new Date().toISOString().split('T')[0]);
              }}
              disabled={generatingBilling}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerateBilling}
              disabled={generatingBilling}
              className="emooti-gradient text-white"
            >
              {generatingBilling ? 'Generando...' : 'Generar Factura'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
