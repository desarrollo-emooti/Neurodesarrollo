import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Shield,
  Activity,
  AlertTriangle,
  FileText,
  Database,
  Eye,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
} from 'lucide-react';

// Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';

// Charts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Modals
import ResolveAlertModal from '@/components/security/ResolveAlertModal';
import CreateRetentionPolicyModal from '@/components/security/CreateRetentionPolicyModal';
import RetentionPolicyEditForm from '@/components/security/RetentionPolicyEditForm';
import CreateAnonymizationLogModal from '@/components/security/CreateAnonymizationLogModal';

// API & Store
import { apiClient } from '@/lib/api';
import useAuthStore from '@/store/authStore';

// Constants
const SEVERITY = {
  LOW: { label: 'Baja', color: 'bg-green-100 text-green-800' },
  MEDIUM: { label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
  HIGH: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  CRITICAL: { label: 'Crítica', color: 'bg-red-100 text-red-800' },
};

const ALERT_STATUS = {
  ACTIVE: { label: 'Activa', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  INVESTIGATING: { label: 'Investigando', color: 'bg-blue-100 text-blue-800', icon: Activity },
  RESOLVED: { label: 'Resuelta', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  FALSE_POSITIVE: { label: 'Falso Positivo', color: 'bg-slate-100 text-slate-800', icon: XCircle },
};

const RETENTION_STATUS = {
  ACTIVE: { label: 'Activa', color: 'bg-green-100 text-green-800' },
  INACTIVE: { label: 'Inactiva', color: 'bg-slate-100 text-slate-800' },
  SUSPENDED: { label: 'Suspendida', color: 'bg-red-100 text-red-800' },
};

export default function Security() {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dashboard state
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsPage, setAuditLogsPage] = useState(1);
  const [auditLogsMeta, setAuditLogsMeta] = useState({});
  const [auditLogsFilters, setAuditLogsFilters] = useState({
    userId: '',
    action: '',
    resourceType: '',
    startDate: '',
    endDate: '',
    search: '',
  });
  const [expandedLogId, setExpandedLogId] = useState(null);

  // Anomaly Alerts state
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsPage, setAlertsPage] = useState(1);
  const [alertsMeta, setAlertsMeta] = useState({});
  const [alertsFilters, setAlertsFilters] = useState({
    type: '',
    severity: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Retention Policies state
  const [policies, setPolicies] = useState([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policiesPage, setPoliciesPage] = useState(1);
  const [policiesMeta, setPoliciesMeta] = useState({});
  const [policiesFilters, setPoliciesFilters] = useState({
    entityType: '',
    status: '',
  });
  const [showCreatePolicyModal, setShowCreatePolicyModal] = useState(false);
  const [showEditPolicyModal, setShowEditPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);

  // Anonymization Logs state
  const [anonymizationLogs, setAnonymizationLogs] = useState([]);
  const [anonymizationLoading, setAnonymizationLoading] = useState(false);
  const [anonymizationPage, setAnonymizationPage] = useState(1);
  const [anonymizationMeta, setAnonymizationMeta] = useState({});
  const [anonymizationFilters, setAnonymizationFilters] = useState({
    entityType: '',
    requestedBy: '',
  });
  const [showCreateAnonymizationModal, setShowCreateAnonymizationModal] = useState(false);

  // Permission check
  const isAdmin = currentUser?.userType === 'ADMINISTRADOR';

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboard();
    } else if (activeTab === 'audit-logs') {
      loadAuditLogs();
    } else if (activeTab === 'anomaly-alerts') {
      loadAnomalyAlerts();
    } else if (activeTab === 'retention-policies') {
      loadRetentionPolicies();
    } else if (activeTab === 'anonymization-logs') {
      loadAnonymizationLogs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'audit-logs') {
      loadAuditLogs();
    }
  }, [auditLogsPage, auditLogsFilters]);

  useEffect(() => {
    if (activeTab === 'anomaly-alerts') {
      loadAnomalyAlerts();
    }
  }, [alertsPage, alertsFilters]);

  useEffect(() => {
    if (activeTab === 'retention-policies') {
      loadRetentionPolicies();
    }
  }, [policiesPage, policiesFilters]);

  useEffect(() => {
    if (activeTab === 'anonymization-logs') {
      loadAnonymizationLogs();
    }
  }, [anonymizationPage, anonymizationFilters]);

  // Load Dashboard
  const loadDashboard = async () => {
    try {
      setDashboardLoading(true);
      const response = await apiClient.security.getDashboard();
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Error al cargar el dashboard de seguridad');
    } finally {
      setDashboardLoading(false);
    }
  };

  // Load Audit Logs
  const loadAuditLogs = async () => {
    try {
      setAuditLogsLoading(true);
      const params = {
        page: auditLogsPage,
        limit: 20,
        ...Object.fromEntries(
          Object.entries(auditLogsFilters).filter(([_, v]) => v !== '')
        ),
      };
      const response = await apiClient.security.getAuditLogs(params);
      setAuditLogs(response.data.data || []);
      setAuditLogsMeta(response.data.meta || {});
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Error al cargar los registros de auditoría');
    } finally {
      setAuditLogsLoading(false);
    }
  };

  // Load Anomaly Alerts
  const loadAnomalyAlerts = async () => {
    try {
      setAlertsLoading(true);
      const params = {
        page: alertsPage,
        limit: 20,
        ...Object.fromEntries(
          Object.entries(alertsFilters).filter(([_, v]) => v !== '')
        ),
      };
      const response = await apiClient.security.getAnomalyAlerts(params);
      setAlerts(response.data.data || []);
      setAlertsMeta(response.data.meta || {});
    } catch (error) {
      console.error('Error loading anomaly alerts:', error);
      toast.error('Error al cargar las alertas de anomalías');
    } finally {
      setAlertsLoading(false);
    }
  };

  // Load Retention Policies
  const loadRetentionPolicies = async () => {
    try {
      setPoliciesLoading(true);
      const params = {
        page: policiesPage,
        limit: 20,
        ...Object.fromEntries(
          Object.entries(policiesFilters).filter(([_, v]) => v !== '')
        ),
      };
      const response = await apiClient.security.getRetentionPolicies(params);
      setPolicies(response.data.data || []);
      setPoliciesMeta(response.data.meta || {});
    } catch (error) {
      console.error('Error loading retention policies:', error);
      toast.error('Error al cargar las políticas de retención');
    } finally {
      setPoliciesLoading(false);
    }
  };

  // Load Anonymization Logs
  const loadAnonymizationLogs = async () => {
    try {
      setAnonymizationLoading(true);
      const params = {
        page: anonymizationPage,
        limit: 20,
        ...Object.fromEntries(
          Object.entries(anonymizationFilters).filter(([_, v]) => v !== '')
        ),
      };
      const response = await apiClient.security.getAnonymizationLogs(params);
      setAnonymizationLogs(response.data.data || []);
      setAnonymizationMeta(response.data.meta || {});
    } catch (error) {
      console.error('Error loading anonymization logs:', error);
      toast.error('Error al cargar los registros de anonimización');
    } finally {
      setAnonymizationLoading(false);
    }
  };

  // Handlers
  const handleResolveAlert = (alert) => {
    setSelectedAlert(alert);
    setShowResolveModal(true);
  };

  const handleEditPolicy = (policy) => {
    setEditingPolicy(policy);
    setShowEditPolicyModal(true);
  };

  const handleDeletePolicy = async (policy) => {
    if (!confirm(`¿Estás seguro de eliminar la política de retención para ${policy.entityType}?`)) {
      return;
    }

    try {
      await apiClient.security.deleteRetentionPolicy(policy.id);
      toast.success('Política de retención eliminada correctamente');
      loadRetentionPolicies();
    } catch (error) {
      console.error('Error deleting retention policy:', error);
      toast.error(error.response?.data?.error?.message || 'Error al eliminar política de retención');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  const formatDateOnly = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const clearAuditFilters = () => {
    setAuditLogsFilters({
      userId: '',
      action: '',
      resourceType: '',
      startDate: '',
      endDate: '',
      search: '',
    });
    setAuditLogsPage(1);
  };

  const clearAlertFilters = () => {
    setAlertsFilters({
      type: '',
      severity: '',
      status: '',
      startDate: '',
      endDate: '',
    });
    setAlertsPage(1);
  };

  const clearPolicyFilters = () => {
    setPoliciesFilters({
      entityType: '',
      status: '',
    });
    setPoliciesPage(1);
  };

  const clearAnonymizationFilters = () => {
    setAnonymizationFilters({
      entityType: '',
      requestedBy: '',
    });
    setAnonymizationPage(1);
  };

  // Prepare chart data
  const getAuditLogChartData = () => {
    if (!dashboardData?.auditLogsByAction) return [];
    return Object.entries(dashboardData.auditLogsByAction).map(([action, count]) => ({
      name: action.replace(/_/g, ' '),
      count,
    }));
  };

  const getAnomalyAlertChartData = () => {
    if (!dashboardData?.anomalyAlertsByType) return [];
    return Object.entries(dashboardData.anomalyAlertsByType).map(([type, count]) => ({
      name: type.replace(/_/g, ' '),
      count,
    }));
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Acceso Restringido
            </h2>
            <p className="text-slate-600">
              Solo los administradores pueden acceder al módulo de seguridad.
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
            <Shield className="w-8 h-8 text-emooti-blue-600" />
            Seguridad y Auditoría
          </h1>
          <p className="text-slate-600 mt-1">
            Gestión de seguridad, auditoría y cumplimiento normativo
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Panel de Control</TabsTrigger>
          <TabsTrigger value="audit-logs">Registros de Auditoría</TabsTrigger>
          <TabsTrigger value="anomaly-alerts">Alertas de Anomalías</TabsTrigger>
          <TabsTrigger value="retention-policies">Políticas de Retención</TabsTrigger>
          <TabsTrigger value="anonymization-logs">Registros de Anonimización</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {dashboardLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Logs de Hoy</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {dashboardData?.todayLogs || 0}
                        </p>
                      </div>
                      <FileText className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Alertas Activas</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {dashboardData?.activeAlerts || 0}
                        </p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Usuarios Totales</p>
                        <p className="text-2xl font-bold text-green-600">
                          {dashboardData?.totalUsers || 0}
                        </p>
                      </div>
                      <Activity className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Intentos Fallidos (7d)</p>
                        <p className="text-2xl font-bold text-red-600">
                          {dashboardData?.failedLogins || 0}
                        </p>
                      </div>
                      <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Logs de Auditoría por Acción (7 días)</CardTitle>
                    <CardDescription>Distribución de acciones registradas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getAuditLogChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#3b82f6" name="Cantidad" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Alertas de Anomalías por Tipo (7 días)</CardTitle>
                    <CardDescription>Distribución de alertas detectadas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getAnomalyAlertChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#f59e0b" name="Cantidad" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle>Alertas Activas Recientes</CardTitle>
                  <CardDescription>Últimas 10 alertas que requieren atención</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="p-3 text-left text-sm font-semibold text-slate-700">
                            Fecha
                          </th>
                          <th className="p-3 text-left text-sm font-semibold text-slate-700">
                            Tipo
                          </th>
                          <th className="p-3 text-left text-sm font-semibold text-slate-700">
                            Severidad
                          </th>
                          <th className="p-3 text-left text-sm font-semibold text-slate-700">
                            Usuario
                          </th>
                          <th className="p-3 text-left text-sm font-semibold text-slate-700">
                            Descripción
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {!dashboardData?.recentAlerts?.length ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-500">
                              No hay alertas activas
                            </td>
                          </tr>
                        ) : (
                          dashboardData.recentAlerts.map((alert) => (
                            <tr key={alert.id} className="hover:bg-slate-50">
                              <td className="p-3 text-sm text-slate-900">
                                {formatDate(alert.detectedAt)}
                              </td>
                              <td className="p-3 text-sm text-slate-900">{alert.type}</td>
                              <td className="p-3">
                                <Badge className={SEVERITY[alert.severity]?.color}>
                                  {SEVERITY[alert.severity]?.label}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm text-slate-900">
                                {alert.user?.fullName || '-'}
                              </td>
                              <td className="p-3 text-sm text-slate-900">
                                {alert.description}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit-logs" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-900">Filtros</h3>
                {Object.values(auditLogsFilters).some((v) => v !== '') && (
                  <Button variant="ghost" size="sm" onClick={clearAuditFilters}>
                    Limpiar filtros
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar por usuario, recurso..."
                    value={auditLogsFilters.search}
                    onChange={(e) =>
                      setAuditLogsFilters({ ...auditLogsFilters, search: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>

                <Select
                  value={auditLogsFilters.action || 'ALL'}
                  onValueChange={(value) =>
                    setAuditLogsFilters({
                      ...auditLogsFilters,
                      action: value === 'ALL' ? '' : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Acción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas las acciones</SelectItem>
                    <SelectItem value="DATA_ACCESS">Acceso a Datos</SelectItem>
                    <SelectItem value="DATA_MODIFICATION">Modificación de Datos</SelectItem>
                    <SelectItem value="USER_AUTHENTICATION">Autenticación de Usuario</SelectItem>
                    <SelectItem value="UNAUTHORIZED_ACCESS_ATTEMPT">
                      Intento de Acceso No Autorizado
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={auditLogsFilters.resourceType || 'ALL'}
                  onValueChange={(value) =>
                    setAuditLogsFilters({
                      ...auditLogsFilters,
                      resourceType: value === 'ALL' ? '' : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de Recurso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los tipos</SelectItem>
                    <SelectItem value="User">Usuario</SelectItem>
                    <SelectItem value="Student">Estudiante</SelectItem>
                    <SelectItem value="TestResult">Resultado de Test</SelectItem>
                    <SelectItem value="Invoice">Factura</SelectItem>
                  </SelectContent>
                </Select>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Desde</Label>
                  <Input
                    type="date"
                    value={auditLogsFilters.startDate}
                    onChange={(e) =>
                      setAuditLogsFilters({ ...auditLogsFilters, startDate: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Hasta</Label>
                  <Input
                    type="date"
                    value={auditLogsFilters.endDate}
                    onChange={(e) =>
                      setAuditLogsFilters({ ...auditLogsFilters, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Timestamp
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Usuario
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Acción
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Tipo de Recurso
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        ID de Recurso
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        IP Address
                      </th>
                      <th className="p-4 text-right text-sm font-semibold text-slate-700">
                        Detalles
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {auditLogsLoading ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i}>
                          <td colSpan={7} className="p-4">
                            <Skeleton className="h-12 w-full" />
                          </td>
                        </tr>
                      ))
                    ) : auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No hay registros de auditoría disponibles
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <React.Fragment key={log.id}>
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="p-4 text-sm text-slate-900">
                              {formatDate(log.timestamp)}
                            </td>
                            <td className="p-4">
                              <div>
                                <p className="text-sm font-medium text-slate-900">
                                  {log.user?.fullName || '-'}
                                </p>
                                <p className="text-xs text-slate-500">{log.user?.email || '-'}</p>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-slate-900">
                              {log.action.replace(/_/g, ' ')}
                            </td>
                            <td className="p-4 text-sm text-slate-900">
                              {log.resourceType || '-'}
                            </td>
                            <td className="p-4 text-sm font-mono text-slate-600">
                              {log.resourceId || '-'}
                            </td>
                            <td className="p-4 text-sm text-slate-900">{log.ipAddress || '-'}</td>
                            <td className="p-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setExpandedLogId(expandedLogId === log.id ? null : log.id)
                                }
                              >
                                {expandedLogId === log.id ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                            </td>
                          </motion.tr>
                          {expandedLogId === log.id && (
                            <tr>
                              <td colSpan={7} className="p-4 bg-slate-50">
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold text-slate-900">
                                    Detalles Completos
                                  </h4>
                                  <pre className="text-xs bg-white p-3 rounded border border-slate-200 overflow-x-auto">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                  {log.userAgent && (
                                    <div className="text-xs text-slate-600">
                                      <strong>User Agent:</strong> {log.userAgent}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {auditLogsMeta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                  <p className="text-sm text-slate-600">
                    Mostrando {auditLogs.length} de {auditLogsMeta.total} registros
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAuditLogsPage(auditLogsPage - 1)}
                      disabled={auditLogsPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAuditLogsPage(auditLogsPage + 1)}
                      disabled={auditLogsPage === auditLogsMeta.totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomaly Alerts Tab */}
        <TabsContent value="anomaly-alerts" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-900">Filtros</h3>
                {Object.values(alertsFilters).some((v) => v !== '') && (
                  <Button variant="ghost" size="sm" onClick={clearAlertFilters}>
                    Limpiar filtros
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Tipo de alerta..."
                  value={alertsFilters.type}
                  onChange={(e) => setAlertsFilters({ ...alertsFilters, type: e.target.value })}
                />

                <Select
                  value={alertsFilters.severity || 'ALL'}
                  onValueChange={(value) =>
                    setAlertsFilters({
                      ...alertsFilters,
                      severity: value === 'ALL' ? '' : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Severidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas las severidades</SelectItem>
                    <SelectItem value="LOW">Baja</SelectItem>
                    <SelectItem value="MEDIUM">Media</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="CRITICAL">Crítica</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={alertsFilters.status || 'ALL'}
                  onValueChange={(value) =>
                    setAlertsFilters({
                      ...alertsFilters,
                      status: value === 'ALL' ? '' : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los estados</SelectItem>
                    <SelectItem value="ACTIVE">Activa</SelectItem>
                    <SelectItem value="INVESTIGATING">Investigando</SelectItem>
                    <SelectItem value="RESOLVED">Resuelta</SelectItem>
                    <SelectItem value="FALSE_POSITIVE">Falso Positivo</SelectItem>
                  </SelectContent>
                </Select>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Desde</Label>
                  <Input
                    type="date"
                    value={alertsFilters.startDate}
                    onChange={(e) =>
                      setAlertsFilters({ ...alertsFilters, startDate: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Hasta</Label>
                  <Input
                    type="date"
                    value={alertsFilters.endDate}
                    onChange={(e) =>
                      setAlertsFilters({ ...alertsFilters, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Detectada
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">Tipo</th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Severidad
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Usuario
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Descripción
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Estado
                      </th>
                      <th className="p-4 text-right text-sm font-semibold text-slate-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {alertsLoading ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i}>
                          <td colSpan={7} className="p-4">
                            <Skeleton className="h-12 w-full" />
                          </td>
                        </tr>
                      ))
                    ) : alerts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No hay alertas de anomalías disponibles
                        </td>
                      </tr>
                    ) : (
                      alerts.map((alert) => (
                        <motion.tr
                          key={alert.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="p-4 text-sm text-slate-900">
                            {formatDate(alert.detectedAt)}
                          </td>
                          <td className="p-4 text-sm text-slate-900">{alert.type}</td>
                          <td className="p-4">
                            <Badge className={SEVERITY[alert.severity]?.color}>
                              {SEVERITY[alert.severity]?.label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {alert.user?.fullName || '-'}
                              </p>
                              <p className="text-xs text-slate-500">{alert.user?.email || '-'}</p>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-slate-900 max-w-xs truncate">
                            {alert.description}
                          </td>
                          <td className="p-4">
                            <Badge className={ALERT_STATUS[alert.status]?.color}>
                              {ALERT_STATUS[alert.status]?.label}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            {alert.status !== 'RESOLVED' &&
                              alert.status !== 'FALSE_POSITIVE' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResolveAlert(alert)}
                                  title="Resolver alerta"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {alertsMeta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                  <p className="text-sm text-slate-600">
                    Mostrando {alerts.length} de {alertsMeta.total} alertas
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAlertsPage(alertsPage - 1)}
                      disabled={alertsPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAlertsPage(alertsPage + 1)}
                      disabled={alertsPage === alertsMeta.totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retention Policies Tab */}
        <TabsContent value="retention-policies" className="space-y-6">
          <div className="flex justify-between items-center">
            <div />
            <Button onClick={() => setShowCreatePolicyModal(true)} className="emooti-gradient">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Política
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-900">Filtros</h3>
                {Object.values(policiesFilters).some((v) => v !== '') && (
                  <Button variant="ghost" size="sm" onClick={clearPolicyFilters}>
                    Limpiar filtros
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Tipo de entidad..."
                  value={policiesFilters.entityType}
                  onChange={(e) =>
                    setPoliciesFilters({ ...policiesFilters, entityType: e.target.value })
                  }
                />

                <Select
                  value={policiesFilters.status || 'ALL'}
                  onValueChange={(value) =>
                    setPoliciesFilters({
                      ...policiesFilters,
                      status: value === 'ALL' ? '' : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los estados</SelectItem>
                    <SelectItem value="ACTIVE">Activa</SelectItem>
                    <SelectItem value="INACTIVE">Inactiva</SelectItem>
                    <SelectItem value="SUSPENDED">Suspendida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Policies Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Tipo de Entidad
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Retención (años)
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Campo Disparador
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Auto Aplicar
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Período de Gracia
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Estado
                      </th>
                      <th className="p-4 text-right text-sm font-semibold text-slate-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {policiesLoading ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i}>
                          <td colSpan={7} className="p-4">
                            <Skeleton className="h-12 w-full" />
                          </td>
                        </tr>
                      ))
                    ) : policies.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No hay políticas de retención disponibles
                        </td>
                      </tr>
                    ) : (
                      policies.map((policy) => (
                        <motion.tr
                          key={policy.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="p-4 text-sm font-medium text-slate-900">
                            {policy.entityType}
                          </td>
                          <td className="p-4 text-sm text-slate-900">{policy.retentionYears}</td>
                          <td className="p-4 text-sm text-slate-900">{policy.triggerField}</td>
                          <td className="p-4">
                            <Badge
                              className={
                                policy.autoApply
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-slate-100 text-slate-800'
                              }
                            >
                              {policy.autoApply ? 'Sí' : 'No'}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-slate-900">
                            {policy.gracePeriodDays} días
                          </td>
                          <td className="p-4">
                            <Badge className={RETENTION_STATUS[policy.status]?.color}>
                              {RETENTION_STATUS[policy.status]?.label}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPolicy(policy)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePolicy(policy)}
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

              {/* Pagination */}
              {policiesMeta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                  <p className="text-sm text-slate-600">
                    Mostrando {policies.length} de {policiesMeta.total} políticas
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPoliciesPage(policiesPage - 1)}
                      disabled={policiesPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPoliciesPage(policiesPage + 1)}
                      disabled={policiesPage === policiesMeta.totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anonymization Logs Tab */}
        <TabsContent value="anonymization-logs" className="space-y-6">
          <div className="flex justify-between items-center">
            <div />
            <Button
              onClick={() => setShowCreateAnonymizationModal(true)}
              className="emooti-gradient"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Registro
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-900">Filtros</h3>
                {Object.values(anonymizationFilters).some((v) => v !== '') && (
                  <Button variant="ghost" size="sm" onClick={clearAnonymizationFilters}>
                    Limpiar filtros
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Tipo de entidad..."
                  value={anonymizationFilters.entityType}
                  onChange={(e) =>
                    setAnonymizationFilters({ ...anonymizationFilters, entityType: e.target.value })
                  }
                />

                <Input
                  placeholder="Solicitado por..."
                  value={anonymizationFilters.requestedBy}
                  onChange={(e) =>
                    setAnonymizationFilters({
                      ...anonymizationFilters,
                      requestedBy: e.target.value,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Anonymization Logs Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Creado
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Request ID
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Tipo de Entidad
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Registros Procesados
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Método
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        K-Anonymity Score
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700">
                        Propósito
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {anonymizationLoading ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i}>
                          <td colSpan={7} className="p-4">
                            <Skeleton className="h-12 w-full" />
                          </td>
                        </tr>
                      ))
                    ) : anonymizationLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No hay registros de anonimización disponibles
                        </td>
                      </tr>
                    ) : (
                      anonymizationLogs.map((log) => (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="p-4 text-sm text-slate-900">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="p-4 text-sm font-mono text-slate-600">
                            {log.requestId}
                          </td>
                          <td className="p-4 text-sm text-slate-900">{log.entityType}</td>
                          <td className="p-4 text-sm text-slate-900">{log.recordsProcessed}</td>
                          <td className="p-4 text-sm text-slate-900">
                            {log.anonymizationMethod}
                          </td>
                          <td className="p-4 text-sm text-slate-900">
                            {log.kAnonymityScore || '-'}
                          </td>
                          <td className="p-4 text-sm text-slate-900 max-w-xs truncate">
                            {log.purpose}
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {anonymizationMeta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                  <p className="text-sm text-slate-600">
                    Mostrando {anonymizationLogs.length} de {anonymizationMeta.total} registros
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAnonymizationPage(anonymizationPage - 1)}
                      disabled={anonymizationPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAnonymizationPage(anonymizationPage + 1)}
                      disabled={anonymizationPage === anonymizationMeta.totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showResolveModal && selectedAlert && (
        <ResolveAlertModal
          open={showResolveModal}
          onClose={() => {
            setShowResolveModal(false);
            setSelectedAlert(null);
          }}
          onSuccess={() => {
            setShowResolveModal(false);
            setSelectedAlert(null);
            loadAnomalyAlerts();
          }}
          alert={selectedAlert}
        />
      )}

      {showCreatePolicyModal && (
        <CreateRetentionPolicyModal
          open={showCreatePolicyModal}
          onClose={() => setShowCreatePolicyModal(false)}
          onSuccess={() => {
            setShowCreatePolicyModal(false);
            loadRetentionPolicies();
          }}
        />
      )}

      {showEditPolicyModal && editingPolicy && (
        <RetentionPolicyEditForm
          open={showEditPolicyModal}
          onClose={() => {
            setShowEditPolicyModal(false);
            setEditingPolicy(null);
          }}
          onSuccess={() => {
            setShowEditPolicyModal(false);
            setEditingPolicy(null);
            loadRetentionPolicies();
          }}
          policy={editingPolicy}
        />
      )}

      {showCreateAnonymizationModal && (
        <CreateAnonymizationLogModal
          open={showCreateAnonymizationModal}
          onClose={() => setShowCreateAnonymizationModal(false)}
          onSuccess={() => {
            setShowCreateAnonymizationModal(false);
            loadAnonymizationLogs();
          }}
        />
      )}
    </div>
  );
}
