import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Clock,
  MapPin,
  Users,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  User,
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
import CreateAgendaEventModal from '@/components/agenda/CreateAgendaEventModal';
import AgendaEventEditForm from '@/components/agenda/AgendaEventEditForm';

// API & Store
import { apiClient } from '@/lib/api';
import useAuthStore from '@/store/authStore';

// Constants
const EVENT_TYPES = {
  EVALUACION: { label: 'Evaluación', color: 'bg-blue-100 text-blue-800', icon: FileText },
  REUNION: { label: 'Reunión', color: 'bg-purple-100 text-purple-800', icon: Users },
  FORMACION: { label: 'Formación', color: 'bg-green-100 text-green-800', icon: FileText },
  OTRO: { label: 'Otro', color: 'bg-slate-100 text-slate-800', icon: Calendar },
};

const APPROVAL_STATUS = {
  PENDING_APPROVAL: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  APPROVED: { label: 'Aprobado', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  REQUEST_CANCELLATION: { label: 'Solicitud de Cancelación', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  REQUEST_MODIFICATION: { label: 'Solicitud de Modificación', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const PRIORITY = {
  BAJA: { label: 'Baja', color: 'bg-slate-100 text-slate-700' },
  MEDIA: { label: 'Media', color: 'bg-blue-100 text-blue-700' },
  ALTA: { label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  URGENTE: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
};

export default function Agenda() {
  const { user: currentUser } = useAuthStore();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEventType, setFilterEventType] = useState('');
  const [filterCenter, setFilterCenter] = useState('');
  const [filterApprovalStatus, setFilterApprovalStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [centers, setCenters] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const eventsPerPage = 20;

  useEffect(() => {
    loadEvents();
    loadCenters();
  }, [currentPage, searchTerm, filterEventType, filterCenter, filterApprovalStatus, filterPriority]);

  const loadCenters = async () => {
    try {
      const response = await apiClient.centers.getAll();
      setCenters(response.data.data || []);
    } catch (error) {
      console.error('Error loading centers:', error);
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: eventsPerPage,
        search: searchTerm || undefined,
        eventType: filterEventType || undefined,
        centerId: filterCenter || undefined,
        approvalStatus: filterApprovalStatus || undefined,
        priority: filterPriority || undefined,
      };

      const response = await apiClient.agenda.getAll(params);
      setEvents(response.data.data || []);
      setTotalPages(response.data.meta?.totalPages || 1);
      setTotalEvents(response.data.meta?.total || 0);
    } catch (error) {
      console.error('Error loading agenda events:', error);
      toast.error('Error al cargar los eventos de agenda');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedEvents(events.map(e => e.id));
    } else {
      setSelectedEvents([]);
    }
  };

  const handleSelectEvent = (eventId, checked) => {
    if (checked) {
      setSelectedEvents([...selectedEvents, eventId]);
    } else {
      setSelectedEvents(selectedEvents.filter(id => id !== eventId));
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowEditModal(true);
  };

  const handleDeleteSelected = async () => {
    if (selectedEvents.length === 0) {
      toast.error('No hay eventos seleccionados');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar ${selectedEvents.length} evento(s)?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedEvents.map(id => apiClient.agenda.delete(id))
      );
      toast.success('Eventos eliminados correctamente');
      setSelectedEvents([]);
      loadEvents();
    } catch (error) {
      console.error('Error deleting events:', error);
      toast.error('Error al eliminar eventos');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterEventType('');
    setFilterCenter('');
    setFilterApprovalStatus('');
    setFilterPriority('');
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Permission checks
  const canCreate = ['ADMINISTRADOR', 'CLINICA'].includes(currentUser?.userType);
  const canEdit = ['ADMINISTRADOR', 'CLINICA'].includes(currentUser?.userType);
  const canDelete = currentUser?.userType === 'ADMINISTRADOR';

  if (loading && events.length === 0) {
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
            <Calendar className="w-8 h-8 text-emooti-blue-600" />
            Agenda de Eventos
          </h1>
          <p className="text-slate-600 mt-1">
            Gestión de evaluaciones, reuniones y formaciones
          </p>
        </div>

        {canCreate && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="emooti-gradient text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Evento
          </Button>
        )}
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Eventos</p>
                <p className="text-2xl font-bold text-slate-900">{totalEvents}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Aprobados</p>
                <p className="text-2xl font-bold text-green-600">
                  {events.filter(e => e.approvalStatus === 'APPROVED').length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {events.filter(e => e.approvalStatus === 'PENDING_APPROVAL').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Seleccionados</p>
                <p className="text-2xl font-bold text-emooti-blue-600">
                  {selectedEvents.length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emooti-blue-500" />
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
            {(searchTerm || filterEventType || filterCenter || filterApprovalStatus || filterPriority) && (
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
                placeholder="Buscar por título, descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Event Type Filter */}
            <Select
              value={filterEventType || "ALL"}
              onValueChange={(value) => setFilterEventType(value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los tipos</SelectItem>
                {Object.entries(EVENT_TYPES).map(([key, { label }]) => (
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

            {/* Approval Status Filter */}
            <Select
              value={filterApprovalStatus || "ALL"}
              onValueChange={(value) => setFilterApprovalStatus(value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado de aprobación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                {Object.entries(APPROVAL_STATUS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select
              value={filterPriority || "ALL"}
              onValueChange={(value) => setFilterPriority(value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las prioridades</SelectItem>
                {Object.entries(PRIORITY).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedEvents.length > 0 && canDelete && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emooti-blue-50 border border-emooti-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-emooti-blue-900">
              {selectedEvents.length} evento(s) seleccionado(s)
            </span>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar seleccionados
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Events Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {canDelete && (
                    <th className="p-4 text-left">
                      <Checkbox
                        checked={selectedEvents.length === events.length && events.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Título</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Tipo</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Centro</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Fecha/Hora</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Ubicación</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Estado</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Prioridad</th>
                  <th className="p-4 text-right text-sm font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={canDelete ? 9 : 8} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <Calendar className="w-12 h-12 mb-3 text-slate-300" />
                        <p className="text-lg font-medium">No hay eventos disponibles</p>
                        <p className="text-sm">
                          {searchTerm || filterEventType || filterCenter || filterApprovalStatus
                            ? 'Prueba con otros filtros'
                            : 'Crea el primer evento para comenzar'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <motion.tr
                      key={event.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {canDelete && (
                        <td className="p-4">
                          <Checkbox
                            checked={selectedEvents.includes(event.id)}
                            onCheckedChange={(checked) => handleSelectEvent(event.id, checked)}
                          />
                        </td>
                      )}
                      <td className="p-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{event.title}</p>
                          {event.description && (
                            <p className="text-xs text-slate-500 line-clamp-1">{event.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={EVENT_TYPES[event.eventType]?.color || 'bg-slate-100'}>
                          {EVENT_TYPES[event.eventType]?.label || event.eventType}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-sm text-slate-900">{event.center?.name}</p>
                          <p className="text-xs text-slate-500">{event.center?.code}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-sm text-slate-900">{formatDate(event.startDate)}</p>
                          <p className="text-xs text-slate-500">
                            {formatTime(event.startDate)} - {formatTime(event.endDate)}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <MapPin className="w-3 h-3" />
                          <span className="line-clamp-1">{event.location || '-'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={APPROVAL_STATUS[event.approvalStatus]?.color || 'bg-slate-100'}>
                          {APPROVAL_STATUS[event.approvalStatus]?.label || event.approvalStatus}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={PRIORITY[event.priority]?.color || 'bg-slate-100'}>
                          {PRIORITY[event.priority]?.label || event.priority}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(event)}
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
                Mostrando {events.length} de {totalEvents} eventos
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
        <CreateAgendaEventModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadEvents();
          }}
        />
      )}

      {showEditModal && editingEvent && (
        <AgendaEventEditForm
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingEvent(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingEvent(null);
            loadEvents();
          }}
          event={editingEvent}
        />
      )}
    </div>
  );
}
