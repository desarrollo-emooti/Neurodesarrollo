import React, { useState, useEffect, useMemo } from 'react';
import { Users as UsersIcon, Plus, Download, Upload, Trash2, Edit2, Mail, Send } from 'lucide-react';
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

// User Management Components
import CreateUserModal from '@/components/users/CreateUserModal';
import UserEditForm from '@/components/users/UserEditForm';
import BulkEditModal from '@/components/users/BulkEditModal';
import UserExportModal from '@/components/users/UserExportModal';
import ImportModal from '@/components/users/ImportModal';
import SendAuthorizationModal from '@/components/users/SendAuthorizationModal';
import UserFilters from '@/components/users/UserFilters';

// API
import { apiClient } from '@/lib/api';

// Store
import useAppStore from '@/store/appStore';
import useAuthStore from '@/store/authStore';

// User Types
const USER_TYPES = {
  ADMINISTRADOR: { label: 'Administrador', color: 'bg-purple-100 text-purple-800' },
  CLINICA: { label: 'Clínica', color: 'bg-blue-100 text-blue-800' },
  ORIENTADOR: { label: 'Orientador', color: 'bg-green-100 text-green-800' },
  EXAMINADOR: { label: 'Examinador', color: 'bg-yellow-100 text-yellow-800' },
  FAMILIA: { label: 'Familia', color: 'bg-pink-100 text-pink-800' },
};

const STATUS_TYPES = {
  active: { label: 'Activo', color: 'bg-green-100 text-green-800' },
  PENDING_INVITATION: { label: 'Pendiente invitación', color: 'bg-yellow-100 text-yellow-800' },
  INVITATION_SENT: { label: 'Invitación enviada', color: 'bg-blue-100 text-blue-800' },
  inactive: { label: 'Inactivo', color: 'bg-gray-100 text-gray-800' },
};

export default function Users() {
  const { user: currentUser } = useAuthStore();
  const { setLoading } = useAppStore();

  // State
  const [users, setUsers] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLocalLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    user_types: [],
    statuses: [],
    center_ids: [],
    etapas: [],
    cursos: [],
    grupos: [],
  });

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAuthorizationModal, setShowAuthorizationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load data
  useEffect(() => {
    loadUsers();
    loadCenters();
  }, []);

  const loadUsers = async () => {
    try {
      setLocalLoading(true);
      const response = await apiClient.users.getAll();
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error al cargar usuarios');
      // Mock data for demo
      setUsers(generateMockUsers());
    } finally {
      setLocalLoading(false);
    }
  };

  const loadCenters = async () => {
    try {
      const response = await apiClient.centers.getAll();
      setCenters(response.data.data || []);
    } catch (error) {
      console.error('Error loading centers:', error);
      setCenters([
        { id: 'CTR_001', name: 'Centro Madrid' },
        { id: 'CTR_002', name: 'Centro Barcelona' },
      ]);
    }
  };

  // Mock data generator
  const generateMockUsers = () => {
    return [
      {
        id: '1',
        user_id: 'USR_001',
        full_name: 'Juan García López',
        email: 'juan.garcia@emooti.com',
        user_type: 'ADMINISTRADOR',
        status: 'active',
        phone: '+34 612 345 678',
        center_id: null,
        created_date: '2024-01-15',
      },
      {
        id: '2',
        user_id: 'USR_002',
        full_name: 'María Rodríguez Pérez',
        email: 'maria.rodriguez@clinica.com',
        user_type: 'CLINICA',
        status: 'active',
        phone: '+34 623 456 789',
        center_id: 'CTR_001',
        created_date: '2024-02-20',
      },
      {
        id: '3',
        user_id: 'USR_003',
        full_name: 'Carlos Martínez Sánchez',
        email: 'carlos.martinez@colegio.com',
        user_type: 'ORIENTADOR',
        status: 'active',
        phone: '+34 634 567 890',
        center_id: 'CTR_002',
        created_date: '2024-03-10',
      },
      {
        id: '4',
        user_id: 'USR_004',
        full_name: 'Ana Fernández Torres',
        email: 'ana.fernandez@examiner.com',
        user_type: 'EXAMINADOR',
        status: 'invitation_sent',
        phone: '+34 645 678 901',
        center_id: 'CTR_001',
        created_date: '2024-04-05',
      },
      {
        id: '5',
        user_id: 'USR_005',
        full_name: 'Pedro López Ruiz',
        email: 'pedro.lopez@gmail.com',
        user_type: 'FAMILIA',
        status: 'pending_invitation',
        phone: '+34 656 789 012',
        center_id: null,
        created_date: '2024-05-12',
      },
    ];
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          user.fullName?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.id?.toLowerCase().includes(searchLower) ||
          user.dni?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filters.user_types?.length > 0 && !filters.user_types.includes(user.userType)) {
        return false;
      }

      // Status filter
      if (filters.statuses?.length > 0 && !filters.statuses.includes(user.status)) {
        return false;
      }

      // Centers filter
      if (filters.center_ids?.length > 0) {
        const userCenters = user.centerIds || [];
        const hasMatchingCenter = filters.center_ids.some(centerId =>
          userCenters.includes(centerId)
        );
        if (!hasMatchingCenter) return false;
      }

      // Etapas filter
      if (filters.etapas?.length > 0) {
        const userEtapas = user.allowedEtapas || [];
        const hasMatchingEtapa = filters.etapas.some(etapa =>
          userEtapas.includes(etapa)
        );
        if (!hasMatchingEtapa) return false;
      }

      // Cursos filter
      if (filters.cursos?.length > 0) {
        const userCursos = user.allowedCourses || [];
        const hasMatchingCurso = filters.cursos.some(curso =>
          userCursos.includes(curso)
        );
        if (!hasMatchingCurso) return false;
      }

      // Grupos filter
      if (filters.grupos?.length > 0) {
        const userGrupos = user.allowedGroups || [];
        const hasMatchingGrupo = filters.grupos.some(grupo =>
          userGrupos.includes(grupo)
        );
        if (!hasMatchingGrupo) return false;
      }

      return true;
    });
  }, [users, filters]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Get selected user objects
  const selectedUserObjects = useMemo(() => {
    return users.filter(u => selectedUsers.includes(u.id));
  }, [users, selectedUsers]);

  // Handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedUsers(paginatedUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId, checked) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setShowCreateModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleDelete = (user) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const handleBulkEdit = () => {
    if (selectedUsers.length === 0) {
      toast.error('No hay usuarios seleccionados');
      return;
    }
    setShowBulkEditModal(true);
  };

  const handleBulkDelete = () => {
    if (selectedUsers.length === 0) {
      toast.error('No hay usuarios seleccionados');
      return;
    }
    setShowDeleteModal(true);
  };

  const handleSendAuthorizations = () => {
    if (selectedUsers.length === 0) {
      toast.error('No hay usuarios seleccionados');
      return;
    }
    setShowAuthorizationModal(true);
  };

  const confirmDelete = async () => {
    try {
      if (deletingUser) {
        await apiClient.users.delete(deletingUser.id);
        toast.success('Usuario eliminado correctamente');
        setUsers(users.filter(u => u.id !== deletingUser.id));
      } else if (selectedUsers.length > 0) {
        await apiClient.users.bulkDelete(selectedUsers);
        toast.success(`${selectedUsers.length} usuarios eliminados correctamente`);
        setUsers(users.filter(u => !selectedUsers.includes(u.id)));
        setSelectedUsers([]);
      }
      setShowDeleteModal(false);
      setDeletingUser(null);
    } catch (error) {
      console.error('Error deleting user(s):', error);
      toast.error('Error al eliminar usuario(s)');
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-blue-600" />
              Gestión de Usuarios (Miembros)
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {filteredUsers.length} usuarios encontrados
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowImportModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Button variant="outline" onClick={() => setShowExportModal(true)}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>
        </div>

        {/* Filters */}
        <UserFilters
          filters={filters}
          onFiltersChange={setFilters}
          centers={centers}
        />

        {/* Bulk Actions */}
        <AnimatePresence>
          {selectedUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-blue-900">
                    {selectedUsers.length} usuario(s) seleccionado(s)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleBulkEdit}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSendAuthorizations}>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Autorización
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, checked)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{user.id}</TableCell>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell className="text-sm text-slate-600">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={USER_TYPES[user.userType]?.color || 'bg-gray-100'}>
                          {USER_TYPES[user.userType]?.label || user.userType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_TYPES[user.status]?.color || 'bg-gray-100'}>
                          {STATUS_TYPES[user.status]?.label || user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{user.phone || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(user)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-slate-600">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} de {filteredUsers.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm font-medium">
                  Página {currentPage} de {totalPages}
                </span>
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

        {/* Modals */}

        {/* Create User Modal */}
        <CreateUserModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={async () => {
            await loadUsers();
            setShowCreateModal(false);
          }}
        />

        {/* Edit User Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>
                Modifica los datos del usuario
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              {editingUser && (
                <UserEditForm
                  user={editingUser}
                  onSave={async (userData) => {
                    try {
                      await apiClient.users.update(editingUser.id, userData);
                      toast.success('Usuario actualizado correctamente');
                      loadUsers();
                      setShowEditModal(false);
                      setEditingUser(null);
                    } catch (error) {
                      console.error('Error updating user:', error);
                      toast.error('Error al actualizar usuario');
                    }
                  }}
                  onCancel={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Edit Modal */}
        <BulkEditModal
          open={showBulkEditModal}
          onClose={() => setShowBulkEditModal(false)}
          selectedUsers={selectedUsers}
          onSuccess={() => {
            loadUsers();
            setSelectedUsers([]);
            setShowBulkEditModal(false);
          }}
        />

        {/* Export Modal */}
        <UserExportModal
          open={showExportModal}
          onClose={() => setShowExportModal(false)}
          selectedUsers={selectedUsers.length > 0 ? selectedUsers : null}
        />

        {/* Import Modal */}
        <ImportModal
          open={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            loadUsers();
            setShowImportModal(false);
          }}
        />

        {/* Send Authorization Modal */}
        <SendAuthorizationModal
          open={showAuthorizationModal}
          onClose={() => setShowAuthorizationModal(false)}
          selectedUsers={selectedUserObjects}
          onSuccess={() => {
            loadUsers();
            setSelectedUsers([]);
            setShowAuthorizationModal(false);
          }}
        />

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                {deletingUser
                  ? `¿Estás seguro de que deseas eliminar al usuario "${deletingUser.fullName}"?`
                  : `¿Estás seguro de que deseas eliminar ${selectedUsers.length} usuario(s)?`
                }
                <br />
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
