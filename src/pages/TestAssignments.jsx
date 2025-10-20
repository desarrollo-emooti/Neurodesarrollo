import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Plus, Download, Upload, Trash2, Edit2, Calendar, QrCode, CheckCircle2, XCircle, Clock } from 'lucide-react';
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

// Test Assignment Components
import CreateTestAssignmentModal from '@/components/testAssignments/CreateTestAssignmentModal';
import TestAssignmentEditForm from '@/components/testAssignments/TestAssignmentEditForm';

// API
import { apiClient } from '@/lib/api';

// Store
import useAppStore from '@/store/appStore';
import useAuthStore from '@/store/authStore';

// Test Status Constants
const TEST_STATUS = {
  SI: { label: 'Completada', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  NO: { label: 'No realizada', color: 'bg-red-100 text-red-800', icon: XCircle },
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  NA: { label: 'N/A', color: 'bg-gray-100 text-gray-800', icon: null },
};

const PRIORITY = {
  BAJA: { label: 'Baja', color: 'bg-slate-100 text-slate-800' },
  MEDIA: { label: 'Media', color: 'bg-blue-100 text-blue-800' },
  ALTA: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  URGENTE: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
};

const CONSENT_STATUS = {
  SI: { label: 'Sí', color: 'bg-green-100 text-green-800' },
  NO: { label: 'No', color: 'bg-red-100 text-red-800' },
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  NA: { label: 'N/A', color: 'bg-gray-100 text-gray-800' },
};

const ETAPAS = {
  EDUCACION_INFANTIL: 'Educación Infantil',
  EDUCACION_PRIMARIA: 'Educación Primaria',
  ESO: 'ESO',
  BACHILLERATO: 'Bachillerato',
  FORMACION_PROFESIONAL: 'Formación Profesional',
};

export default function TestAssignments() {
  const { user: currentUser } = useAuthStore();
  const { setLoading } = useAppStore();

  // State
  const [assignments, setAssignments] = useState([]);
  const [centers, setCenters] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLocalLoading] = useState(true);
  const [selectedAssignments, setSelectedAssignments] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    studentId: '',
    centerId: '',
    etapa: '',
    testStatus: '',
    consentGiven: '',
    priority: '',
  });

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [deletingAssignment, setDeletingAssignment] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load data
  useEffect(() => {
    loadAssignments();
    loadCenters();
    loadStudents();
  }, []);

  const loadAssignments = async () => {
    try {
      setLocalLoading(true);
      const response = await apiClient.testAssignments.getAll();
      setAssignments(response.data.data || []);
    } catch (error) {
      console.error('Error loading test assignments:', error);
      toast.error('Error al cargar asignaciones de pruebas');
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
    }
  };

  const loadStudents = async () => {
    try {
      const response = await apiClient.students.getAll();
      setStudents(response.data.data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          assignment.testTitle?.toLowerCase().includes(searchLower) ||
          assignment.student?.fullName?.toLowerCase().includes(searchLower) ||
          assignment.student?.studentId?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Student filter
      if (filters.studentId && assignment.studentId !== filters.studentId) {
        return false;
      }

      // Center filter
      if (filters.centerId && assignment.student?.centerId !== filters.centerId) {
        return false;
      }

      // Etapa filter
      if (filters.etapa && assignment.student?.etapa !== filters.etapa) {
        return false;
      }

      // Test status filter
      if (filters.testStatus && assignment.testStatus !== filters.testStatus) {
        return false;
      }

      // Consent filter
      if (filters.consentGiven && assignment.consentGiven !== filters.consentGiven) {
        return false;
      }

      // Priority filter
      if (filters.priority && assignment.priority !== filters.priority) {
        return false;
      }

      return true;
    });
  }, [assignments, filters]);

  // Paginated assignments
  const paginatedAssignments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAssignments.slice(startIndex, endIndex);
  }, [filteredAssignments, currentPage]);

  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);

  // Handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedAssignments(paginatedAssignments.map(a => a.id));
    } else {
      setSelectedAssignments([]);
    }
  };

  const handleSelectAssignment = (assignmentId, checked) => {
    if (checked) {
      setSelectedAssignments([...selectedAssignments, assignmentId]);
    } else {
      setSelectedAssignments(selectedAssignments.filter(id => id !== assignmentId));
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setShowEditModal(true);
  };

  const handleDelete = (assignment) => {
    setDeletingAssignment(assignment);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await apiClient.testAssignments.delete(deletingAssignment.id);
      toast.success('Asignación eliminada correctamente');
      loadAssignments();
      setShowDeleteModal(false);
      setDeletingAssignment(null);
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Error al eliminar asignación');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAssignments.length === 0) {
      toast.error('No hay asignaciones seleccionadas');
      return;
    }

    try {
      await Promise.all(
        selectedAssignments.map(id => apiClient.testAssignments.delete(id))
      );
      toast.success(`${selectedAssignments.length} asignaciones eliminadas`);
      setSelectedAssignments([]);
      loadAssignments();
    } catch (error) {
      console.error('Error bulk deleting assignments:', error);
      toast.error('Error al eliminar asignaciones');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

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
            <ClipboardList className="w-8 h-8 text-emooti-blue-600" />
            Asignación de Pruebas
          </h1>
          <p className="text-slate-600 mt-1">
            {filteredAssignments.length} asignaciones encontradas
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(currentUser?.userType === 'ADMINISTRADOR' || currentUser?.userType === 'CLINICA' || currentUser?.userType === 'ORIENTADOR') && (
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
                Nueva Asignación
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Buscar
            </label>
            <Input
              placeholder="Prueba, estudiante..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Centro
            </label>
            <Select
              value={filters.centerId}
              onValueChange={(value) => setFilters({ ...filters, centerId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los centros</SelectItem>
                {centers.map(center => (
                  <SelectItem key={center.id} value={center.id}>
                    {center.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Etapa
            </label>
            <Select
              value={filters.etapa}
              onValueChange={(value) => setFilters({ ...filters, etapa: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las etapas</SelectItem>
                {Object.entries(ETAPAS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Estado
            </label>
            <Select
              value={filters.testStatus}
              onValueChange={(value) => setFilters({ ...filters, testStatus: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="SI">Completada</SelectItem>
                <SelectItem value="NO">No realizada</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="NA">N/A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Consentimiento
            </label>
            <Select
              value={filters.consentGiven}
              onValueChange={(value) => setFilters({ ...filters, consentGiven: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="SI">Sí</SelectItem>
                <SelectItem value="NO">No</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="NA">N/A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Prioridad
            </label>
            <Select
              value={filters.priority}
              onValueChange={(value) => setFilters({ ...filters, priority: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="BAJA">Baja</SelectItem>
                <SelectItem value="MEDIA">Media</SelectItem>
                <SelectItem value="ALTA">Alta</SelectItem>
                <SelectItem value="URGENTE">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedAssignments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emooti-blue-50 border border-emooti-blue-200 rounded-lg p-4 flex items-center justify-between"
        >
          <span className="text-sm text-emooti-blue-900">
            {selectedAssignments.length} asignaciones seleccionadas
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar seleccionadas
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
                  checked={selectedAssignments.length === paginatedAssignments.length && paginatedAssignments.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Estudiante</TableHead>
              <TableHead>Prueba</TableHead>
              <TableHead>Centro/Etapa</TableHead>
              <TableHead>Fecha Asignada</TableHead>
              <TableHead>Fecha Prueba</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Consentimiento</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAssignments.map((assignment) => {
              const StatusIcon = TEST_STATUS[assignment.testStatus]?.icon;
              return (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedAssignments.includes(assignment.id)}
                      onCheckedChange={(checked) => handleSelectAssignment(assignment.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{assignment.student?.fullName}</div>
                      <div className="text-xs text-slate-500">
                        ID: {assignment.student?.studentId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{assignment.testTitle}</div>
                      {assignment.testLink && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <QrCode className="w-3 h-3" />
                          Tiene enlace
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div className="font-medium">{assignment.student?.center?.name || '-'}</div>
                      <div className="text-xs text-slate-500">
                        {ETAPAS[assignment.student?.etapa]} - {assignment.student?.course}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDate(assignment.assignedDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDate(assignment.testDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={TEST_STATUS[assignment.testStatus]?.color || 'bg-gray-100 text-gray-800'}>
                      <div className="flex items-center gap-1">
                        {StatusIcon && <StatusIcon className="w-3 h-3" />}
                        {TEST_STATUS[assignment.testStatus]?.label || assignment.testStatus}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={PRIORITY[assignment.priority]?.color || 'bg-gray-100 text-gray-800'}>
                      {PRIORITY[assignment.priority]?.label || assignment.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={CONSENT_STATUS[assignment.consentGiven]?.color || 'bg-gray-100 text-gray-800'}>
                      {CONSENT_STATUS[assignment.consentGiven]?.label || assignment.consentGiven}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(assignment)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {(currentUser?.userType === 'ADMINISTRADOR' || currentUser?.userType === 'CLINICA') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(assignment)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Empty State */}
        {filteredAssignments.length === 0 && (
          <div className="text-center py-12">
            <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No se encontraron asignaciones
            </h3>
            <p className="text-slate-600">
              Intenta ajustar los filtros o crea una nueva asignación de prueba.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t p-4">
            <div className="text-sm text-slate-600">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredAssignments.length)} de {filteredAssignments.length} asignaciones
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
              ¿Estás seguro de que deseas eliminar la asignación de la prueba "{deletingAssignment?.testTitle}" para el estudiante "{deletingAssignment?.student?.fullName}"?
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
      <CreateTestAssignmentModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadAssignments}
      />

      <TestAssignmentEditForm
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadAssignments}
        assignment={editingAssignment}
      />
    </div>
  );
}
