import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Download, FileDown, FileSpreadsheet, FileJson, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';

const EXPORT_MODES = [
  {
    value: 'complete',
    label: 'Completo',
    description: 'Todos los campos del usuario',
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    value: 'without_sensitive',
    label: 'Sin Datos Sensibles',
    description: 'Sin nombre, email, teléfono, DNI, dirección',
    icon: EyeOff,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  {
    value: 'pseudonymized',
    label: 'Pseudonimizado',
    description: 'Datos sensibles reemplazados por pseudónimos',
    icon: Shield,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
];

const EXPORT_FORMATS = [
  {
    value: 'csv',
    label: 'CSV (separador ;)',
    icon: FileDown,
    extension: '.csv',
  },
  {
    value: 'excel',
    label: 'Excel (.xlsx)',
    icon: FileSpreadsheet,
    extension: '.xlsx',
  },
  {
    value: 'json',
    label: 'JSON',
    icon: FileJson,
    extension: '.json',
  },
];

export default function UserExportModal({ open, onClose, selectedUsers = null }) {
  const [loading, setLoading] = useState(false);
  const [exportMode, setExportMode] = useState('complete');
  const [exportFormat, setExportFormat] = useState('csv');
  const [includeRelations, setIncludeRelations] = useState({
    centers: true,
    students: false,
    payments: false,
    tests: false,
  });

  const resetForm = () => {
    setExportMode('complete');
    setExportFormat('csv');
    setIncludeRelations({
      centers: true,
      students: false,
      payments: false,
      tests: false,
    });
  };

  React.useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const getSensitiveFields = () => {
    return ['full_name', 'email', 'phone', 'dni', 'address_street', 'address_number', 'address_floor', 'address_city', 'address_postal_code', 'address_province', 'address_country'];
  };

  const getPseudonymizedData = (user) => {
    const pseudonymized = { ...user };
    pseudonymized.full_name = `Usuario_${user.id.slice(-8)}`;
    pseudonymized.email = `user_${user.id.slice(-8)}@pseudonym.local`;
    pseudonymized.phone = user.phone ? 'XXX-XXX-XXX' : null;
    pseudonymized.dni = user.dni ? `XXXXX${user.dni.slice(-3)}` : null;
    pseudonymized.address_street = user.address_street ? 'Calle Pseudónima' : null;
    pseudonymized.address_number = user.address_number ? 'XX' : null;
    pseudonymized.address_floor = user.address_floor ? 'XX' : null;
    pseudonymized.address_city = user.address_city ? 'Ciudad Pseudónima' : null;
    pseudonymized.address_postal_code = user.address_postal_code ? 'XXXXX' : null;
    pseudonymized.address_province = user.address_province ? 'Provincia Pseudónima' : null;
    pseudonymized.address_country = user.address_country ? user.address_country : null;
    return pseudonymized;
  };

  const getFilteredData = (users) => {
    if (exportMode === 'complete') {
      return users;
    }

    if (exportMode === 'without_sensitive') {
      const sensitiveFields = getSensitiveFields();
      return users.map(user => {
        const filtered = { ...user };
        sensitiveFields.forEach(field => {
          delete filtered[field];
        });
        return filtered;
      });
    }

    if (exportMode === 'pseudonymized') {
      return users.map(user => getPseudonymizedData(user));
    }

    return users;
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Header row
    csvRows.push(headers.join(';'));

    // Data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];

        // Handle null/undefined
        if (value === null || value === undefined) return '';

        // Handle arrays and objects
        if (typeof value === 'object') return JSON.stringify(value);

        // Escape semicolons and quotes
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(';') ? `"${escaped}"` : escaped;
      });
      csvRows.push(values.join(';'));
    }

    return csvRows.join('\n');
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      // Get users data
      let usersData;
      if (selectedUsers && selectedUsers.length > 0) {
        // Export selected users
        const response = await apiClient.users.getByIds(selectedUsers, {
          include_relations: Object.keys(includeRelations).filter(key => includeRelations[key])
        });
        usersData = response.data.data;
      } else {
        // Export all users
        const response = await apiClient.users.getAll({
          include_relations: Object.keys(includeRelations).filter(key => includeRelations[key])
        });
        usersData = response.data.data;
      }

      // Filter data based on export mode
      const filteredData = getFilteredData(usersData);

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const modeLabel = EXPORT_MODES.find(m => m.value === exportMode)?.label || 'export';
      const formatExt = EXPORT_FORMATS.find(f => f.value === exportFormat)?.extension || '.txt';
      const filename = `usuarios_${modeLabel}_${timestamp}${formatExt}`;

      // Export based on format
      if (exportFormat === 'csv') {
        const csv = convertToCSV(filteredData);
        downloadFile(csv, filename, 'text/csv;charset=utf-8;');
      } else if (exportFormat === 'excel') {
        // Call API to generate Excel (requires server-side library like exceljs)
        const response = await apiClient.users.exportExcel({
          users: filteredData,
          mode: exportMode,
        });
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'json') {
        const json = JSON.stringify(filteredData, null, 2);
        downloadFile(json, filename, 'application/json;charset=utf-8;');
      }

      toast.success(`${filteredData.length} usuario(s) exportado(s) correctamente`);
      onClose();
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error(error.response?.data?.message || 'Error al exportar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const selectedMode = EXPORT_MODES.find(m => m.value === exportMode);
  const ModeIcon = selectedMode?.icon || Download;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Exportar Usuarios</span>
          </DialogTitle>
          <DialogDescription>
            {selectedUsers && selectedUsers.length > 0
              ? `Exportando ${selectedUsers.length} usuario(s) seleccionado(s)`
              : 'Exportando todos los usuarios del sistema'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 space-y-6">
          {/* Export Mode Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Modo de Exportación</Label>
            <RadioGroup value={exportMode} onValueChange={setExportMode}>
              {EXPORT_MODES.map((mode) => {
                const Icon = mode.icon;
                return (
                  <motion.div
                    key={mode.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={cn(
                        'p-4 cursor-pointer transition-all duration-200 border-2',
                        exportMode === mode.value
                          ? `${mode.borderColor} ${mode.bgColor}`
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => setExportMode(mode.value)}
                    >
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value={mode.value} id={mode.value} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Icon className={cn('w-5 h-5', mode.color)} />
                            <Label
                              htmlFor={mode.value}
                              className="text-base font-medium cursor-pointer"
                            >
                              {mode.label}
                            </Label>
                          </div>
                          <p className="text-sm text-gray-600">{mode.description}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </RadioGroup>
          </div>

          {/* RGPD Warning for Complete Export */}
          {exportMode === 'complete' && (
            <Card className="p-4 bg-amber-50 border-amber-200">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Advertencia RGPD</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Esta exportación incluye datos personales sensibles. Asegúrese de cumplir con la normativa de protección de datos.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Formato de Archivo</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione formato" />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_FORMATS.map((format) => {
                  const Icon = format.icon;
                  return (
                    <SelectItem key={format.value} value={format.value}>
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span>{format.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Include Relations */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Incluir Relaciones</Label>
            <div className="space-y-2 border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-centers"
                  checked={includeRelations.centers}
                  onCheckedChange={(checked) =>
                    setIncludeRelations({ ...includeRelations, centers: checked })
                  }
                />
                <Label htmlFor="include-centers" className="cursor-pointer text-sm">
                  Centros asociados
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-students"
                  checked={includeRelations.students}
                  onCheckedChange={(checked) =>
                    setIncludeRelations({ ...includeRelations, students: checked })
                  }
                />
                <Label htmlFor="include-students" className="cursor-pointer text-sm">
                  Alumnos relacionados (para FAMILIA)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-payments"
                  checked={includeRelations.payments}
                  onCheckedChange={(checked) =>
                    setIncludeRelations({ ...includeRelations, payments: checked })
                  }
                />
                <Label htmlFor="include-payments" className="cursor-pointer text-sm">
                  Configuración de pagos
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-tests"
                  checked={includeRelations.tests}
                  onCheckedChange={(checked) =>
                    setIncludeRelations({ ...includeRelations, tests: checked })
                  }
                />
                <Label htmlFor="include-tests" className="cursor-pointer text-sm">
                  Pruebas permitidas (para EXAMINADOR)
                </Label>
              </div>
            </div>
          </div>

          {/* Export Preview */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <ModeIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Exportación: {selectedMode?.label}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Formato: {EXPORT_FORMATS.find(f => f.value === exportFormat)?.label}
                </p>
                {selectedUsers && selectedUsers.length > 0 && (
                  <p className="text-xs text-blue-700 mt-1">
                    {selectedUsers.length} usuario(s) seleccionado(s)
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            {loading ? 'Exportando...' : 'Exportar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
