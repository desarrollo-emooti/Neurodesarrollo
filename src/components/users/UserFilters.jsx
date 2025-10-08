import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const USER_TYPES = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'CLINICA', label: 'Clínica' },
  { value: 'ORIENTADOR', label: 'Orientador' },
  { value: 'EXAMINADOR', label: 'Examinador' },
  { value: 'FAMILIA', label: 'Familia' },
];

const STATUS_TYPES = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'pending_invitation', label: 'Pendiente de Invitación' },
  { value: 'invitation_sent', label: 'Invitación Enviada' },
];

const ETAPAS = [
  'Educación Infantil',
  'Educación Primaria',
  'ESO',
  'Bachillerato',
  'Formación Profesional',
];

const CURSOS = [
  '1º Infantil', '2º Infantil', '3º Infantil',
  '1º Primaria', '2º Primaria', '3º Primaria', '4º Primaria', '5º Primaria', '6º Primaria',
  '1º ESO', '2º ESO', '3º ESO', '4º ESO',
  '1º Bachillerato', '2º Bachillerato',
  'FP Grado Medio', 'FP Grado Superior',
];

const GRUPOS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export default function UserFilters({ filters, onFiltersChange, centers = [] }) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // Handle search input with debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onFiltersChange({ ...filters, search: searchTerm });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const toggleArrayFilter = (filterKey, value) => {
    const currentValues = filters[filterKey] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];

    onFiltersChange({
      ...filters,
      [filterKey]: newValues,
    });
  };

  const clearFilter = (filterKey) => {
    onFiltersChange({
      ...filters,
      [filterKey]: [],
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      user_types: [],
      statuses: [],
      center_ids: [],
      etapas: [],
      cursos: [],
      grupos: [],
    });
    setSearchTerm('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.user_types?.length > 0) count++;
    if (filters.statuses?.length > 0) count++;
    if (filters.center_ids?.length > 0) count++;
    if (filters.etapas?.length > 0) count++;
    if (filters.cursos?.length > 0) count++;
    if (filters.grupos?.length > 0) count++;
    return count;
  };

  const getTotalSelectedCount = () => {
    return (
      (filters.user_types?.length || 0) +
      (filters.statuses?.length || 0) +
      (filters.center_ids?.length || 0) +
      (filters.etapas?.length || 0) +
      (filters.cursos?.length || 0) +
      (filters.grupos?.length || 0)
    );
  };

  const activeFiltersCount = getActiveFiltersCount();
  const totalSelectedCount = getTotalSelectedCount();

  return (
    <div className="space-y-4">
      {/* Search and Filter Toggle */}
      <div className="flex items-center space-x-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, email o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Toggle Button */}
        <Button
          variant={showFilters ? 'default' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge
              variant="destructive"
              className="ml-2 px-1.5 py-0.5 text-xs min-w-[20px] h-5"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {/* Clear All Filters */}
        {totalSelectedCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="w-4 h-4 mr-2" />
            Limpiar ({totalSelectedCount})
          </Button>
        )}
      </div>

      {/* Active Filters Pills */}
      {totalSelectedCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {/* User Types Pills */}
          {filters.user_types?.map((type) => (
            <Badge key={type} variant="secondary" className="gap-1">
              {USER_TYPES.find(t => t.value === type)?.label}
              <X
                className="w-3 h-3 cursor-pointer hover:text-red-600"
                onClick={() => toggleArrayFilter('user_types', type)}
              />
            </Badge>
          ))}

          {/* Status Pills */}
          {filters.statuses?.map((status) => (
            <Badge key={status} variant="secondary" className="gap-1">
              {STATUS_TYPES.find(s => s.value === status)?.label}
              <X
                className="w-3 h-3 cursor-pointer hover:text-red-600"
                onClick={() => toggleArrayFilter('statuses', status)}
              />
            </Badge>
          ))}

          {/* Centers Pills */}
          {filters.center_ids?.map((centerId) => (
            <Badge key={centerId} variant="secondary" className="gap-1">
              {centers.find(c => c.id === centerId)?.name || centerId}
              <X
                className="w-3 h-3 cursor-pointer hover:text-red-600"
                onClick={() => toggleArrayFilter('center_ids', centerId)}
              />
            </Badge>
          ))}

          {/* Etapas Pills */}
          {filters.etapas?.map((etapa) => (
            <Badge key={etapa} variant="secondary" className="gap-1">
              {etapa}
              <X
                className="w-3 h-3 cursor-pointer hover:text-red-600"
                onClick={() => toggleArrayFilter('etapas', etapa)}
              />
            </Badge>
          ))}

          {/* Cursos Pills */}
          {filters.cursos?.map((curso) => (
            <Badge key={curso} variant="secondary" className="gap-1">
              {curso}
              <X
                className="w-3 h-3 cursor-pointer hover:text-red-600"
                onClick={() => toggleArrayFilter('cursos', curso)}
              />
            </Badge>
          ))}

          {/* Grupos Pills */}
          {filters.grupos?.map((grupo) => (
            <Badge key={grupo} variant="secondary" className="gap-1">
              Grupo {grupo}
              <X
                className="w-3 h-3 cursor-pointer hover:text-red-600"
                onClick={() => toggleArrayFilter('grupos', grupo)}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* User Type Filter */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Tipo de Usuario</Label>
                    {filters.user_types?.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearFilter('user_types')}
                        className="h-6 px-2 text-xs"
                      >
                        Limpiar
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {USER_TYPES.map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-type-${type.value}`}
                          checked={filters.user_types?.includes(type.value)}
                          onCheckedChange={() => toggleArrayFilter('user_types', type.value)}
                        />
                        <Label
                          htmlFor={`filter-type-${type.value}`}
                          className="cursor-pointer text-sm font-normal"
                        >
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Estado</Label>
                    {filters.statuses?.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearFilter('statuses')}
                        className="h-6 px-2 text-xs"
                      >
                        Limpiar
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {STATUS_TYPES.map((status) => (
                      <div key={status.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-status-${status.value}`}
                          checked={filters.statuses?.includes(status.value)}
                          onCheckedChange={() => toggleArrayFilter('statuses', status.value)}
                        />
                        <Label
                          htmlFor={`filter-status-${status.value}`}
                          className="cursor-pointer text-sm font-normal"
                        >
                          {status.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Centers Filter */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Centros</Label>
                    {filters.center_ids?.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearFilter('center_ids')}
                        className="h-6 px-2 text-xs"
                      >
                        Limpiar
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {centers.map((center) => (
                      <div key={center.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-center-${center.id}`}
                          checked={filters.center_ids?.includes(center.id)}
                          onCheckedChange={() => toggleArrayFilter('center_ids', center.id)}
                        />
                        <Label
                          htmlFor={`filter-center-${center.id}`}
                          className="cursor-pointer text-sm font-normal"
                        >
                          {center.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Etapas Filter */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Etapas Educativas</Label>
                    {filters.etapas?.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearFilter('etapas')}
                        className="h-6 px-2 text-xs"
                      >
                        Limpiar
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {ETAPAS.map((etapa) => (
                      <div key={etapa} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-etapa-${etapa}`}
                          checked={filters.etapas?.includes(etapa)}
                          onCheckedChange={() => toggleArrayFilter('etapas', etapa)}
                        />
                        <Label
                          htmlFor={`filter-etapa-${etapa}`}
                          className="cursor-pointer text-sm font-normal"
                        >
                          {etapa}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cursos Filter */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Cursos</Label>
                    {filters.cursos?.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearFilter('cursos')}
                        className="h-6 px-2 text-xs"
                      >
                        Limpiar
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {CURSOS.map((curso) => (
                      <div key={curso} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-curso-${curso}`}
                          checked={filters.cursos?.includes(curso)}
                          onCheckedChange={() => toggleArrayFilter('cursos', curso)}
                        />
                        <Label
                          htmlFor={`filter-curso-${curso}`}
                          className="cursor-pointer text-sm font-normal"
                        >
                          {curso}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grupos Filter */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Grupos/Clases</Label>
                    {filters.grupos?.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearFilter('grupos')}
                        className="h-6 px-2 text-xs"
                      >
                        Limpiar
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {GRUPOS.map((grupo) => (
                      <div key={grupo} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-grupo-${grupo}`}
                          checked={filters.grupos?.includes(grupo)}
                          onCheckedChange={() => toggleArrayFilter('grupos', grupo)}
                        />
                        <Label
                          htmlFor={`filter-grupo-${grupo}`}
                          className="cursor-pointer text-sm font-normal"
                        >
                          {grupo}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
