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
  UserPlus,
  GraduationCap,
  Building2,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useData } from '@/components/DataContext';
import { getStatusColor, formatDate, capitalizeWords, calculateAge } from '@/lib/utils';

const Students = () => {
  const { students, centers, isLoading, loadStudents } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCenters, setSelectedCenters] = useState([]);
  const [selectedEtapas, setSelectedEtapas] = useState([]);
  const [selectedConsent, setSelectedConsent] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Filtrar estudiantes
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = !searchTerm || 
        student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nia?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCenters = selectedCenters.length === 0 || 
        selectedCenters.includes(student.center_id);

      const matchesEtapas = selectedEtapas.length === 0 || 
        selectedEtapas.includes(student.etapa);

      const matchesConsent = selectedConsent.length === 0 || 
        selectedConsent.includes(student.consent_given);

      return matchesSearch && matchesCenters && matchesEtapas && matchesConsent;
    });
  }, [students, searchTerm, selectedCenters, selectedEtapas, selectedConsent]);

  // Obtener opciones únicas para filtros
  const centerOptions = useMemo(() => {
    return centers.map(center => ({ 
      value: center.id, 
      label: center.name 
    }));
  }, [centers]);

  const etapaOptions = [
    { value: 'Educación Infantil', label: 'Educación Infantil' },
    { value: 'Educación Primaria', label: 'Educación Primaria' },
    { value: 'ESO', label: 'ESO' },
    { value: 'Bachillerato', label: 'Bachillerato' },
    { value: 'Formación Profesional', label: 'Formación Profesional' }
  ];

  const consentOptions = [
    { value: 'Sí', label: 'Sí' },
    { value: 'No', label: 'No' },
    { value: 'Pendiente', label: 'Pendiente' },
    { value: 'N/A', label: 'N/A' }
  ];

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCenters([]);
    setSelectedEtapas([]);
    setSelectedConsent([]);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alumnos</h1>
            <p className="text-gray-600">Gestiona los alumnos del sistema</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Alumnos</h1>
          <p className="text-gray-600">
            {filteredStudents.length} de {students.length} alumnos
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
            Crear Alumno
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
                  placeholder="Buscar por nombre, ID, NIA..."
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
                Etapa
              </label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedEtapas[0] || ''}
                onChange={(e) => setSelectedEtapas(e.target.value ? [e.target.value] : [])}
              >
                <option value="">Todas las etapas</option>
                {etapaOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consentimiento
              </label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedConsent[0] || ''}
                onChange={(e) => setSelectedConsent(e.target.value ? [e.target.value] : [])}
              >
                <option value="">Todos los estados</option>
                {consentOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {(searchTerm || selectedCenters.length > 0 || selectedEtapas.length > 0 || selectedConsent.length > 0) && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {filteredStudents.length} resultados encontrados
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones en lote */}
      {selectedStudents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800">
              {selectedStudents.length} alumnos seleccionados
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Enviar Autorización
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Editar en Lote
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Lista de alumnos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => {
          const center = centers.find(c => c.id === student.center_id);
          const age = calculateAge(student.birth_date);
          
          return (
            <motion.div
              key={student.id}
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
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <CardTitle className="text-lg">{student.full_name}</CardTitle>
                        <CardDescription>{student.student_id}</CardDescription>
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
                          Enviar Autorización
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Vincular Familia
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
                    {student.nia && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">NIA:</span>
                        <span className="text-sm font-medium">{student.nia}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Edad:</span>
                      <span className="text-sm font-medium">
                        {age ? `${age} años` : 'No especificada'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Etapa:</span>
                      <Badge variant="outline">
                        {student.etapa}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Curso:</span>
                      <span className="text-sm font-medium">
                        {student.course} {student.class_group && `• ${student.class_group}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Centro:</span>
                      <div className="flex items-center space-x-1">
                        <Building2 className="h-3 w-3 text-gray-400" />
                        <span className="text-sm font-medium truncate max-w-32">
                          {center?.name || 'Sin centro'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Consentimiento:</span>
                      <Badge className={getStatusColor(student.consent_given)}>
                        {student.consent_given}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Creado:</span>
                      <span className="text-sm text-gray-500">
                        {formatDate(student.created_date, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Estado vacío */}
      {filteredStudents.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <GraduationCap className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron alumnos
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCenters.length > 0 || selectedEtapas.length > 0 || selectedConsent.length > 0
              ? 'Intenta ajustar los filtros de búsqueda.'
              : 'No hay alumnos registrados en el sistema.'}
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Crear Primer Alumno
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default Students;

