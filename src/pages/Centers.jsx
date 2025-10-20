import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Plus, Download, Upload, Trash2, Edit2, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Center Components
import CreateCenterModal from '@/components/centers/CreateCenterModal';
import CenterEditForm from '@/components/centers/CenterEditForm';

// API
import { apiClient } from '@/lib/api';

// Store
import useAppStore from '@/store/appStore';
import useAuthStore from '@/store/authStore';

// Center Types
const CENTER_TYPES = {
  PUBLICO: { label: 'Público', color: 'bg-blue-100 text-blue-800' },
  CONCERTADO: { label: 'Concertado', color: 'bg-purple-100 text-purple-800' },
  PRIVADO: { label: 'Privado', color: 'bg-green-100 text-green-800' },
};

export default function Centers() {
  const { user: currentUser } = useAuthStore();
  const { setLoading } = useAppStore();

  // State
  const [centers, setCenters] = useState([]);
  const [loading, setLocalLoading] = useState(true);
  const [selectedCenters, setSelectedCenters] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    province: '',
    autonomousCommunity: '',
  });

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [deletingCenter, setDeletingCenter] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load data
  useEffect(() => {
    loadCenters();
  }, []);

  const loadCenters = async () => {
    try {
      setLocalLoading(true);
      const response = await apiClient.centers.getAll();
      setCenters(response.data.data || []);
    } catch (error) {
      console.error('Error loading centers:', error);
      toast.error('Error al cargar centros');
    } finally {
      setLocalLoading(false);
    }
  };

  // Filtered centers
  const filteredCenters = useMemo(() => {
    return centers.filter(center => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          center.name?.toLowerCase().includes(searchLower) ||
          center.code?.toLowerCase().includes(searchLower) ||
          center.city?.toLowerCase().includes(searchLower) ||
          center.responsable?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Type filter
      if (filters.type && center.type !== filters.type) {
        return false;
      }

      // Province filter
      if (filters.province && center.province !== filters.province) {
        return false;
      }

      // Autonomous Community filter
      if (filters.autonomousCommunity && center.autonomousCommunity !== filters.autonomousCommunity) {
        return false;
      }

      return true;
    });
  }, [centers, filters]);

  // Paginated centers
  const paginatedCenters = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCenters.slice(startIndex, endIndex);
  }, [filteredCenters, currentPage]);

  const totalPages = Math.ceil(filteredCenters.length / itemsPerPage);

  // Handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedCenters(paginatedCenters.map(c => c.id));
    } else {
      setSelectedCenters([]);
    }
  };

  const handleSelectCenter = (centerId, checked) => {
    if (checked) {
      setSelectedCenters([...selectedCenters, centerId]);
    } else {
      setSelectedCenters(selectedCenters.filter(id => id !== centerId));
    }
  };

  const handleEdit = (center) => {
    setEditingCenter(center);
    setShowEditModal(true);
  };

  const handleDelete = (center) => {
    setDeletingCenter(center);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await apiClient.centers.delete(deletingCenter.id);
      toast.success('Centro eliminado correctamente');
      loadCenters();
      setShowDeleteModal(false);
      setDeletingCenter(null);
    } catch (error) {
      console.error('Error deleting center:', error);
      toast.error('Error al eliminar centro');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCenters.length === 0) {
      toast.error('No hay centros seleccionados');
      return;
    }

    try {
      await Promise.all(
        selectedCenters.map(id => apiClient.centers.delete(id))
      );
      toast.success(`${selectedCenters.length} centros eliminados`);
      setSelectedCenters([]);
      loadCenters();
    } catch (error) {
      console.error('Error bulk deleting centers:', error);
      toast.error('Error al eliminar centros');
    }
  };

  // Get unique values for filters
  const uniqueProvinces = useMemo(() => {
    return [...new Set(centers.map(c => c.province).filter(Boolean))];
  }, [centers]);

  const uniqueCommunities = useMemo(() => {
    return [...new Set(centers.map(c => c.autonomousCommunity).filter(Boolean))];
  }, [centers]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-8 h-8 text-emooti-blue-600" />
            Gestión de Centros
          </h1>
          <p className="text-slate-600 mt-1">
            {filteredCenters.length} centros encontrados
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser?.userType === 'ADMINISTRADOR' && (
            <>
              <Button
                variant="outline"
                onClick={() => toast.info('Función de importación en desarrollo')}
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </Button>
              <Button
                variant="outline"
                onClick={() => toast.info('Función de exportación en desarrollo')}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="emooti-gradient text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Centro
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Buscar
            </label>
            <Input
              placeholder="Nombre, código, ciudad..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Tipo de Centro
            </label>
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters({ ...filters, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los tipos</SelectItem>
                <SelectItem value="PUBLICO">Público</SelectItem>
                <SelectItem value="CONCERTADO">Concertado</SelectItem>
                <SelectItem value="PRIVADO">Privado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Provincia
            </label>
            <Select
              value={filters.province}
              onValueChange={(value) => setFilters({ ...filters, province: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las provincias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las provincias</SelectItem>
                {uniqueProvinces.map(province => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Comunidad Autónoma
            </label>
            <Select
              value={filters.autonomousCommunity}
              onValueChange={(value) => setFilters({ ...filters, autonomousCommunity: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las comunidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las comunidades</SelectItem>
                {uniqueCommunities.map(community => (
                  <SelectItem key={community} value={community}>
                    {community}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedCenters.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emooti-blue-50 border border-emooti-blue-200 rounded-lg p-4 flex items-center justify-between"
        >
          <span className="text-sm text-emooti-blue-900">
            {selectedCenters.length} centros seleccionados
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar seleccionados
            </Button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedCenters.length === paginatedCenters.length && paginatedCenters.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estudiantes</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCenters.map((center) => (
              <TableRow key={center.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedCenters.includes(center.id)}
                    onCheckedChange={(checked) => handleSelectCenter(center.id, checked)}
                  />
                </TableCell>
                <TableCell className="font-medium">{center.code}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{center.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={CENTER_TYPES[center.type]?.color}>
                    {CENTER_TYPES[center.type]?.label || center.type}
                  </Badge>
                </TableCell>
                <TableCell>{center.responsable || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <MapPin className="w-3 h-3" />
                    {center.city}, {center.province}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm space-y-1">
                    {center.phone && (
                      <div className="flex items-center gap-1 text-slate-600">
                        <Phone className="w-3 h-3" />
                        {center.phone}
                      </div>
                    )}
                    {center.email && (
                      <div className="text-slate-600">{center.email}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {center._count?.students || 0}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(center)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    {currentUser?.userType === 'ADMINISTRADOR' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(center)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Empty State */}
        {filteredCenters.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No se encontraron centros
            </h3>
            <p className="text-slate-600">
              Intenta ajustar los filtros o crea un nuevo centro.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t p-4">
            <div className="text-sm text-slate-600">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredCenters.length)} de {filteredCenters.length} centros
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el centro "{deletingCenter?.name}"?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create and Edit Modals */}
      <CreateCenterModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadCenters}
      />

      <CenterEditForm
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadCenters}
        center={editingCenter}
      />
    </div>
  );
}
