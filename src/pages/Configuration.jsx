import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import {
  Settings,
  FileText,
  Building2,
  Upload,
  Database,
  Plus,
  Edit2,
  Trash2,
  Save,
  CheckCircle,
  XCircle,
  Filter,
  Search,
} from 'lucide-react';

// Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

// Modals
import CreateValueConfigModal from '@/components/configuration/CreateValueConfigModal';
import ValueConfigEditForm from '@/components/configuration/ValueConfigEditForm';
import CreateImportTemplateModal from '@/components/configuration/CreateImportTemplateModal';
import ImportTemplateEditForm from '@/components/configuration/ImportTemplateEditForm';
import CreateBackupConfigModal from '@/components/configuration/CreateBackupConfigModal';
import BackupConfigEditForm from '@/components/configuration/BackupConfigEditForm';

// API & Store
import { apiClient } from '@/lib/api';
import useAuthStore from '@/store/authStore';

// Constants
const VALUATION_COLORS = {
  'Sin problema': { color: 'bg-green-100 text-green-800' },
  'Revisar': { color: 'bg-yellow-100 text-yellow-800' },
  'Urgente': { color: 'bg-orange-100 text-orange-800' },
  'Alerta': { color: 'bg-red-100 text-red-800' },
};

const BACKUP_TYPES = {
  full: { label: 'Completo', color: 'bg-blue-100 text-blue-800' },
  incremental: { label: 'Incremental', color: 'bg-purple-100 text-purple-800' },
  differential: { label: 'Diferencial', color: 'bg-indigo-100 text-indigo-800' },
};

const TEMPLATE_TYPES = {
  pruebas: { label: 'Pruebas', color: 'bg-green-100 text-green-800' },
  resultados: { label: 'Resultados', color: 'bg-blue-100 text-blue-800' },
  usuarios: { label: 'Usuarios', color: 'bg-purple-100 text-purple-800' },
};

export default function Configuration() {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('value-configurations');

  // Value Configurations state
  const [valueConfigs, setValueConfigs] = useState([]);
  const [valueConfigsLoading, setValueConfigsLoading] = useState(false);
  const [valueConfigsFilters, setValueConfigsFilters] = useState({ testTitle: '' });
  const [showCreateValueConfigModal, setShowCreateValueConfigModal] = useState(false);
  const [showEditValueConfigModal, setShowEditValueConfigModal] = useState(false);
  const [editingValueConfig, setEditingValueConfig] = useState(null);

  // Company Configuration state
  const [companyConfigLoading, setCompanyConfigLoading] = useState(false);
  const [savingCompanyConfig, setSavingCompanyConfig] = useState(false);
  const {
    register: registerCompany,
    handleSubmit: handleSubmitCompany,
    formState: { errors: companyErrors },
    setValue: setCompanyValue,
    watch: watchCompany,
    reset: resetCompany,
  } = useForm({
    defaultValues: {
      companyName: '',
      cif: '',
      phone: '',
      email: '',
      website: '',
      address: '',
      postalCode: '',
      city: '',
      province: '',
      country: 'España',
      bankAccount: '',
      invoiceSeries: '',
      creditNoteSeries: '',
      lastInvoiceNumber: 0,
      lastCreditNoteNumber: 0,
      seriesYear: new Date().getFullYear(),
      logoUrl: '',
    },
  });

  // Import Templates state
  const [importTemplates, setImportTemplates] = useState([]);
  const [importTemplatesLoading, setImportTemplatesLoading] = useState(false);
  const [importTemplatesFilters, setImportTemplatesFilters] = useState({
    templateType: '',
    active: '',
  });
  const [showCreateImportTemplateModal, setShowCreateImportTemplateModal] = useState(false);
  const [showEditImportTemplateModal, setShowEditImportTemplateModal] = useState(false);
  const [editingImportTemplate, setEditingImportTemplate] = useState(null);

  // Backup Configurations state
  const [backupConfigs, setBackupConfigs] = useState([]);
  const [backupConfigsLoading, setBackupConfigsLoading] = useState(false);
  const [backupConfigsFilters, setBackupConfigsFilters] = useState({
    backupType: '',
    isActive: '',
  });
  const [showCreateBackupConfigModal, setShowCreateBackupConfigModal] = useState(false);
  const [showEditBackupConfigModal, setShowEditBackupConfigModal] = useState(false);
  const [editingBackupConfig, setEditingBackupConfig] = useState(null);

  // Permission check
  const isAdmin = currentUser?.userType === 'ADMINISTRADOR';

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'value-configurations') {
      loadValueConfigurations();
    } else if (activeTab === 'company-configuration') {
      loadCompanyConfiguration();
    } else if (activeTab === 'import-templates') {
      loadImportTemplates();
    } else if (activeTab === 'backup-configurations') {
      loadBackupConfigurations();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'value-configurations') {
      loadValueConfigurations();
    }
  }, [valueConfigsFilters]);

  useEffect(() => {
    if (activeTab === 'import-templates') {
      loadImportTemplates();
    }
  }, [importTemplatesFilters]);

  useEffect(() => {
    if (activeTab === 'backup-configurations') {
      loadBackupConfigurations();
    }
  }, [backupConfigsFilters]);

  // Load Value Configurations
  const loadValueConfigurations = async () => {
    try {
      setValueConfigsLoading(true);
      const params = Object.fromEntries(
        Object.entries(valueConfigsFilters).filter(([_, v]) => v !== '')
      );
      const response = await apiClient.configuration.getValueConfigurations(params);
      setValueConfigs(response.data.data || []);
    } catch (error) {
      console.error('Error loading value configurations:', error);
      toast.error('Error al cargar las configuraciones de valores');
    } finally {
      setValueConfigsLoading(false);
    }
  };

  // Load Company Configuration
  const loadCompanyConfiguration = async () => {
    try {
      setCompanyConfigLoading(true);
      const response = await apiClient.configuration.getCompanyConfiguration();
      if (response.data.data) {
        Object.entries(response.data.data).forEach(([key, value]) => {
          setCompanyValue(key, value);
        });
      }
    } catch (error) {
      console.error('Error loading company configuration:', error);
      toast.error('Error al cargar la configuración de la empresa');
    } finally {
      setCompanyConfigLoading(false);
    }
  };

  // Save Company Configuration
  const onSubmitCompanyConfig = async (data) => {
    try {
      setSavingCompanyConfig(true);
      await apiClient.configuration.updateCompanyConfiguration(data);
      toast.success('Configuración de empresa guardada correctamente');
      loadCompanyConfiguration();
    } catch (error) {
      console.error('Error saving company configuration:', error);
      toast.error(error.response?.data?.error?.message || 'Error al guardar la configuración');
    } finally {
      setSavingCompanyConfig(false);
    }
  };

  // Load Import Templates
  const loadImportTemplates = async () => {
    try {
      setImportTemplatesLoading(true);
      const params = Object.fromEntries(
        Object.entries(importTemplatesFilters).filter(([_, v]) => v !== '')
      );
      const response = await apiClient.configuration.getImportTemplates(params);
      setImportTemplates(response.data.data || []);
    } catch (error) {
      console.error('Error loading import templates:', error);
      toast.error('Error al cargar las plantillas de importación');
    } finally {
      setImportTemplatesLoading(false);
    }
  };

  // Load Backup Configurations
  const loadBackupConfigurations = async () => {
    try {
      setBackupConfigsLoading(true);
      const params = Object.fromEntries(
        Object.entries(backupConfigsFilters).filter(([_, v]) => v !== '')
      );
      const response = await apiClient.configuration.getBackupConfigurations(params);
      setBackupConfigs(response.data.data || []);
    } catch (error) {
      console.error('Error loading backup configurations:', error);
      toast.error('Error al cargar las configuraciones de backup');
    } finally {
      setBackupConfigsLoading(false);
    }
  };

  // Handlers for Value Configurations
  const handleEditValueConfig = (config) => {
    setEditingValueConfig(config);
    setShowEditValueConfigModal(true);
  };

  const handleDeleteValueConfig = async (config) => {
    if (!confirm(`¿Estás seguro de eliminar la configuración de valores para "${config.testTitle}"?`)) {
      return;
    }

    try {
      await apiClient.configuration.deleteValueConfiguration(config.id);
      toast.success('Configuración de valores eliminada correctamente');
      loadValueConfigurations();
    } catch (error) {
      console.error('Error deleting value configuration:', error);
      toast.error(error.response?.data?.error?.message || 'Error al eliminar configuración');
    }
  };

  // Handlers for Import Templates
  const handleEditImportTemplate = (template) => {
    setEditingImportTemplate(template);
    setShowEditImportTemplateModal(true);
  };

  const handleDeleteImportTemplate = async (template) => {
    if (!confirm(`¿Estás seguro de eliminar la plantilla "${template.name}"?`)) {
      return;
    }

    try {
      await apiClient.configuration.deleteImportTemplate(template.id);
      toast.success('Plantilla de importación eliminada correctamente');
      loadImportTemplates();
    } catch (error) {
      console.error('Error deleting import template:', error);
      toast.error(error.response?.data?.error?.message || 'Error al eliminar plantilla');
    }
  };

  // Handlers for Backup Configurations
  const handleEditBackupConfig = (config) => {
    setEditingBackupConfig(config);
    setShowEditBackupConfigModal(true);
  };

  const handleDeleteBackupConfig = async (config) => {
    if (!confirm(`¿Estás seguro de eliminar la configuración de backup "${config.name}"?`)) {
      return;
    }

    try {
      await apiClient.configuration.deleteBackupConfiguration(config.id);
      toast.success('Configuración de backup eliminada correctamente');
      loadBackupConfigurations();
    } catch (error) {
      console.error('Error deleting backup configuration:', error);
      toast.error(error.response?.data?.error?.message || 'Error al eliminar configuración');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  const clearValueConfigsFilters = () => {
    setValueConfigsFilters({ testTitle: '' });
  };

  const clearImportTemplatesFilters = () => {
    setImportTemplatesFilters({ templateType: '', active: '' });
  };

  const clearBackupConfigsFilters = () => {
    setBackupConfigsFilters({ backupType: '', isActive: '' });
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Settings className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Acceso Restringido
            </h2>
            <p className="text-slate-600">
              Solo los administradores pueden acceder al módulo de configuración.
            </p>
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
            <Settings className="w-8 h-8 text-emooti-blue-600" />
            Configuración del Sistema
          </h1>
          <p className="text-slate-600 mt-1">
            Gestión de valores, empresa, plantillas y backups
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="value-configurations">Configuraciones de Valores</TabsTrigger>
          <TabsTrigger value="company-configuration">Configuración de Empresa</TabsTrigger>
          <TabsTrigger value="import-templates">Plantillas de Importación</TabsTrigger>
          <TabsTrigger value="backup-configurations">Configuraciones de Backup</TabsTrigger>
        </TabsList>

        {/* Value Configurations Tab */}
        <TabsContent value="value-configurations" className="space-y-6">
          <div className="flex justify-between items-center">
            <div />
            <Button
              onClick={() => setShowCreateValueConfigModal(true)}
              className="emooti-gradient"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Configuración
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-900">Filtros</h3>
                {Object.values(valueConfigsFilters).some((v) => v !== '') && (
                  <Button variant="ghost" size="sm" onClick={clearValueConfigsFilters}>
                    Limpiar filtros
                  </Button>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por título de test..."
                  value={valueConfigsFilters.testTitle}
                  onChange={(e) =>
                    setValueConfigsFilters({ ...valueConfigsFilters, testTitle: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Value Configurations Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Título del Test
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Cantidad de Reglas
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Reglas
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Creado
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Actualizado
                      </th>
                      <th className="p-4 text-right text-sm font-semibold text-slate-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {valueConfigsLoading ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i}>
                          <td colSpan={6} className="p-4">
                            <Skeleton className="h-12 w-full" />
                          </td>
                        </tr>
                      ))
                    ) : valueConfigs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No hay configuraciones de valores disponibles
                        </td>
                      </tr>
                    ) : (
                      valueConfigs.map((config) => (
                        <motion.tr
                          key={config.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="p-4 text-sm font-medium text-slate-900">
                            {config.testTitle}
                          </td>
                          <td className="p-4 text-sm text-slate-900">
                            {config.rules?.length || 0}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {config.rules?.slice(0, 3).map((rule, idx) => (
                                <Badge
                                  key={idx}
                                  className={VALUATION_COLORS[rule.valuation]?.color}
                                >
                                  {rule.minValue}-{rule.maxValue}: {rule.valuation}
                                </Badge>
                              ))}
                              {config.rules?.length > 3 && (
                                <Badge className="bg-slate-100 text-slate-800">
                                  +{config.rules.length - 3} más
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-slate-900">
                            {formatDate(config.createdAt)}
                          </td>
                          <td className="p-4 text-sm text-slate-900">
                            {formatDate(config.updatedAt)}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditValueConfig(config)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteValueConfig(config)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Configuration Tab */}
        <TabsContent value="company-configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emooti-blue-600" />
                Información de la Empresa
              </CardTitle>
              <CardDescription>
                Configuración general de la empresa para facturación y documentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {companyConfigLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <form onSubmit={handleSubmitCompany(onSubmitCompanyConfig)} className="space-y-6">
                  {/* Información Básica */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
                      Información Básica
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Nombre de la Empresa</Label>
                        <Input
                          id="companyName"
                          placeholder="Ej: EMOOTI Hub SL"
                          {...registerCompany('companyName')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cif">CIF</Label>
                        <Input
                          id="cif"
                          placeholder="Ej: B12345678"
                          {...registerCompany('cif')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                          id="phone"
                          placeholder="Ej: +34 123 456 789"
                          {...registerCompany('phone')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Ej: info@emooti.com"
                          {...registerCompany('email')}
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="website">Sitio Web</Label>
                        <Input
                          id="website"
                          placeholder="Ej: https://www.emooti.com"
                          {...registerCompany('website')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dirección */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
                      Dirección
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input
                          id="address"
                          placeholder="Ej: Calle Principal, 123"
                          {...registerCompany('address')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Código Postal</Label>
                        <Input
                          id="postalCode"
                          placeholder="Ej: 28001"
                          {...registerCompany('postalCode')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Ciudad</Label>
                        <Input
                          id="city"
                          placeholder="Ej: Madrid"
                          {...registerCompany('city')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="province">Provincia</Label>
                        <Input
                          id="province"
                          placeholder="Ej: Madrid"
                          {...registerCompany('province')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">País</Label>
                        <Input
                          id="country"
                          placeholder="Ej: España"
                          {...registerCompany('country')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Datos Bancarios */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
                      Datos Bancarios
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="bankAccount">Cuenta Bancaria (IBAN)</Label>
                      <Input
                        id="bankAccount"
                        placeholder="Ej: ES12 1234 1234 12 1234567890"
                        {...registerCompany('bankAccount')}
                      />
                    </div>
                  </div>

                  {/* Configuración de Facturación */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
                      Configuración de Facturación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="invoiceSeries">Serie de Facturas</Label>
                        <Input
                          id="invoiceSeries"
                          placeholder="Ej: F"
                          {...registerCompany('invoiceSeries')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="creditNoteSeries">Serie de Notas de Crédito</Label>
                        <Input
                          id="creditNoteSeries"
                          placeholder="Ej: NC"
                          {...registerCompany('creditNoteSeries')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastInvoiceNumber">Último Número de Factura</Label>
                        <Input
                          id="lastInvoiceNumber"
                          type="number"
                          placeholder="Ej: 0"
                          {...registerCompany('lastInvoiceNumber')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastCreditNoteNumber">Último Número de Nota de Crédito</Label>
                        <Input
                          id="lastCreditNoteNumber"
                          type="number"
                          placeholder="Ej: 0"
                          {...registerCompany('lastCreditNoteNumber')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="seriesYear">Año de la Serie</Label>
                        <Input
                          id="seriesYear"
                          type="number"
                          placeholder="Ej: 2025"
                          {...registerCompany('seriesYear')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logo */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
                      Logo
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="logoUrl">URL del Logo</Label>
                      <Input
                        id="logoUrl"
                        placeholder="Ej: https://example.com/logo.png"
                        {...registerCompany('logoUrl')}
                      />
                      <p className="text-xs text-slate-500">
                        URL pública del logo de la empresa para facturas y documentos
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={savingCompanyConfig}
                      className="emooti-gradient text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {savingCompanyConfig ? 'Guardando...' : 'Guardar Configuración'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Templates Tab */}
        <TabsContent value="import-templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <div />
            <Button
              onClick={() => setShowCreateImportTemplateModal(true)}
              className="emooti-gradient"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Plantilla
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-900">Filtros</h3>
                {Object.values(importTemplatesFilters).some((v) => v !== '') && (
                  <Button variant="ghost" size="sm" onClick={clearImportTemplatesFilters}>
                    Limpiar filtros
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  value={importTemplatesFilters.templateType || 'ALL'}
                  onValueChange={(value) =>
                    setImportTemplatesFilters({
                      ...importTemplatesFilters,
                      templateType: value === 'ALL' ? '' : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de Plantilla" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los tipos</SelectItem>
                    <SelectItem value="pruebas">Pruebas</SelectItem>
                    <SelectItem value="resultados">Resultados</SelectItem>
                    <SelectItem value="usuarios">Usuarios</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={importTemplatesFilters.active || 'ALL'}
                  onValueChange={(value) =>
                    setImportTemplatesFilters({
                      ...importTemplatesFilters,
                      active: value === 'ALL' ? '' : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="true">Activos</SelectItem>
                    <SelectItem value="false">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Import Templates Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Nombre
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Tipo
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Descripción
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Test ID
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Campos
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Activo
                      </th>
                      <th className="p-4 text-right text-sm font-semibold text-slate-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {importTemplatesLoading ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i}>
                          <td colSpan={7} className="p-4">
                            <Skeleton className="h-12 w-full" />
                          </td>
                        </tr>
                      ))
                    ) : importTemplates.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No hay plantillas de importación disponibles
                        </td>
                      </tr>
                    ) : (
                      importTemplates.map((template) => (
                        <motion.tr
                          key={template.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="p-4 text-sm font-medium text-slate-900">
                            {template.name}
                          </td>
                          <td className="p-4">
                            <Badge className={TEMPLATE_TYPES[template.templateType]?.color}>
                              {TEMPLATE_TYPES[template.templateType]?.label}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-slate-900 max-w-xs truncate">
                            {template.description}
                          </td>
                          <td className="p-4 text-sm text-slate-900">
                            {template.relatedTestId || '-'}
                          </td>
                          <td className="p-4 text-sm text-slate-900">
                            {template.fields?.length || 0}
                          </td>
                          <td className="p-4">
                            {template.active ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-slate-400" />
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditImportTemplate(template)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteImportTemplate(template)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Configurations Tab */}
        <TabsContent value="backup-configurations" className="space-y-6">
          <div className="flex justify-between items-center">
            <div />
            <Button
              onClick={() => setShowCreateBackupConfigModal(true)}
              className="emooti-gradient"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Configuración
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-900">Filtros</h3>
                {Object.values(backupConfigsFilters).some((v) => v !== '') && (
                  <Button variant="ghost" size="sm" onClick={clearBackupConfigsFilters}>
                    Limpiar filtros
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  value={backupConfigsFilters.backupType || 'ALL'}
                  onValueChange={(value) =>
                    setBackupConfigsFilters({
                      ...backupConfigsFilters,
                      backupType: value === 'ALL' ? '' : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de Backup" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los tipos</SelectItem>
                    <SelectItem value="full">Completo</SelectItem>
                    <SelectItem value="incremental">Incremental</SelectItem>
                    <SelectItem value="differential">Diferencial</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={backupConfigsFilters.isActive || 'ALL'}
                  onValueChange={(value) =>
                    setBackupConfigsFilters({
                      ...backupConfigsFilters,
                      isActive: value === 'ALL' ? '' : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="true">Activos</SelectItem>
                    <SelectItem value="false">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Backup Configurations Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Nombre
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Descripción
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Tipo
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Retención (días)
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Ubicación
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Activo
                      </th>
                      <th className="p-4 text-right text-sm font-semibold text-slate-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {backupConfigsLoading ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i}>
                          <td colSpan={7} className="p-4">
                            <Skeleton className="h-12 w-full" />
                          </td>
                        </tr>
                      ))
                    ) : backupConfigs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No hay configuraciones de backup disponibles
                        </td>
                      </tr>
                    ) : (
                      backupConfigs.map((config) => (
                        <motion.tr
                          key={config.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="p-4 text-sm font-medium text-slate-900">
                            {config.name}
                          </td>
                          <td className="p-4 text-sm text-slate-900 max-w-xs truncate">
                            {config.description}
                          </td>
                          <td className="p-4">
                            <Badge className={BACKUP_TYPES[config.backupType]?.color}>
                              {BACKUP_TYPES[config.backupType]?.label}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-slate-900">
                            {config.retentionDays}
                          </td>
                          <td className="p-4 text-sm text-slate-900 max-w-xs truncate">
                            {config.storageLocation}
                          </td>
                          <td className="p-4">
                            {config.isActive ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-slate-400" />
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditBackupConfig(config)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteBackupConfig(config)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showCreateValueConfigModal && (
        <CreateValueConfigModal
          open={showCreateValueConfigModal}
          onClose={() => setShowCreateValueConfigModal(false)}
          onSuccess={() => {
            setShowCreateValueConfigModal(false);
            loadValueConfigurations();
          }}
        />
      )}

      {showEditValueConfigModal && editingValueConfig && (
        <ValueConfigEditForm
          open={showEditValueConfigModal}
          onClose={() => {
            setShowEditValueConfigModal(false);
            setEditingValueConfig(null);
          }}
          onSuccess={() => {
            setShowEditValueConfigModal(false);
            setEditingValueConfig(null);
            loadValueConfigurations();
          }}
          config={editingValueConfig}
        />
      )}

      {showCreateImportTemplateModal && (
        <CreateImportTemplateModal
          open={showCreateImportTemplateModal}
          onClose={() => setShowCreateImportTemplateModal(false)}
          onSuccess={() => {
            setShowCreateImportTemplateModal(false);
            loadImportTemplates();
          }}
        />
      )}

      {showEditImportTemplateModal && editingImportTemplate && (
        <ImportTemplateEditForm
          open={showEditImportTemplateModal}
          onClose={() => {
            setShowEditImportTemplateModal(false);
            setEditingImportTemplate(null);
          }}
          onSuccess={() => {
            setShowEditImportTemplateModal(false);
            setEditingImportTemplate(null);
            loadImportTemplates();
          }}
          template={editingImportTemplate}
        />
      )}

      {showCreateBackupConfigModal && (
        <CreateBackupConfigModal
          open={showCreateBackupConfigModal}
          onClose={() => setShowCreateBackupConfigModal(false)}
          onSuccess={() => {
            setShowCreateBackupConfigModal(false);
            loadBackupConfigurations();
          }}
        />
      )}

      {showEditBackupConfigModal && editingBackupConfig && (
        <BackupConfigEditForm
          open={showEditBackupConfigModal}
          onClose={() => {
            setShowEditBackupConfigModal(false);
            setEditingBackupConfig(null);
          }}
          onSuccess={() => {
            setShowEditBackupConfigModal(false);
            setEditingBackupConfig(null);
            loadBackupConfigurations();
          }}
          config={editingBackupConfig}
        />
      )}
    </div>
  );
}
