import React, { useState, useEffect, useMemo } from 'react';
import { GraduationCap, Plus, Download, Upload, Trash2, Edit2, Users, Calendar, MapPin } from 'lucide-react';
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

// Student Components
import CreateStudentModal from '@/components/students/CreateStudentModal';
import StudentEditForm from '@/components/students/StudentEditForm';

// API
import { apiClient } from '@/lib/api';

// Store
import useAppStore from '@/store/appStore';
import useAuthStore from '@/store/authStore';

// Student Constants
const ETAPAS = {
  EDUCACION_INFANTIL: { label: 'Educación Infantil', color: 'bg-pink-100 text-pink-800' },
  EDUCACION_PRIMARIA: { label: 'Educación Primaria', color: 'bg-blue-100 text-blue-800' },
  ESO: { label: 'ESO', color: 'bg-purple-100 text-purple-800' },
  BACHILLERATO: { label: 'Bachillerato', color: 'bg-green-100 text-green-800' },
  FORMACION_PROFESIONAL: { label: 'Formación Profesional', color: 'bg-orange-100 text-orange-800' },
};

const CONSENT_STATUS = {
  SI: { label: 'Sí', color: 'bg-green-100 text-green-800' },
  NO: { label: 'No', color: 'bg-red-100 text-red-800' },
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  NA: { label: 'N/A', color: 'bg-gray-100 text-gray-800' },
};

const PAYMENT_STATUS = {
  PAGADO: { label: 'Pagado', color: 'bg-green-100 text-green-800' },
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  NA: { label: 'N/A', color: 'bg-gray-100 text-gray-800' },
};

export default function Students() {
  const { user: currentUser } = useAuthStore();
  const { setLoading } = useAppStore();

  // State
  const [students, setStudents] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLocalLoading] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    etapa: '',
    centerId: '',
    course: '',
    consentGiven: '',
    paymentStatus: '',
  });

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load data
  useEffect(() => {
    loadStudents();
    loadCenters();
  }, []);

  const loadStudents = async () => {
    try {
      setLocalLoading(true);
      const response = await apiClient.students.getAll();
      setStudents(response.data.data || []);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Error al cargar estudiantes');
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

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          student.fullName?.toLowerCase().includes(searchLower) ||
          student.studentId?.toLowerCase().includes(searchLower) ||
          student.nia?.toLowerCase().includes(searchLower) ||
          student.dni?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Etapa filter
      if (filters.etapa && student.etapa !== filters.etapa) {
        return false;
      }

      // Center filter
      if (filters.centerId && student.centerId !== filters.centerId) {
        return false;
      }

      // Course filter
      if (filters.course && student.course !== filters.course) {
        return false;
      }

      // Consent filter
      if (filters.consentGiven && student.consentGiven !== filters.consentGiven) {
        return false;
      }

      // Payment status filter
      if (filters.paymentStatus && student.paymentStatus !== filters.paymentStatus) {
        return false;
      }

      return true;
    });
  }, [students, filters]);

  // Paginated students
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredStudents.slice(startIndex, endIndex);
  }, [filteredStudents, currentPage]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  // Handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedStudents(paginatedStudents.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId, checked) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setShowEditModal(true);
  };

  const handleDelete = (student) => {
    setDeletingStudent(student);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await apiClient.students.delete(deletingStudent.id);
      toast.success('Estudiante eliminado correctamente');
      loadStudents();
      setShowDeleteModal(false);
      setDeletingStudent(null);
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Error al eliminar estudiante');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) {
      toast.error('No hay estudiantes seleccionados');
      return;
    }

    try {
      await Promise.all(
        selectedStudents.map(id => apiClient.students.delete(id))
      );
      toast.success(`${selectedStudents.length} estudiantes eliminados`);
      setSelectedStudents([]);
      loadStudents();
    } catch (error) {
      console.error('Error bulk deleting students:', error);
      toast.error('Error al eliminar estudiantes');
    }
  };

  // Get unique values for filters
  const uniqueCourses = useMemo(() => {
    return [...new Set(students.map(s => s.course).filter(Boolean))];
  }, [students]);

  // Calculate age from birthDate
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
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
            <GraduationCap className="w-8 h-8 text-emooti-blue-600" />
            Gestión de Estudiantes
          </h1>
          <p className="text-slate-600 mt-1">
            {filteredStudents.length} estudiantes encontrados
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(currentUser?.userType === 'ADMINISTRADOR' || currentUser?.userType === 'ORIENTADOR') && (
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
                Nuevo Estudiante
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Buscar
            </label>
            <Input
              placeholder="Nombre, NIA, DNI..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Etapa
            </label>
            <Select
              value={filters.etapa || "ALL"}
              onValueChange={(value) => setFilters({ ...filters, etapa: value === "ALL" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las etapas</SelectItem>
                <SelectItem value="EDUCACION_INFANTIL">Educación Infantil</SelectItem>
                <SelectItem value="EDUCACION_PRIMARIA">Educación Primaria</SelectItem>
                <SelectItem value="ESO">ESO</SelectItem>
                <SelectItem value="BACHILLERATO">Bachillerato</SelectItem>
                <SelectItem value="FORMACION_PROFESIONAL">Formación Profesional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Centro
            </label>
            <Select
              value={filters.centerId || "ALL"}
              onValueChange={(value) => setFilters({ ...filters, centerId: value === "ALL" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los centros</SelectItem>
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
              Consentimiento
            </label>
            <Select
              value={filters.consentGiven || "ALL"}
              onValueChange={(value) => setFilters({ ...filters, consentGiven: value === "ALL" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="SI">Sí</SelectItem>
                <SelectItem value="NO">No</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="NA">N/A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Estado de Pago
            </label>
            <Select
              value={filters.paymentStatus || "ALL"}
              onValueChange={(value) => setFilters({ ...filters, paymentStatus: value === "ALL" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="PAGADO">Pagado</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="NA">N/A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedStudents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emooti-blue-50 border border-emooti-blue-200 rounded-lg p-4 flex items-center justify-between"
        >
          <span className="text-sm text-emooti-blue-900">
            {selectedStudents.length} estudiantes seleccionados
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
                  checked={selectedStudents.length === paginatedStudents.length && paginatedStudents.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>ID/NIA</TableHead>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Edad</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Curso/Grupo</TableHead>
              <TableHead>Centro</TableHead>
              <TableHead>Consentimiento</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedStudents.includes(student.id)}
                    onCheckedChange={(checked) => handleSelectStudent(student.id, checked)}
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{student.studentId}</div>
                    {student.nia && (
                      <div className="text-xs text-slate-500">NIA: {student.nia}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{student.fullName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {calculateAge(student.birthDate)} años
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={ETAPAS[student.etapa]?.color}>
                    {ETAPAS[student.etapa]?.label || student.etapa}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm space-y-1">
                    <div>{student.course}</div>
                    {student.classGroup && (
                      <div className="text-xs text-slate-500">
                        Grupo: {student.classGroup}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-slate-600">
                    {student.center?.name || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={CONSENT_STATUS[student.consentGiven]?.color || 'bg-gray-100 text-gray-800'}>
                    {CONSENT_STATUS[student.consentGiven]?.label || student.consentGiven}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={PAYMENT_STATUS[student.paymentStatus]?.color || 'bg-gray-100 text-gray-800'}>
                    {PAYMENT_STATUS[student.paymentStatus]?.label || student.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(student)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    {(currentUser?.userType === 'ADMINISTRADOR' || currentUser?.userType === 'ORIENTADOR') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(student)}
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
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No se encontraron estudiantes
            </h3>
            <p className="text-slate-600">
              Intenta ajustar los filtros o crea un nuevo estudiante.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t p-4">
            <div className="text-sm text-slate-600">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredStudents.length)} de {filteredStudents.length} estudiantes
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
              ¿Estás seguro de que deseas eliminar al estudiante "{deletingStudent?.fullName}"?
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
      <CreateStudentModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadStudents}
      />

      <StudentEditForm
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadStudents}
        student={editingStudent}
      />
    </div>
  );
}
