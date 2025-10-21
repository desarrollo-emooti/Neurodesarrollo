import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Download,
  Send,
  Eye,
  CheckCircle,
  Euro,
  Receipt,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import CreateInvoiceModal from '@/components/invoices/CreateInvoiceModal';
import InvoiceEditForm from '@/components/invoices/InvoiceEditForm';
import InvoicePreview from '@/components/invoices/InvoicePreview';

// API & Store
import { apiClient } from '@/lib/api';
import useAuthStore from '@/store/authStore';

// Constants
const INVOICE_STATUS = {
  EMITIDA: { label: 'Emitida', color: 'bg-yellow-100 text-yellow-800' },
  ENVIADA: { label: 'Enviada', color: 'bg-blue-100 text-blue-800' },
  PAGADA: { label: 'Pagada', color: 'bg-green-100 text-green-800' },
  CANCELADA: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
  ABONADA: { label: 'Abonada', color: 'bg-purple-100 text-purple-800' },
};

const CLIENT_TYPES = {
  B2B: { label: 'B2B', color: 'bg-blue-100 text-blue-800' },
  B2B2C: { label: 'B2B2C', color: 'bg-purple-100 text-purple-800' },
};

const PAYMENT_METHODS = {
  INTERNAL: 'Interno',
  STRIPE: 'Stripe',
};

export default function Invoices() {
  const { user: currentUser } = useAuthStore();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [paymentDate, setPaymentDate] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClientType, setFilterClientType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterIsCreditNote, setFilterIsCreditNote] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const invoicesPerPage = 20;

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    paid: 0,
    pending: 0,
    creditNotes: 0,
  });

  useEffect(() => {
    loadInvoices();
  }, [currentPage, searchTerm, filterClientType, filterStatus, filterPaymentMethod, filterIsCreditNote, filterStartDate, filterEndDate]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: invoicesPerPage,
        search: searchTerm || undefined,
        clientType: filterClientType || undefined,
        status: filterStatus || undefined,
        paymentMethod: filterPaymentMethod || undefined,
        isCreditNote: filterIsCreditNote || undefined,
        startDate: filterStartDate || undefined,
        endDate: filterEndDate || undefined,
      };

      const response = await apiClient.invoices.getAll(params);
      setInvoices(response.data.data || []);
      setTotalPages(response.data.meta?.totalPages || 1);
      setTotalInvoices(response.data.meta?.total || 0);

      // Calculate stats from loaded data
      const invoicesData = response.data.data || [];
      const totalAmount = invoicesData.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const paid = invoicesData.filter(inv => inv.status === 'PAGADA').length;
      const pending = invoicesData.filter(inv => ['EMITIDA', 'ENVIADA'].includes(inv.status)).length;
      const creditNotes = invoicesData.filter(inv => inv.isCreditNote).length;

      setStats({
        total: response.data.meta?.total || 0,
        totalAmount,
        paid,
        pending,
        creditNotes,
      });
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Error al cargar las facturas');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setShowEditModal(true);
  };

  const handlePreview = (invoice) => {
    setPreviewInvoice(invoice);
    setShowPreviewModal(true);
  };

  const handleDownloadPdf = async (invoice) => {
    if (!invoice.pdfUrl) {
      toast.error('Esta factura no tiene PDF generado');
      return;
    }

    try {
      window.open(invoice.pdfUrl, '_blank');
      toast.success('Descargando PDF...');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Error al descargar el PDF');
    }
  };

  const handleSendEmail = async (invoice) => {
    if (!confirm(`¿Enviar factura ${invoice.invoiceNumber} por email a ${invoice.clientEmail}?`)) {
      return;
    }

    try {
      await apiClient.invoices.sendEmail(invoice.id);
      toast.success('Email enviado correctamente');
      loadInvoices();
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error.response?.data?.error?.message || 'Error al enviar email');
    }
  };

  const handleMarkAsPaid = (invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setShowPaymentModal(true);
  };

  const confirmMarkAsPaid = async () => {
    if (!paymentDate) {
      toast.error('La fecha de pago es requerida');
      return;
    }

    try {
      await apiClient.invoices.markAsPaid(selectedInvoiceForPayment.id, { paymentDate });
      toast.success('Factura marcada como pagada');
      setShowPaymentModal(false);
      setSelectedInvoiceForPayment(null);
      setPaymentDate('');
      loadInvoices();
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast.error(error.response?.data?.error?.message || 'Error al marcar como pagada');
    }
  };

  const handleDelete = async (invoice) => {
    if (!confirm(`¿Estás seguro de eliminar la factura ${invoice.invoiceNumber}?`)) {
      return;
    }

    try {
      await apiClient.invoices.delete(invoice.id);
      toast.success('Factura eliminada correctamente');
      loadInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error(error.response?.data?.error?.message || 'Error al eliminar factura');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterClientType('');
    setFilterStatus('');
    setFilterPaymentMethod('');
    setFilterIsCreditNote('');
    setFilterStartDate('');
    setFilterEndDate('');
    setCurrentPage(1);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  // Permission checks
  const canCreate = ['ADMINISTRADOR', 'CLINICA'].includes(currentUser?.userType);
  const canEdit = ['ADMINISTRADOR', 'CLINICA'].includes(currentUser?.userType);
  const canDelete = currentUser?.userType === 'ADMINISTRADOR';
  const canSend = ['ADMINISTRADOR', 'CLINICA'].includes(currentUser?.userType);
  const canMarkPaid = ['ADMINISTRADOR', 'CLINICA'].includes(currentUser?.userType);

  if (loading && invoices.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <FileText className="w-8 h-8 text-emooti-blue-600" />
            Gestión de Facturas
          </h1>
          <p className="text-slate-600 mt-1">
            Administra las facturas y documentos de facturación
          </p>
        </div>

        {canCreate && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="emooti-gradient text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Factura
          </Button>
        )}
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Facturas</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Facturado</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <Euro className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pagadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Abonos</p>
                <p className="text-2xl font-bold text-purple-600">{stats.creditNotes}</p>
              </div>
              <Receipt className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">Filtros</h3>
            {(searchTerm || filterClientType || filterStatus || filterPaymentMethod || filterIsCreditNote || filterStartDate || filterEndDate) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por número, cliente, email, concepto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Client Type Filter */}
            <Select
              value={filterClientType || "ALL"}
              onValueChange={(value) => setFilterClientType(value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los tipos</SelectItem>
                {Object.entries(CLIENT_TYPES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={filterStatus || "ALL"}
              onValueChange={(value) => setFilterStatus(value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                {Object.entries(INVOICE_STATUS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Payment Method Filter */}
            <Select
              value={filterPaymentMethod || "ALL"}
              onValueChange={(value) => setFilterPaymentMethod(value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Método pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Is Credit Note Filter */}
            <Select
              value={filterIsCreditNote || "ALL"}
              onValueChange={(value) => setFilterIsCreditNote(value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo factura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="false">Facturas</SelectItem>
                <SelectItem value="true">Abonos</SelectItem>
              </SelectContent>
            </Select>

            {/* Start Date Filter */}
            <div className="space-y-1">
              <Label className="text-xs text-slate-600">Desde</Label>
              <Input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </div>

            {/* End Date Filter */}
            <div className="space-y-1">
              <Label className="text-xs text-slate-600">Hasta</Label>
              <Input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Nº Factura</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Fecha</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Cliente</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Concepto</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Base</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">IVA</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Total</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Estado</th>
                  <th className="p-4 text-right text-sm font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <FileText className="w-12 h-12 mb-3 text-slate-300" />
                        <p className="text-lg font-medium">No hay facturas disponibles</p>
                        <p className="text-sm">
                          {searchTerm || filterClientType || filterStatus || filterPaymentMethod || filterIsCreditNote || filterStartDate || filterEndDate
                            ? 'Prueba con otros filtros'
                            : 'Crea la primera factura para comenzar'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <motion.tr
                      key={invoice.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">{invoice.invoiceNumber}</p>
                          {invoice.isCreditNote && (
                            <Badge className="bg-orange-100 text-orange-800 text-xs">Abono</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-900">{formatDate(invoice.invoiceDate)}</p>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{invoice.clientName}</p>
                          <p className="text-xs text-slate-500">{invoice.clientEmail}</p>
                          <Badge className={`${CLIENT_TYPES[invoice.clientType]?.color || 'bg-slate-100'} text-xs mt-1`}>
                            {CLIENT_TYPES[invoice.clientType]?.label || invoice.clientType}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-900 max-w-xs truncate" title={invoice.concept}>
                          {invoice.concept}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-900">{formatCurrency(invoice.subtotal)}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-900">{invoice.vatRate}%</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-slate-900">{formatCurrency(invoice.totalAmount)}</p>
                      </td>
                      <td className="p-4">
                        <Badge className={INVOICE_STATUS[invoice.status]?.color || 'bg-slate-100'}>
                          {INVOICE_STATUS[invoice.status]?.label || invoice.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(invoice)}
                            title="Ver preview"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {invoice.pdfUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPdf(invoice)}
                              title="Descargar PDF"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                          {canSend && invoice.status !== 'PAGADA' && invoice.status !== 'CANCELADA' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendEmail(invoice)}
                              title="Enviar email"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          )}
                          {canMarkPaid && invoice.status !== 'PAGADA' && invoice.status !== 'CANCELADA' && !invoice.isCreditNote && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsPaid(invoice)}
                              title="Marcar como pagada"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(invoice)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(invoice)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
              <p className="text-sm text-slate-600">
                Mostrando {invoices.length} de {totalInvoices} facturas
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showCreateModal && (
        <CreateInvoiceModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadInvoices();
          }}
        />
      )}

      {showEditModal && editingInvoice && (
        <InvoiceEditForm
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingInvoice(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingInvoice(null);
            loadInvoices();
          }}
          invoice={editingInvoice}
        />
      )}

      {showPreviewModal && previewInvoice && (
        <InvoicePreview
          open={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setPreviewInvoice(null);
          }}
          invoice={previewInvoice}
          onRefresh={loadInvoices}
        />
      )}

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Pagada</DialogTitle>
            <DialogDescription>
              Introduce la fecha de pago para la factura {selectedInvoiceForPayment?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Fecha de Pago *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                min={selectedInvoiceForPayment?.invoiceDate?.split('T')[0]}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentModal(false);
                setSelectedInvoiceForPayment(null);
                setPaymentDate('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmMarkAsPaid}
              className="emooti-gradient text-white"
            >
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
