import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  BarChart3,
  FileCheck,
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
import CreateTestResultModal from '@/components/testResults/CreateTestResultModal';
import TestResultEditForm from '@/components/testResults/TestResultEditForm';

// API & Store
import { apiClient } from '@/lib/api';
import useAuthStore from '@/store/authStore';

// Constants
const INTERPRETATION_OPTIONS = {
  MUY_BAJO: { label: 'Muy Bajo', color: 'bg-red-100 text-red-800' },
  BAJO: { label: 'Bajo', color: 'bg-orange-100 text-orange-800' },
  MEDIO_BAJO: { label: 'Medio-Bajo', color: 'bg-yellow-100 text-yellow-800' },
  MEDIO: { label: 'Medio', color: 'bg-blue-100 text-blue-800' },
  MEDIO_ALTO: { label: 'Medio-Alto', color: 'bg-indigo-100 text-indigo-800' },
  ALTO: { label: 'Alto', color: 'bg-green-100 text-green-800' },
  MUY_ALTO: { label: 'Muy Alto', color: 'bg-emerald-100 text-emerald-800' },
};

const IMPORT_SOURCE_OPTIONS = {
  MANUAL: { label: 'Manual', color: 'bg-slate-100 text-slate-800' },
  PDF_IMPORT: { label: 'Importación PDF', color: 'bg-purple-100 text-purple-800' },
  BULK_IMPORT: { label: 'Importación Masiva', color: 'bg-cyan-100 text-cyan-800' },
  API: { label: 'API', color: 'bg-pink-100 text-pink-800' },
};

const ETAPAS = [
  { value: 'EDUCACION_INFANTIL', label: 'Educación Infantil' },
  { value: 'EDUCACION_PRIMARIA', label: 'Educación Primaria' },
  { value: 'ESO', label: 'ESO' },
  { value: 'BACHILLERATO', label: 'Bachillerato' },
  { value: 'FORMACION_PROFESIONAL', label: 'Formación Profesional' },
];

export default function TestResults() {
  const { user: currentUser } = useAuthStore();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResults, setSelectedResults] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingResult, setEditingResult] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEtapa, setFilterEtapa] = useState('');
  const [filterCenter, setFilterCenter] = useState('');
  const [filterValidated, setFilterValidated] = useState('');
  const [filterInterpretation, setFilterInterpretation] = useState('');
  const [filterImportSource, setFilterImportSource] = useState('');
  const [centers, setCenters] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const resultsPerPage = 20;

  useEffect(() => {
    loadResults();
    loadCenters();
  }, [currentPage, searchTerm, filterEtapa, filterCenter, filterValidated, filterInterpretation, filterImportSource]);

  const loadCenters = async () => {
    try {
      const response = await apiClient.centers.getAll();
      setCenters(response.data.data || []);
    } catch (error) {
      console.error('Error loading centers:', error);
    }
  };

  const loadResults = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: resultsPerPage,
        search: searchTerm || undefined,
        etapa: filterEtapa || undefined,
        centerId: filterCenter || undefined,
        validated: filterValidated ? filterValidated === 'true' : undefined,
        interpretation: filterInterpretation || undefined,
        importSource: filterImportSource || undefined,
      };

      const response = await apiClient.testResults.getAll(params);
      setResults(response.data.data || []);
      setTotalPages(response.data.meta?.totalPages || 1);
      setTotalResults(response.data.meta?.total || 0);
    } catch (error) {
      console.error('Error loading test results:', error);
      toast.error('Error al cargar los resultados de pruebas');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedResults(results.map(r => r.id));
    } else {
      setSelectedResults([]);
    }
  };

  const handleSelectResult = (resultId, checked) => {
    if (checked) {
      setSelectedResults([...selectedResults, resultId]);
    } else {
      setSelectedResults(selectedResults.filter(id => id !== resultId));
    }
  };

  const handleEdit = (result) => {
    setEditingResult(result);
    setShowEditModal(true);
  };

  const handleDeleteSelected = async () => {
    if (selectedResults.length === 0) {
      toast.error('No hay resultados seleccionados');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar ${selectedResults.length} resultado(s)?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedResults.map(id => apiClient.testResults.delete(id))
      );
      toast.success('Resultados eliminados correctamente');
      setSelectedResults([]);
      loadResults();
    } catch (error) {
      console.error('Error deleting results:', error);
      toast.error('Error al eliminar resultados');
    }
  };

  const handleValidate = async (resultId, validated) => {
    try {
      await apiClient.testResults.validate(resultId, { validated });
      toast.success(validated ? 'Resultado validado' : 'Validación retirada');
      loadResults();
    } catch (error) {
      console.error('Error validating result:', error);
      toast.error('Error al validar resultado');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterEtapa('');
    setFilterCenter('');
    setFilterValidated('');
    setFilterInterpretation('');
    setFilterImportSource('');
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

  const getPercentileColor = (percentile) => {
    if (!percentile) return 'text-slate-500';
    if (percentile >= 75) return 'text-green-600 font-semibold';
    if (percentile >= 50) return 'text-blue-600';
    if (percentile >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Permission checks
  const canCreate = ['ADMINISTRADOR', 'CLINICA', 'EXAMINADOR'].includes(currentUser?.userType);
  const canEdit = ['ADMINISTRADOR', 'CLINICA', 'EXAMINADOR'].includes(currentUser?.userType);
  const canDelete = currentUser?.userType === 'ADMINISTRADOR';
  const canValidate = ['ADMINISTRADOR', 'CLINICA'].includes(currentUser?.userType);

  if (loading && results.length === 0) {
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
            Resultados de Pruebas
          </h1>
          <p className="text-slate-600 mt-1">
            Gestión de resultados de evaluaciones y tests
          </p>
        </div>

        {canCreate && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="emooti-gradient text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Resultado
          </Button>
        )}
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Resultados</p>
                <p className="text-2xl font-bold text-slate-900">{totalResults}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Validados</p>
                <p className="text-2xl font-bold text-green-600">
                  {results.filter(r => r.validated).length}
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
                  {results.filter(r => !r.validated).length}
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
                  {selectedResults.length}
                </p>
              </div>
              <FileCheck className="w-8 h-8 text-emooti-blue-500" />
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
            {(searchTerm || filterEtapa || filterCenter || filterValidated || filterInterpretation || filterImportSource) && (
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
                placeholder="Buscar por prueba, estudiante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Etapa Filter */}
            <Select
              value={filterEtapa || "ALL"}
              onValueChange={(value) => setFilterEtapa(value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las etapas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las etapas</SelectItem>
                {ETAPAS.map((etapa) => (
                  <SelectItem key={etapa.value} value={etapa.value}>
                    {etapa.label}
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

            {/* Validated Filter */}
            <Select
              value={filterValidated || "ALL"}
              onValueChange={(value) => setFilterValidated(value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado de validación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="true">Validados</SelectItem>
                <SelectItem value="false">No validados</SelectItem>
              </SelectContent>
            </Select>

            {/* Interpretation Filter */}
            <Select
              value={filterInterpretation || "ALL"}
              onValueChange={(value) => setFilterInterpretation(value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Interpretación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                {Object.entries(INTERPRETATION_OPTIONS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Import Source Filter */}
            <Select
              value={filterImportSource || "ALL"}
              onValueChange={(value) => setFilterImportSource(value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Origen de datos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {Object.entries(IMPORT_SOURCE_OPTIONS).map(([key, { label }]) => (
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
      {selectedResults.length > 0 && canDelete && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emooti-blue-50 border border-emooti-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-emooti-blue-900">
              {selectedResults.length} resultado(s) seleccionado(s)
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

      {/* Results Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {canDelete && (
                    <th className="p-4 text-left">
                      <Checkbox
                        checked={selectedResults.length === results.length && results.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">ID</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Estudiante</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Prueba</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Fecha</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Percentil</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Interpretación</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Validado</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">Origen</th>
                  <th className="p-4 text-right text-sm font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={canDelete ? 10 : 9} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <FileText className="w-12 h-12 mb-3 text-slate-300" />
                        <p className="text-lg font-medium">No hay resultados disponibles</p>
                        <p className="text-sm">
                          {searchTerm || filterEtapa || filterCenter || filterValidated
                            ? 'Prueba con otros filtros'
                            : 'Crea el primer resultado para comenzar'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  results.map((result) => (
                    <motion.tr
                      key={result.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {canDelete && (
                        <td className="p-4">
                          <Checkbox
                            checked={selectedResults.includes(result.id)}
                            onCheckedChange={(checked) => handleSelectResult(result.id, checked)}
                          />
                        </td>
                      )}
                      <td className="p-4">
                        <span className="text-sm font-mono text-slate-600">
                          {result.resultId}
                        </span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {result.student?.fullName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {result.student?.studentId} • {result.student?.center?.name}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {result.testName}
                          </p>
                          {result.testCode && (
                            <p className="text-xs text-slate-500 font-mono">{result.testCode}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-600">
                          {formatDate(result.executionDate)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-sm font-semibold ${getPercentileColor(result.percentile)}`}>
                          {result.percentile ? `P${result.percentile}` : '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        {result.interpretation ? (
                          <Badge className={INTERPRETATION_OPTIONS[result.interpretation]?.color || 'bg-slate-100'}>
                            {INTERPRETATION_OPTIONS[result.interpretation]?.label || result.interpretation}
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {canValidate ? (
                          <button
                            onClick={() => handleValidate(result.id, !result.validated)}
                            className="inline-flex items-center"
                          >
                            {result.validated ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Validado
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Pendiente
                              </Badge>
                            )}
                          </button>
                        ) : (
                          result.validated ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Validado
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Pendiente
                            </Badge>
                          )
                        )}
                      </td>
                      <td className="p-4">
                        {result.importSource ? (
                          <Badge className={IMPORT_SOURCE_OPTIONS[result.importSource]?.color || 'bg-slate-100'}>
                            {IMPORT_SOURCE_OPTIONS[result.importSource]?.label || result.importSource}
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(result)}
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
                Mostrando {results.length} de {totalResults} resultados
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
        <CreateTestResultModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadResults();
          }}
        />
      )}

      {showEditModal && editingResult && (
        <TestResultEditForm
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingResult(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingResult(null);
            loadResults();
          }}
          result={editingResult}
        />
      )}
    </div>
  );
}
