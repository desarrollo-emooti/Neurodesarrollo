import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useData } from '@/components/DataContext';
import { getStatusColor, formatDate, capitalizeWords } from '@/lib/utils';

const Users = () => {
  const { users, isLoading, loadUsers } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCenters, setSelectedCenters] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Filtrar usuarios
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_id?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCenters = selectedCenters.length === 0 || 
        selectedCenters.includes(user.center_id);

      const matchesRoles = selectedRoles.length === 0 || 
        selectedRoles.includes(user.user_type);

      const matchesStatus = selectedStatus.length === 0 || 
        selectedStatus.includes(user.status);

      return matchesSearch && matchesCenters && matchesRoles && matchesStatus;
    });
  }, [users, searchTerm, selectedCenters, selectedRoles, selectedStatus]);

  // Obtener opciones únicas para filtros
  const centerOptions = useMemo(() => {
    const centers = [...new Set(users.map(u => u.center_id).filter(Boolean))];
    return centers.map(id => ({ value: id, label: `Centro ${id}` }));
  }, [users]);

  const roleOptions = [
    { value: 'administrador', label: 'Administrador' },
    { value: 'clinica', label: 'Clínica' },
    { value: 'orientador', label: 'Orientador' },
    { value: 'examinador', label: 'Examinador' },
    { value: 'familia', label: 'Familia' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Activo' },
    { value: 'pending_invitation', label: 'Invitación Pendiente' },
    { value: 'invitation_sent', label: 'Invitación Enviada' },
    { value: 'inactive', label: 'Inactivo' }
  ];

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCenters([]);
    setSelectedRoles([]);
    setSelectedStatus([]);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
            <p className="text-gray-600">Gestiona los usuarios del sistema</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600">
            {filteredUsers.length} de {users.length} usuarios
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Crear Usuario
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Búsqueda
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Centro
              </label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedCenters[0] || ''}
                onChange={(e) => setSelectedCenters(e.target.value ? [e.target.value] : [])}
              >
                <option value="">Todos los centros</option>
                {centerOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedRoles[0] || ''}
                onChange={(e) => setSelectedRoles(e.target.value ? [e.target.value] : [])}
              >
                <option value="">Todos los roles</option>
                {roleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedStatus[0] || ''}
                onChange={(e) => setSelectedStatus(e.target.value ? [e.target.value] : [])}
              >
                <option value="">Todos los estados</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {(searchTerm || selectedCenters.length > 0 || selectedRoles.length > 0 || selectedStatus.length > 0) && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {filteredUsers.length} resultados encontrados
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones en lote */}
      {selectedUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800">
              {selectedUsers.length} usuarios seleccionados
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Enviar Email
              </Button>
              <Button variant="outline" size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Invitar
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Lista de usuarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <CardTitle className="text-lg">{user.full_name}</CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="w-4 h-4 mr-2" />
                        Enviar Email
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ID:</span>
                    <span className="text-sm font-medium">{user.user_id}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rol:</span>
                    <Badge variant="outline" className="capitalize">
                      {user.user_type}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estado:</span>
                    <Badge className={getStatusColor(user.status)}>
                      {capitalizeWords(user.status.replace('_', ' '))}
                    </Badge>
                  </div>
                  
                  {user.specialty && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Especialidad:</span>
                      <span className="text-sm font-medium">{user.specialty}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Creado:</span>
                    <span className="text-sm text-gray-500">
                      {formatDate(user.created_date, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Estado vacío */}
      {filteredUsers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron usuarios
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCenters.length > 0 || selectedRoles.length > 0 || selectedStatus.length > 0
              ? 'Intenta ajustar los filtros de búsqueda.'
              : 'No hay usuarios registrados en el sistema.'}
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Crear Primer Usuario
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default Users;

