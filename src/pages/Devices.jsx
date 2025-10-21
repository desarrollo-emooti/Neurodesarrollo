import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Smartphone,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Tablet,
  Monitor,
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
import CreateDeviceModal from '@/components/devices/CreateDeviceModal';
import DeviceEditForm from '@/components/devices/DeviceEditForm';
import DeviceReservations from '@/components/devices/DeviceReservations';

// API & Store
import { apiClient } from '@/lib/api';
import useAuthStore from '@/store/authStore';

// Constants
const DEVICE_TYPES = {
  IPAD: { label: 'iPad', color: 'bg-blue-100 text-blue-800', icon: Tablet },
  TABLET: { label: 'Tablet', color: 'bg-purple-100 text-purple-800', icon: Tablet },
  SMARTPHONE: { label: 'Smartphone', color: 'bg-green-100 text-green-800', icon: Smartphone },
  LAPTOP: { label: 'Laptop', color: 'bg-slate-100 text-slate-800', icon: Monitor },
};

const DEVICE_STATUS = {
  ACTIVO: { label: 'Activo', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  INACTIVO: { label: 'Inactivo', color: 'bg-slate-100 text-slate-800', icon: XCircle },
  MANTENIMIENTO: { label: 'Mantenimiento', color: 'bg-orange-100 text-orange-800', icon: Clock },
};

const USAGE_STATUS = {
  LIBRE: { label: 'Libre', color: 'bg-green-100 text-green-800' },
  EN_USO: { label: 'En uso', color: 'bg-blue-100 text-blue-800' },
  RESERVADO: { label: 'Reservado', color: 'bg-yellow-100 text-yellow-800' },
};

export default function Devices() {
  const { user: currentUser } = useAuthStore();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReservationsModal, setShowReservationsModal] = useState(false);
  const [selectedDeviceForReservations, setSelectedDeviceForReservations] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCenter, setFilterCenter] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUsageStatus, setFilterUsageStatus] = useState('');
  const [centers, setCenters] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDevices, setTotalDevices] = useState(0);
  const devicesPerPage = 20;

  useEffect(() => {
    loadDevices();
    loadCenters();
  }, [currentPage, searchTerm, filterType, filterCenter, filterStatus, filterUsageStatus]);

  const loadCenters = async () => {
    try {
      const response = await apiClient.centers.getAll();
      setCenters(response.data.data || []);
    } catch (error) {
      console.error('Error loading centers:', error);
    }
  };

  const loadDevices = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: devicesPerPage,
        search: searchTerm || undefined,
        type: filterType || undefined,
        centerId: filterCenter || undefined,
        status: filterStatus || undefined,
        usageStatus: filterUsageStatus || undefined,
      };

      const response = await apiClient.devices.getAll(params);
      setDevices(response.data.data || []);
      setTotalPages(response.data.meta?.totalPages || 1);
      setTotalDevices(response.data.meta?.total || 0);
    } catch (error) {
      console.error('Error loading devices:', error);
      toast.error('Error al cargar los dispositivos');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedDevices(devices.map(d => d.id));
    } else {
      setSelectedDevices([]);
    }
  };

  const handleSelectDevice = (deviceId, checked) => {
    if (checked) {
      setSelectedDevices([...selectedDevices, deviceId]);
    } else {
      setSelectedDevices(selectedDevices.filter(id => id !== deviceId));
    }
  };

  const handleEdit = (device) => {
    setEditingDevice(device);
    setShowEditModal(true);
  };

  const handleViewReservations = (device) => {
    setSelectedDeviceForReservations(device);
    setShowReservationsModal(true);
  };

  const handleDeleteSelected = async () => {
    if (selectedDevices.length === 0) {
      toast.error('No hay dispositivos seleccionados');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar ${selectedDevices.length} dispositivo(s)?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedDevices.map(id => apiClient.devices.delete(id))
      );
      toast.success('Dispositivos eliminados correctamente');
      setSelectedDevices([]);
      loadDevices();
    } catch (error) {
      console.error('Error deleting devices:', error);
      toast.error(error.response?.data?.error?.message || 'Error al eliminar dispositivos');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterCenter('');
    setFilterStatus('');
    setFilterUsageStatus('');
    setCurrentPage(1);
  };

  const getDeviceIcon = (type) => {
    const DeviceIcon = DEVICE_TYPES[type]?.icon || Smartphone;
    return <DeviceIcon className="w-4 h-4" />;
  };

  // Permission checks
  const canCreate = ['ADMINISTRADOR', 'CLINICA'].includes(currentUser?.userType);
  const canEdit = ['ADMINISTRADOR', 'CLINICA'].includes(currentUser?.userType);
  const canDelete = currentUser?.userType === 'ADMINISTRADOR';

  if (loading && devices.length === 0) {
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
            <Smartphone className="w-8 h-8 text-emooti-blue-600" />
            Gestión de Dispositivos
          </h1>
          <p className="text-slate-600 mt-1">
            Administra iPads, tablets, smartphones y laptops
          </p>
        </div>

        {canCreate && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="emooti-gradient text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Dispositivo
          </Button>
        )}
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Dispositivos</p>
                <p className="text-2xl font-bold text-slate-900">{totalDevices}</p>
              </div>
              <Smartphone className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Activos</p>
                <p className="text-2xl font-bold text-green-600">
                  {devices.filter(d => d.status === 'ACTIVO').length}
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
                <p className="text-sm text-slate-600">Libres</p>
                <p className="text-2xl font-bold text-green-600">
                  {devices.filter(d => d.usageStatus === 'LIBRE').length}
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
                <p className="text-sm text-slate-600">Seleccionados</p>
                <p className="text-2xl font-bold text-emooti-blue-600">
                  {selectedDevices.length}
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
            {(searchTerm || filterType || filterCenter || filterStatus || filterUsageStatus) && (
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
                placeholder="Buscar por nombre, serial, modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select
              value={filterType || "ALL"}
              onValueChange={(value) => setFilterType(value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de dispositivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los tipos</SelectItem>
                {Object.entries(DEVICE_TYPES).map(([key, { label }]) => (
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

            {/* Status Filter */}
            <Select
              value={filterStatus || "ALL"}
              onValueChange={(value) => setFilterStatus(value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado del dispositivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                {Object.entries(DEVICE_STATUS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Usage Status Filter */}
            <Select
              value={filterUsageStatus || "ALL"}
              onValueChange={(value) => setFilterUsageStatus(value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado de uso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los usos</SelectItem>
                {Object.entries(USAGE_STATUS).map(([key, { label }]) => (
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
      {selectedDevices.length > 0 && canDelete && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emooti-blue-50 border border-emooti-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-emooti-blue-900">
              {selectedDevices.length} dispositivo(s) seleccionado(s)
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

      {/* Devices Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {canDelete && (
                    <th className="p-4 text-left">
                      <Checkbox
                        checked={selectedDevices.length === devices.length && devices.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Nombre</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Tipo</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Serial</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Centro</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Ubicación</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Estado</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Uso</th>
                  <th className="p-4 text-right text-sm font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan={canDelete ? 9 : 8} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <Smartphone className="w-12 h-12 mb-3 text-slate-300" />
                        <p className="text-lg font-medium">No hay dispositivos disponibles</p>
                        <p className="text-sm">
                          {searchTerm || filterType || filterCenter || filterStatus
                            ? 'Prueba con otros filtros'
                            : 'Crea el primer dispositivo para comenzar'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  devices.map((device) => (
                    <motion.tr
                      key={device.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {canDelete && (
                        <td className="p-4">
                          <Checkbox
                            checked={selectedDevices.includes(device.id)}
                            onCheckedChange={(checked) => handleSelectDevice(device.id, checked)}
                          />
                        </td>
                      )}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(device.type)}
                          <div>
                            <p className="text-sm font-medium text-slate-900">{device.name}</p>
                            {device.model && (
                              <p className="text-xs text-slate-500">{device.model}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={DEVICE_TYPES[device.type]?.color || 'bg-slate-100'}>
                          {DEVICE_TYPES[device.type]?.label || device.type}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-900 font-mono">{device.serial}</p>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-sm text-slate-900">{device.center?.name}</p>
                          <p className="text-xs text-slate-500">{device.center?.code}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <MapPin className="w-3 h-3" />
                          <span className="line-clamp-1">{device.location || '-'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={DEVICE_STATUS[device.status]?.color || 'bg-slate-100'}>
                          {DEVICE_STATUS[device.status]?.label || device.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={USAGE_STATUS[device.usageStatus]?.color || 'bg-slate-100'}>
                          {USAGE_STATUS[device.usageStatus]?.label || device.usageStatus}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewReservations(device)}
                            title="Ver reservas"
                          >
                            <Calendar className="w-4 h-4" />
                          </Button>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(device)}
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
                Mostrando {devices.length} de {totalDevices} dispositivos
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
        <CreateDeviceModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadDevices();
          }}
        />
      )}

      {showEditModal && editingDevice && (
        <DeviceEditForm
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingDevice(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingDevice(null);
            loadDevices();
          }}
          device={editingDevice}
        />
      )}

      {showReservationsModal && selectedDeviceForReservations && (
        <DeviceReservations
          open={showReservationsModal}
          onClose={() => {
            setShowReservationsModal(false);
            setSelectedDeviceForReservations(null);
          }}
          device={selectedDeviceForReservations}
        />
      )}
    </div>
  );
}
