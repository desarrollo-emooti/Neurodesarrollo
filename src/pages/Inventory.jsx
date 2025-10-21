import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Monitor,
  Armchair,
  Gift,
  ClipboardCheck,
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
import CreateInventoryModal from '@/components/inventory/CreateInventoryModal';
import InventoryEditForm from '@/components/inventory/InventoryEditForm';

// API & Store
import { apiClient } from '@/lib/api';
import useAuthStore from '@/store/authStore';

// Constants
const INVENTORY_CATEGORIES = {
  INFORMATICA: { label: 'Informática', color: 'bg-blue-100 text-blue-800', icon: Monitor },
  MOBILIARIO: { label: 'Mobiliario', color: 'bg-purple-100 text-purple-800', icon: Armchair },
  PROMOCIONAL: { label: 'Promocional', color: 'bg-green-100 text-green-800', icon: Gift },
  PRUEBAS: { label: 'Pruebas', color: 'bg-orange-100 text-orange-800', icon: ClipboardCheck },
};

const INVENTORY_STATUS = {
  LIBRE: { label: 'Libre', color: 'bg-green-100 text-green-800' },
  OCUPADO: { label: 'Ocupado', color: 'bg-blue-100 text-blue-800' },
  REPARACION: { label: 'Reparación', color: 'bg-red-100 text-red-800' },
};

export default function Inventory() {
  const { user: currentUser } = useAuthStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStockControl, setFilterStockControl] = useState('');
  const [locations, setLocations] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    loadItems();
  }, [currentPage, searchTerm, filterCategory, filterStatus, filterLocation, filterStockControl]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        category: filterCategory || undefined,
        status: filterStatus || undefined,
        location: filterLocation || undefined,
        stockControlEnabled: filterStockControl || undefined,
      };

      const response = await apiClient.inventory.getAll(params);
      const itemsData = response.data.data || [];
      setItems(itemsData);
      setTotalPages(response.data.meta?.totalPages || 1);
      setTotalItems(response.data.meta?.total || 0);

      // Extract unique locations
      const uniqueLocations = [...new Set(itemsData.map(item => item.location).filter(Boolean))];
      setLocations(uniqueLocations);
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast.error('Error al cargar el inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(items.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId, checked) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      toast.error('No hay items seleccionados');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar ${selectedItems.length} item(s)?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedItems.map(id => apiClient.inventory.delete(id))
      );
      toast.success('Items eliminados correctamente');
      setSelectedItems([]);
      loadItems();
    } catch (error) {
      console.error('Error deleting items:', error);
      toast.error(error.response?.data?.error?.message || 'Error al eliminar items');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterStatus('');
    setFilterLocation('');
    setFilterStockControl('');
    setCurrentPage(1);
  };

  const getCategoryIcon = (category) => {
    const CategoryIcon = INVENTORY_CATEGORIES[category]?.icon || Package;
    return <CategoryIcon className="w-4 h-4" />;
  };

  const getLowStockCount = () => {
    return items.filter(item =>
      item.stockControlEnabled &&
      item.stock !== null &&
      item.stockMinimo !== null &&
      item.stock < item.stockMinimo
    ).length;
  };

  // Permission checks
  const canCreate = ['ADMINISTRADOR', 'CLINICA'].includes(currentUser?.userType);
  const canEdit = ['ADMINISTRADOR', 'CLINICA'].includes(currentUser?.userType);
  const canDelete = currentUser?.userType === 'ADMINISTRADOR';

  if (loading && items.length === 0) {
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
            <Package className="w-8 h-8 text-emooti-blue-600" />
            Gestión de Inventario
          </h1>
          <p className="text-slate-600 mt-1">
            Administra el inventario de equipos y materiales
          </p>
        </div>

        {canCreate && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="emooti-gradient text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Item
          </Button>
        )}
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Items</p>
                <p className="text-2xl font-bold text-slate-900">{totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Libres</p>
                <p className="text-2xl font-bold text-green-600">
                  {items.filter(item => item.status === 'LIBRE').length}
                </p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-orange-600">
                  {getLowStockCount()}
                </p>
              </div>
              <Package className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Seleccionados</p>
                <p className="text-2xl font-bold text-emooti-blue-600">
                  {selectedItems.length}
                </p>
              </div>
              <Package className="w-8 h-8 text-emooti-blue-500" />
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
            {(searchTerm || filterCategory || filterStatus || filterLocation || filterStockControl) && (
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
                placeholder="Buscar por código, nombre, proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select
              value={filterCategory || "ALL"}
              onValueChange={(value) => setFilterCategory(value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las categorías</SelectItem>
                {Object.entries(INVENTORY_CATEGORIES).map(([key, { label }]) => (
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
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                {Object.entries(INVENTORY_STATUS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Location Filter */}
            <Select
              value={filterLocation || "ALL"}
              onValueChange={(value) => setFilterLocation(value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las ubicaciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las ubicaciones</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Stock Control Filter */}
            <Select
              value={filterStockControl || "ALL"}
              onValueChange={(value) => setFilterStockControl(value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Control de stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="true">Con control de stock</SelectItem>
                <SelectItem value="false">Sin control de stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && canDelete && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emooti-blue-50 border border-emooti-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-emooti-blue-900">
              {selectedItems.length} item(s) seleccionado(s)
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

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {canDelete && (
                    <th className="p-4 text-left">
                      <Checkbox
                        checked={selectedItems.length === items.length && items.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Código</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Nombre</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Categoría</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Tipo</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Stock</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Estado</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Ubicación</th>
                  <th className="p-4 text-right text-sm font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={canDelete ? 9 : 8} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <Package className="w-12 h-12 mb-3 text-slate-300" />
                        <p className="text-lg font-medium">No hay items disponibles</p>
                        <p className="text-sm">
                          {searchTerm || filterCategory || filterStatus || filterLocation
                            ? 'Prueba con otros filtros'
                            : 'Crea el primer item para comenzar'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {canDelete && (
                        <td className="p-4">
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={(checked) => handleSelectItem(item.id, checked)}
                          />
                        </td>
                      )}
                      <td className="p-4">
                        <p className="text-sm font-medium text-slate-900 font-mono">{item.code}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(item.category)}
                          <div>
                            <p className="text-sm font-medium text-slate-900">{item.name}</p>
                            {item.inventoryNumber && (
                              <p className="text-xs text-slate-500">#{item.inventoryNumber}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={INVENTORY_CATEGORIES[item.category]?.color || 'bg-slate-100'}>
                          {INVENTORY_CATEGORIES[item.category]?.label || item.category}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-900">{item.itemType || '-'}</p>
                      </td>
                      <td className="p-4">
                        {item.stockControlEnabled ? (
                          <div className="text-sm">
                            <span className={`font-medium ${
                              item.stock < item.stockMinimo ? 'text-red-600' : 'text-slate-900'
                            }`}>
                              {item.stock}
                            </span>
                            <span className="text-slate-500"> / {item.stockMinimo}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge className={INVENTORY_STATUS[item.status]?.color || 'bg-slate-100'}>
                          {INVENTORY_STATUS[item.status]?.label || item.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-900 line-clamp-1">{item.location || '-'}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
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
                Mostrando {items.length} de {totalItems} items
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
        <CreateInventoryModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadItems();
          }}
        />
      )}

      {showEditModal && editingItem && (
        <InventoryEditForm
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingItem(null);
            loadItems();
          }}
          item={editingItem}
        />
      )}
    </div>
  );
}
