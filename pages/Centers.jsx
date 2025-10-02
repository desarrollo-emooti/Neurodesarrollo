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
  MapPin,
  Building2,
  Users,
  Phone,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useData } from '@/components/DataContext';
import { getStatusColor, formatDate, capitalizeWords } from '@/lib/utils';

const Centers = () => {
  const { centers, students, isLoading, loadCenters } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedProvinces, setSelectedProvinces] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' o 'table'

  // Filtrar centros
  const filteredCenters = useMemo(() => {
    return centers.filter(center => {
      const matchesSearch = !searchTerm || 
        center.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        center.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        center.city?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTypes = selectedTypes.length === 0 || 
        selectedTypes.includes(center.type);

      const matchesProvinces = selectedProvinces.length === 0 || 
        selectedProvinces.includes(center.province);

      const matchesStatus = selectedStatus.length === 0 || 
        selectedStatus.includes(center.active ? 'active' : 'inactive');

      return matchesSearch && matchesTypes && matchesProvinces && matchesStatus;
    });
  }, [centers, searchTerm, selectedTypes, selectedProvinces, selectedStatus]);

  // Obtener opciones únicas para filtros
  const typeOptions = [
    { value: 'publico', label: 'Público' },
    { value: 'concertado', label: 'Concertado' },
    { value: 'privado', label: 'Privado' }
  ];

  const provinceOptions = useMemo(() => {
    const provinces = [...new Set(centers.map(c => c.province).filter(Boolean))];
    return provinces.map(province => ({ value: province, label: province }));
  }, [centers]);

  const statusOptions = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' }
  ];

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTypes([]);
    setSelectedProvinces([]);
    setSelectedStatus([]);
  };

  // Contar estudiantes por centro
  const getStudentCount = (centerId) => {
    return students.filter(s => s.center_id === centerId).length;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Centros</h1>
            <p className="text-gray-600">Gestiona los centros educativos</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Centros</h1>
          <p className="text-gray-600">
            {filteredCenters.length} de {centers.length} centros
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Button 
              variant={viewMode === 'cards' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('cards')}
            >
              Cards
            </Button>
            <Button 
              variant={viewMode === 'table' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('table')}
            >
              Tabla
            </Button>
          </div>
          <Button variant="outline" size="sm">
            <MapPin className="w-4 h-4 mr-2" />
            Mapa
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Crear Centro
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
                  placeholder="Buscar por nombre, código, ciudad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedTypes[0] || ''}
                onChange={(e) => setSelectedTypes(e.target.value ? [e.target.value] : [])}
              >
                <option value="">Todos los tipos</option>
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provincia
              </label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedProvinces[0] || ''}
                onChange={(e) => setSelectedProvinces(e.target.value ? [e.target.value] : [])}
              >
                <option value="">Todas las provincias</option>
                {provinceOptions.map(option => (
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
          
          {(searchTerm || selectedTypes.length > 0 || selectedProvinces.length > 0 || selectedStatus.length > 0) && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {filteredCenters.length} resultados encontrados
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de centros */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCenters.map((center) => {
            const studentCount = getStudentCount(center.id);
            
            return (
              <motion.div
                key={center.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{center.name}</CardTitle>
                          <CardDescription>{center.code}</CardDescription>
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
                            <MapPin className="w-4 h-4 mr-2" />
                            Ver en Mapa
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Users className="w-4 h-4 mr-2" />
                            Ver Alumnos
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
                        <span className="text-sm text-gray-600">Tipo:</span>
                        <Badge variant="outline" className="capitalize">
                          {center.type}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Ubicación:</span>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-sm font-medium">
                            {center.city}, {center.province}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Alumnos:</span>
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span className="text-sm font-medium">
                            {studentCount} / {center.total_students || 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      {center.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Teléfono:</span>
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-sm font-medium">{center.phone}</span>
                          </div>
                        </div>
                      )}
                      
                      {center.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Email:</span>
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-sm font-medium truncate max-w-32">
                              {center.email}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Estado:</span>
                        <Badge className={getStatusColor(center.active ? 'active' : 'inactive')}>
                          {center.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Creado:</span>
                        <span className="text-sm text-gray-500">
                          {formatDate(center.created_date, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Centro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alumnos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCenters.map((center) => {
                    const studentCount = getStudentCount(center.id);
                    
                    return (
                      <tr key={center.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {center.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {center.code}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="capitalize">
                            {center.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {center.city}, {center.province}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {studentCount} / {center.total_students || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(center.active ? 'active' : 'inactive')}>
                            {center.active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                                <MapPin className="w-4 h-4 mr-2" />
                                Ver en Mapa
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Users className="w-4 h-4 mr-2" />
                                Ver Alumnos
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado vacío */}
      {filteredCenters.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Building2 className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron centros
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedTypes.length > 0 || selectedProvinces.length > 0 || selectedStatus.length > 0
              ? 'Intenta ajustar los filtros de búsqueda.'
              : 'No hay centros registrados en el sistema.'}
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Crear Primer Centro
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default Centers;

