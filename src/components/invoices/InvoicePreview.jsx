import React, { useState } from 'react';
import { toast } from 'sonner';
import { FileText, Download, Printer, Send } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

// API
import { apiClient } from '@/lib/api';

export default function InvoicePreview({ open, onClose, invoice, onRefresh }) {
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleGeneratePdf = async () => {
    try {
      setGeneratingPdf(true);
      await apiClient.invoices.generatePdf(invoice.id);
      toast.success('PDF generado correctamente');
      onRefresh();
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(error.response?.data?.error?.message || 'Error al generar PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    try {
      setSendingEmail(true);
      await apiClient.invoices.sendEmail(invoice.id);
      toast.success('Email enviado correctamente');
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error.response?.data?.error?.message || 'Error al enviar email');
    } finally {
      setSendingEmail(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      EMITIDA: 'bg-yellow-100 text-yellow-800',
      ENVIADA: 'bg-blue-100 text-blue-800',
      PAGADA: 'bg-green-100 text-green-800',
      CANCELADA: 'bg-red-100 text-red-800',
      ABONADA: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      EMITIDA: 'Emitida',
      ENVIADA: 'Enviada',
      PAGADA: 'Pagada',
      CANCELADA: 'Cancelada',
      ABONADA: 'Abonada',
    };
    return labels[status] || status;
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emooti-blue-600" />
              Vista Previa de Factura
            </div>
            <Badge className={getStatusColor(invoice.status)}>
              {getStatusLabel(invoice.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Invoice Preview */}
        <div className="bg-white border rounded-lg p-8 space-y-6 print:border-0">
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-6">
            <div>
              <h1 className="text-3xl font-bold text-emooti-blue-600 mb-2">
                {invoice.isCreditNote ? 'FACTURA RECTIFICATIVA (ABONO)' : 'FACTURA'}
              </h1>
              <div className="space-y-1">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">Nº:</span> {invoice.invoiceNumber}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">Fecha:</span> {formatDate(invoice.invoiceDate)}
                </p>
                {invoice.isCreditNote && (
                  <Badge className="bg-orange-100 text-orange-800 mt-2">
                    Nota de Crédito
                  </Badge>
                )}
              </div>
            </div>

            {/* Company Logo/Info */}
            <div className="text-right">
              <h2 className="text-2xl font-bold text-slate-900">EMOOTI</h2>
              <div className="text-sm text-slate-600 mt-2 space-y-1">
                <p>Emooti Hub SL</p>
                <p>CIF: B12345678</p>
                <p>Calle Ejemplo, 123</p>
                <p>28001 Madrid, España</p>
                <p>Tel: +34 900 000 000</p>
                <p>Email: facturacion@emooti.com</p>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900 uppercase border-b pb-1">
                Datos del Emisor
              </h3>
              <div className="text-sm space-y-1">
                <p className="font-semibold">EMOOTI HUB SL</p>
                <p>CIF: B12345678</p>
                <p>Calle Ejemplo, 123</p>
                <p>28001 Madrid, España</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900 uppercase border-b pb-1">
                Datos del Cliente
              </h3>
              <div className="text-sm space-y-1">
                <p className="font-semibold">{invoice.clientName}</p>
                <p>{invoice.clientCifDni}</p>
                <p>{invoice.clientAddress}</p>
                <p>{invoice.clientEmail}</p>
                <Badge className="bg-blue-100 text-blue-800 text-xs mt-1">
                  {invoice.clientType}
                </Badge>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase border-b pb-2">
              Detalles de la Factura
            </h3>

            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Concepto</h4>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{invoice.concept}</p>
            </div>

            {/* Payment Details Table */}
            {invoice.paymentDetails && invoice.paymentDetails.length > 0 && (
              <div className="overflow-hidden border rounded-lg">
                <table className="w-full">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-3 text-left text-xs font-semibold text-slate-700">Periodo</th>
                      <th className="p-3 text-right text-xs font-semibold text-slate-700">Estudiantes</th>
                      <th className="p-3 text-right text-xs font-semibold text-slate-700">Precio/Est.</th>
                      <th className="p-3 text-right text-xs font-semibold text-slate-700">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.paymentDetails.map((detail, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3 text-sm text-slate-900">{detail.period || '-'}</td>
                        <td className="p-3 text-sm text-slate-900 text-right">{detail.students_count || 0}</td>
                        <td className="p-3 text-sm text-slate-900 text-right">
                          {formatCurrency(detail.price_per_student || 0)}
                        </td>
                        <td className="p-3 text-sm font-medium text-slate-900 text-right">
                          {formatCurrency(detail.amount || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="w-80 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Base Imponible:</span>
                  <span className="font-medium text-slate-900">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">IVA ({invoice.vatRate}%):</span>
                  <span className="font-medium text-slate-900">{formatCurrency(invoice.vatAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span className="text-slate-900">TOTAL:</span>
                  <span className="text-emooti-blue-600">{formatCurrency(invoice.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          {invoice.status === 'PAGADA' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <h4 className="text-sm font-semibold text-green-900">Factura Pagada</h4>
              </div>
              <div className="text-sm text-green-800 space-y-1">
                <p>Método de pago: {invoice.paymentMethod === 'STRIPE' ? 'Stripe' : 'Interno'}</p>
                {invoice.stripeInvoiceId && (
                  <p>ID de transacción: {invoice.stripeInvoiceId}</p>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-4 text-center text-xs text-slate-500">
            <p>
              Factura generada electrónicamente. Para cualquier consulta, contacte con facturacion@emooti.com
            </p>
            {invoice.isCreditNote && (
              <p className="mt-2 text-orange-600 font-medium">
                Esta es una factura rectificativa (abono). El importe indicado se restará de la factura original.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center print:hidden">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </Button>
            <Button
              variant="outline"
              onClick={handleGeneratePdf}
              disabled={generatingPdf}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {generatingPdf ? 'Generando...' : 'Generar PDF'}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cerrar
            </Button>
            {invoice.status !== 'PAGADA' && invoice.status !== 'CANCELADA' && (
              <Button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="emooti-gradient text-white gap-2"
              >
                <Send className="w-4 h-4" />
                {sendingEmail ? 'Enviando...' : 'Enviar por Email'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
