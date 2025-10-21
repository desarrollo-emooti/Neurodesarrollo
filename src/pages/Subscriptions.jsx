import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Users,
  Calendar,
  Receipt,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import CreateSubscriptionModal from '@/components/subscriptions/CreateSubscriptionModal';
import SubscriptionEditForm from '@/components/subscriptions/SubscriptionEditForm';
import BillingHistory from '@/components/subscriptions/BillingHistory';

// API & Store
import { apiClient } from '@/lib/api';
import useAuthStore from '@/store/authStore';

// Constants
const PAYMENT_TYPES = {
  B2B: { label: 'B2B', color: 'bg-blue-100 text-blue-800' },
  B2B2C: { label: 'B2B2C', color: 'bg-purple-100 text-purple-800' },
};

export default function Subscriptions() {
  const { user: currentUser } = useAuthStore();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBillingHistoryModal, setShowBillingHistoryModal] = useState(false);
  const [selectedSubscriptionForBilling, setSelectedSubscriptionForBilling] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentType, setFilterPaymentType] = useState('');
  const [filterCenter, setFilterCenter] = useState('');
  const [filterIsActive, setFilterIsActive] = useState('');
  const [filterIsRecurring, setFilterIsRecurring] = useState('');
  const [centers, setCenters] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);
  const subscriptionsPerPage = 20;

  useEffect(() => {
    loadSubscriptions();
    loadCenters();
  }, [currentPage, searchTerm, filterPaymentType, filterCenter, filterIsActive, filterIsRecurring]);

  const loadCenters = async () => {
    try {
      const response = await apiClient.centers.getAll();
      setCenters(response.data.data || []);
    } catch (error) {
      console.error('Error loading centers:', error);
    }
  };

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: subscriptionsPerPage,
        search: searchTerm || undefined,
        paymentType: filterPaymentType || undefined,
        centerId: filterCenter || undefined,
        isActive: filterIsActive || undefined,
        isRecurring: filterIsRecurring || undefined,
      };

      const response = await apiClient.subscriptions.getAll(params);
      setSubscriptions(response.data.data || []);
      setTotalPages(response.data.meta?.totalPages || 1);
      setTotalSubscriptions(response.data.meta?.total || 0);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast.error('Error al cargar las suscripciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedSubscriptions(subscriptions.map(s => s.id));
    } else {
      setSelectedSubscriptions([]);
    }
  };

  const handleSelectSubscription = (subscriptionId, checked) => {
    if (checked) {
      setSelectedSubscriptions([...selectedSubscriptions, subscriptionId]);
    } else {
      setSelectedSubscriptions(selectedSubscriptions.filter(id => id !== subscriptionId));
    }
  };

  const handleEdit = (subscription) => {
    setEditingSubscription(subscription);
    setShowEditModal(true);
  };

  const handleViewBillingHistory = (subscription) => {
    setSelectedSubscriptionForBilling(subscription);
    setShowBillingHistoryModal(true);
  };

  const handleDeleteSelected = async () => {
    if (selectedSubscriptions.length === 0) {
      toast.error('No hay suscripciones seleccionadas');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar ${selectedSubscriptions.length} suscripción(es)?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedSubscriptions.map(id => apiClient.subscriptions.delete(id))
      );
      toast.success('Suscripciones eliminadas correctamente');
      setSelectedSubscriptions([]);
      loadSubscriptions();
    } catch (error) {
      console.error('Error deleting subscriptions:', error);
      toast.error(error.response?.data?.error?.message || 'Error al eliminar suscripciones');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterPaymentType('');
    setFilterCenter('');
    setFilterIsActive('');
    setFilterIsRecurring('');
    setCurrentPage(1);
  };

  // Calculate statistics
  const stats = {
    total: totalSubscriptions,
    active: subscriptions.filter(s => s.isActive).length,
    recurring: subscriptions.filter(s => s.isRecurring).length,
    totalStudents: subscriptions.reduce((sum, s) => sum + (s.studentIds?.length || 0), 0),
  };

  // Permission checks
  const canCreate = ['ADMINISTRADOR', 'CLINICA'].includes(currentUser?.userType);
  const canEdit = ['ADMINISTRADOR', 'CLINICA'].includes(currentUser?.userType);
  const canDelete = currentUser?.userType === 'ADMINISTRADOR';
  const canViewBilling = ['ADMINISTRADOR', 'CLINICA'].includes(currentUser?.userType);

  if (loading && subscriptions.length === 0) {
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
            <CreditCard className="w-8 h-8 text-emooti-blue-600" />
            Gestión de Suscripciones
          </h1>
          <p className="text-slate-600 mt-1">
            Administra las suscripciones y configuraciones de facturación
          </p>
        </div>

        {canCreate && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="emooti-gradient text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Suscripción
          </Button>
        )}
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Suscripciones</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Activas</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CreditCard className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Recurrentes</p>
                <p className="text-2xl font-bold text-blue-600">{stats.recurring}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Estudiantes</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalStudents}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
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
            {(searchTerm || filterPaymentType || filterCenter || filterIsActive || filterIsRecurring) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre, receptor, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Payment Type Filter */}
            <Select
              value={filterPaymentType || "ALL"}
              onValueChange={(value) => setFilterPaymentType(value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los tipos</SelectItem>
                {Object.entries(PAYMENT_TYPES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Center Filter */}
            <Select
              value={filterCenter || "ALL"}
              onValueChange={(value) => setFilterCenter(value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los centros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los centros</SelectItem>
                {centers.map((center) => (
                  <SelectItem key={center.id} value={center.id}>
                    {center.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Active Filter */}
            <Select
              value={filterIsActive || "ALL"}
              onValueChange={(value) => setFilterIsActive(value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="true">Activas</SelectItem>
                <SelectItem value="false">Inactivas</SelectItem>
              </SelectContent>
            </Select>

            {/* Recurring Filter */}
            <Select
              value={filterIsRecurring || "ALL"}
              onValueChange={(value) => setFilterIsRecurring(value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Facturación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="true">Recurrentes</SelectItem>
                <SelectItem value="false">Una vez</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedSubscriptions.length > 0 && canDelete && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emooti-blue-50 border border-emooti-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-emooti-blue-900">
              {selectedSubscriptions.length} suscripción(es) seleccionada(s)
            </span>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar seleccionadas
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Subscriptions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {canDelete && (
                    <th className="p-4 text-left">
                      <Checkbox
                        checked={selectedSubscriptions.length === subscriptions.length && subscriptions.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Nombre</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Tipo Pago</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Centro</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Receptor</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Estudiantes</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Precio/Est.</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Próx. Factura</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Estado</th>
                  <th className="p-4 text-right text-sm font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={canDelete ? 10 : 9} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <CreditCard className="w-12 h-12 mb-3 text-slate-300" />
                        <p className="text-lg font-medium">No hay suscripciones disponibles</p>
                        <p className="text-sm">
                          {searchTerm || filterPaymentType || filterCenter || filterIsActive || filterIsRecurring
                            ? 'Prueba con otros filtros'
                            : 'Crea la primera suscripción para comenzar'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((subscription) => (
                    <motion.tr
                      key={subscription.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {canDelete && (
                        <td className="p-4">
                          <Checkbox
                            checked={selectedSubscriptions.includes(subscription.id)}
                            onCheckedChange={(checked) => handleSelectSubscription(subscription.id, checked)}
                          />
                        </td>
                      )}
                      <td className="p-4">
                        <p className="text-sm font-medium text-slate-900">{subscription.name}</p>
                      </td>
                      <td className="p-4">
                        <Badge className={PAYMENT_TYPES[subscription.paymentType]?.color || 'bg-slate-100'}>
                          {PAYMENT_TYPES[subscription.paymentType]?.label || subscription.paymentType}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-sm text-slate-900">{subscription.center?.name || '-'}</p>
                          {subscription.center?.code && (
                            <p className="text-xs text-slate-500">{subscription.center.code}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-sm text-slate-900">{subscription.recipientName}</p>
                          <p className="text-xs text-slate-500">{subscription.recipientEmail}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm text-slate-900">
                          <Users className="w-3 h-3" />
                          <span>{subscription.studentIds?.length || 0}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-slate-900">
                          {subscription.pricePerStudent?.toFixed(2)} €
                        </p>
                      </td>
                      <td className="p-4">
                        {subscription.nextBillingDate ? (
                          <div className="flex items-center gap-1 text-sm text-slate-900">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(subscription.nextBillingDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <Badge className={subscription.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                            {subscription.isActive ? 'Activa' : 'Inactiva'}
                          </Badge>
                          <Badge className={subscription.isRecurring ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}>
                            {subscription.isRecurring ? 'Recurrente' : 'Una vez'}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {canViewBilling && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewBillingHistory(subscription)}
                              title="Ver historial de facturación"
                            >
                              <Receipt className="w-4 h-4" />
                            </Button>
                          )}
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(subscription)}
                            >
                              <Edit2 className="w-4 h-4" />
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
                Mostrando {subscriptions.length} de {totalSubscriptions} suscripciones
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
        <CreateSubscriptionModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadSubscriptions();
          }}
        />
      )}

      {showEditModal && editingSubscription && (
        <SubscriptionEditForm
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingSubscription(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingSubscription(null);
            loadSubscriptions();
          }}
          subscription={editingSubscription}
        />
      )}

      {showBillingHistoryModal && selectedSubscriptionForBilling && (
        <BillingHistory
          open={showBillingHistoryModal}
          onClose={() => {
            setShowBillingHistoryModal(false);
            setSelectedSubscriptionForBilling(null);
          }}
          subscription={selectedSubscriptionForBilling}
        />
      )}
    </div>
  );
}
