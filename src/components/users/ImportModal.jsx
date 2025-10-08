import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Upload,
  FileUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  FileSpreadsheet,
  FileJson,
  Table,
  Loader2,
} from 'lucide-react';
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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';

const IMPORT_STEPS = {
  UPLOAD: 'upload',
  VALIDATION: 'validation',
  PREVIEW: 'preview',
  IMPORTING: 'importing',
  COMPLETE: 'complete',
};

const REQUIRED_FIELDS = ['email', 'user_type'];

const OPTIONAL_FIELDS = [
  'full_name',
  'dni',
  'phone',
  'birth_date',
  'nationality',
  'address_street',
  'address_number',
  'address_floor',
  'address_city',
  'address_postal_code',
  'address_province',
  'address_country',
  'center_id',
  'center_ids',
  'specialty',
  'allowed_etapas',
  'allowed_courses',
  'allowed_groups',
  'allowed_tests',
  'payment_method',
  'observations',
];

const USER_TYPES = ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR', 'EXAMINADOR', 'FAMILIA'];

export default function ImportModal({ open, onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(IMPORT_STEPS.UPLOAD);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationResults, setValidationResults] = useState({
    valid: [],
    errors: [],
    warnings: [],
  });
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState({
    success: 0,
    failed: 0,
    total: 0,
  });

  const fileInputRef = useRef(null);

  React.useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setCurrentStep(IMPORT_STEPS.UPLOAD);
    setFile(null);
    setParsedData([]);
    setValidationResults({ valid: [], errors: [], warnings: [] });
    setImporting(false);
    setImportProgress(0);
    setImportResults({ success: 0, failed: 0, total: 0 });
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Formato de archivo no válido. Use CSV, Excel o JSON.');
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = async (file) => {
    setCurrentStep(IMPORT_STEPS.VALIDATION);

    try {
      const fileType = file.type;
      const text = await file.text();

      let data = [];

      if (fileType === 'application/json') {
        data = JSON.parse(text);
      } else if (fileType.includes('csv') || fileType.includes('excel')) {
        // Parse CSV (simple parser)
        const lines = text.split('\n');
        const headers = lines[0].split(';').map(h => h.trim());

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(';').map(v => v.trim());
          const row = {};

          headers.forEach((header, index) => {
            let value = values[index] || '';

            // Remove quotes
            value = value.replace(/^"(.*)"$/, '$1');

            // Try to parse JSON arrays
            if (value.startsWith('[') && value.endsWith(']')) {
              try {
                value = JSON.parse(value);
              } catch (e) {
                // Keep as string
              }
            }

            row[header] = value;
          });

          data.push(row);
        }
      }

      setParsedData(data);
      validateData(data);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Error al procesar el archivo');
      setCurrentStep(IMPORT_STEPS.UPLOAD);
    }
  };

  const validateData = (data) => {
    const valid = [];
    const errors = [];
    const warnings = [];

    data.forEach((row, index) => {
      const rowErrors = [];
      const rowWarnings = [];

      // Check required fields
      REQUIRED_FIELDS.forEach(field => {
        if (!row[field] || row[field] === '') {
          rowErrors.push(`Campo obligatorio faltante: ${field}`);
        }
      });

      // Validate email format
      if (row.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          rowErrors.push('Email con formato inválido');
        }
      }

      // Validate user_type
      if (row.user_type && !USER_TYPES.includes(row.user_type)) {
        rowErrors.push(`Tipo de usuario inválido: ${row.user_type}`);
      }

      // Role-specific validations
      if (row.user_type === 'ORIENTADOR' && !row.center_id) {
        rowWarnings.push('ORIENTADOR debe tener un centro asignado');
      }

      if (['CLINICA', 'EXAMINADOR'].includes(row.user_type)) {
        if (!row.center_ids || (Array.isArray(row.center_ids) && row.center_ids.length === 0)) {
          rowWarnings.push(`${row.user_type} debe tener al menos un centro asignado`);
        }
      }

      if (row.user_type === 'CLINICA' && !row.specialty) {
        rowWarnings.push('CLINICA debe tener una especialidad');
      }

      if (row.user_type === 'FAMILIA' && !row.payment_method) {
        rowWarnings.push('FAMILIA debe tener un método de pago');
      }

      // Store validation results
      if (rowErrors.length > 0) {
        errors.push({
          row: index + 1,
          data: row,
          errors: rowErrors,
        });
      } else if (rowWarnings.length > 0) {
        warnings.push({
          row: index + 1,
          data: row,
          warnings: rowWarnings,
        });
        valid.push(row);
      } else {
        valid.push(row);
      }
    });

    setValidationResults({ valid, errors, warnings });
    setCurrentStep(IMPORT_STEPS.PREVIEW);
  };

  const handleImport = async () => {
    if (validationResults.valid.length === 0) {
      toast.error('No hay registros válidos para importar');
      return;
    }

    setCurrentStep(IMPORT_STEPS.IMPORTING);
    setImporting(true);
    setImportProgress(0);

    const total = validationResults.valid.length;
    let success = 0;
    let failed = 0;

    try {
      for (let i = 0; i < validationResults.valid.length; i++) {
        try {
          await apiClient.users.create(validationResults.valid[i]);
          success++;
        } catch (error) {
          console.error('Error importing user:', error);
          failed++;
        }

        setImportProgress(Math.round(((i + 1) / total) * 100));
      }

      setImportResults({ success, failed, total });
      setCurrentStep(IMPORT_STEPS.COMPLETE);

      if (success > 0) {
        toast.success(`${success} usuario(s) importado(s) correctamente`);
        onSuccess?.();
      }

      if (failed > 0) {
        toast.warning(`${failed} usuario(s) no pudieron ser importados`);
      }
    } catch (error) {
      console.error('Error during import:', error);
      toast.error('Error durante la importación');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = {
      headers: [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS],
      example: {
        email: 'usuario@ejemplo.com',
        user_type: 'ORIENTADOR',
        full_name: 'Juan Pérez García',
        dni: '12345678A',
        phone: '+34 600123456',
        center_id: 'CTR_001',
        allowed_etapas: '["Educación Primaria", "ESO"]',
        allowed_courses: '["1º Primaria", "2º Primaria"]',
        allowed_groups: '["A", "B"]',
      },
    };

    const csv = [
      template.headers.join(';'),
      template.headers.map(h => template.example[h] || '').join(';'),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla_importacion_usuarios.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Plantilla descargada correctamente');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case IMPORT_STEPS.UPLOAD:
        return (
          <div className="space-y-6">
            {/* Upload Area */}
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer',
                'hover:border-emooti-blue-500 hover:bg-blue-50'
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Seleccione un archivo para importar
              </p>
              <p className="text-sm text-gray-600 mb-4">
                CSV (separador ;), Excel (.xlsx) o JSON
              </p>
              <Button type="button" onClick={() => fileInputRef.current?.click()}>
                <FileUp className="w-4 h-4 mr-2" />
                Seleccionar Archivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Download Template */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Plantilla de Importación</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Descargue la plantilla con los campos requeridos
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </Button>
              </div>
            </Card>

            {/* Required Fields Info */}
            <Card className="p-4">
              <p className="text-sm font-medium text-gray-900 mb-3">Campos Obligatorios:</p>
              <div className="flex flex-wrap gap-2">
                {REQUIRED_FIELDS.map(field => (
                  <Badge key={field} variant="destructive">
                    {field}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        );

      case IMPORT_STEPS.VALIDATION:
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 text-emooti-blue-600 animate-spin" />
            <p className="text-lg font-medium">Validando datos...</p>
            <p className="text-sm text-gray-600">Por favor espere</p>
          </div>
        );

      case IMPORT_STEPS.PREVIEW:
        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-900">
                      {validationResults.valid.length}
                    </p>
                    <p className="text-xs text-green-700">Válidos</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-amber-50 border-amber-200">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                  <div>
                    <p className="text-2xl font-bold text-amber-900">
                      {validationResults.warnings.length}
                    </p>
                    <p className="text-xs text-amber-700">Advertencias</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-red-50 border-red-200">
                <div className="flex items-center space-x-3">
                  <XCircle className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-900">
                      {validationResults.errors.length}
                    </p>
                    <p className="text-xs text-red-700">Errores</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Errors List */}
            {validationResults.errors.length > 0 && (
              <Card className="p-4 bg-red-50 border-red-200">
                <p className="text-sm font-medium text-red-900 mb-3">
                  Registros con Errores (no se importarán):
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {validationResults.errors.map((error, index) => (
                    <div key={index} className="text-xs bg-white p-3 rounded border border-red-200">
                      <p className="font-medium text-red-900">Fila {error.row}</p>
                      <ul className="list-disc list-inside text-red-700 mt-1">
                        {error.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Warnings List */}
            {validationResults.warnings.length > 0 && (
              <Card className="p-4 bg-amber-50 border-amber-200">
                <p className="text-sm font-medium text-amber-900 mb-3">
                  Registros con Advertencias (se importarán):
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {validationResults.warnings.map((warning, index) => (
                    <div key={index} className="text-xs bg-white p-3 rounded border border-amber-200">
                      <p className="font-medium text-amber-900">Fila {warning.row}</p>
                      <ul className="list-disc list-inside text-amber-700 mt-1">
                        {warning.warnings.map((warn, i) => (
                          <li key={i}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        );

      case IMPORT_STEPS.IMPORTING:
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <Loader2 className="w-16 h-16 text-emooti-blue-600 animate-spin" />
            <div className="w-full max-w-md space-y-3">
              <p className="text-lg font-medium text-center">Importando usuarios...</p>
              <Progress value={importProgress} className="w-full" />
              <p className="text-sm text-gray-600 text-center">{importProgress}% completado</p>
            </div>
          </div>
        );

      case IMPORT_STEPS.COMPLETE:
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-600" />
              <p className="text-xl font-bold text-gray-900">Importación Completada</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-900">{importResults.total}</p>
                  <p className="text-xs text-blue-700 mt-1">Total Procesados</p>
                </div>
              </Card>

              <Card className="p-4 bg-green-50 border-green-200">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-900">{importResults.success}</p>
                  <p className="text-xs text-green-700 mt-1">Importados</p>
                </div>
              </Card>

              <Card className="p-4 bg-red-50 border-red-200">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-900">{importResults.failed}</p>
                  <p className="text-xs text-red-700 mt-1">Fallidos</p>
                </div>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderFooter = () => {
    switch (currentStep) {
      case IMPORT_STEPS.UPLOAD:
        return (
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        );

      case IMPORT_STEPS.PREVIEW:
        return (
          <>
            <Button variant="outline" onClick={resetForm}>
              Seleccionar Otro Archivo
            </Button>
            <Button
              onClick={handleImport}
              disabled={validationResults.valid.length === 0}
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar {validationResults.valid.length} Usuario(s)
            </Button>
          </>
        );

      case IMPORT_STEPS.COMPLETE:
        return (
          <>
            <Button variant="outline" onClick={resetForm}>
              Importar Más Usuarios
            </Button>
            <Button onClick={onClose}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Finalizar
            </Button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Importar Usuarios</span>
          </DialogTitle>
          <DialogDescription>
            Importe usuarios desde archivos CSV, Excel o JSON
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {renderStepContent()}
        </div>

        <DialogFooter className="mt-4">
          {renderFooter()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
