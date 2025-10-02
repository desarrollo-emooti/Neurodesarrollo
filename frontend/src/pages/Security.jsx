import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import {
  Shield,
  AlertTriangle,
  Eye,
  Clock,
  FileText,
  Users,
  Database,
  CheckCircle,
  XCircle,
  Activity,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { formatDateTime, formatNumber } from '../lib/utils';

const Security = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Fetch RGPD dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    'rgpd-dashboard',
    () => apiClient.get('/rgpd/dashboard'),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Fetch audit logs
  const { data: auditLogsData, isLoading: auditLogsLoading } = useQuery(
    'audit-logs',
    () => apiClient.get('/rgpd/audit-logs', { params: { limit: 10 } }),
    {
      enabled: activeTab === 'audit-logs',
    }
  );

  // Fetch anomaly alerts
  const { data: anomaliesData, isLoading: anomaliesLoading } = useQuery(
    'anomaly-alerts',
    () => apiClient.get('/rgpd/anomaly-alerts', { params: { limit: 10 } }),
    {
      enabled: activeTab === 'anomalies',
    }
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'audit-logs', label: 'Logs de Auditoría', icon: FileText },
    { id: 'anomalies', label: 'Alertas de Anomalías', icon: AlertTriangle },
    { id: 'retention', label: 'Políticas de Retención', icon: Clock },
    { id: 'consent', label: 'Gestión de Consentimientos', icon: CheckCircle },
    { id: 'data-subjects', label: 'Solicitudes de Datos', icon: Users },
  ];

  const StatCard = ({ title, value, icon: Icon, color, trend, isLoading }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="emooti-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">{title}</p>
              <p className="text-3xl font-bold text-slate-900">
                {isLoading ? <Skeleton className="h-8 w-16" /> : formatNumber(value)}
              </p>
              {trend && (
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">{trend}</span>
                </div>
              )}
            </div>
            <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-xl flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const DashboardTab = () => {
    const stats = dashboardData?.data?.statistics || {};
    const recentActivity = dashboardData?.data?.recentActivity || {};

    return (
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Logs de Auditoría"
            value={stats.auditLogsCount || 0}
            icon={FileText}
            color="from-blue-500 to-blue-600"
            isLoading={dashboardLoading}
          />
          <StatCard
            title="Alertas de Anomalías"
            value={stats.anomaliesCount || 0}
            icon={AlertTriangle}
            color="from-orange-500 to-orange-600"
            isLoading={dashboardLoading}
          />
          <StatCard
            title="Alertas Pendientes"
            value={stats.pendingAnomaliesCount || 0}
            icon={Clock}
            color="from-red-500 to-red-600"
            isLoading={dashboardLoading}
          />
          <StatCard
            title="Políticas de Retención"
            value={stats.retentionPoliciesCount || 0}
            icon={Database}
            color="from-purple-500 to-purple-600"
            isLoading={dashboardLoading}
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="emooti-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Actividad Reciente</span>
              </CardTitle>
              <CardDescription>
                Últimos logs de auditoría del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.auditLogs?.map((log) => (
                    <div key={log.id} className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {log.action} - {log.entityType}
                        </p>
                        <p className="text-xs text-slate-500">
                          {log.user?.fullName} • {formatDateTime(log.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="emooti-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Alertas Recientes</span>
              </CardTitle>
              <CardDescription>
                Últimas anomalías detectadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.anomalies?.map((anomaly) => (
                    <div key={anomaly.id} className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        anomaly.severity === 'CRITICAL' ? 'bg-red-100' :
                        anomaly.severity === 'HIGH' ? 'bg-orange-100' :
                        anomaly.severity === 'MEDIUM' ? 'bg-yellow-100' : 'bg-green-100'
                      }`}>
                        <AlertTriangle className={`w-5 h-5 ${
                          anomaly.severity === 'CRITICAL' ? 'text-red-600' :
                          anomaly.severity === 'HIGH' ? 'text-orange-600' :
                          anomaly.severity === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {anomaly.action}
                        </p>
                        <p className="text-xs text-slate-500">
                          {anomaly.user?.fullName} • {formatDateTime(anomaly.detectedAt)}
                        </p>
                      </div>
                      <Badge variant={
                        anomaly.severity === 'CRITICAL' ? 'error' :
                        anomaly.severity === 'HIGH' ? 'warning' :
                        anomaly.severity === 'MEDIUM' ? 'info' : 'success'
                      }>
                        {anomaly.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const AuditLogsTab = () => (
    <Card className="emooti-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Logs de Auditoría</span>
        </CardTitle>
        <CardDescription>
          Registro completo de todas las actividades del sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {auditLogsLoading ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {auditLogsData?.data?.map((log) => (
              <div key={log.id} className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {log.action} - {log.entityType}
                  </p>
                  <p className="text-xs text-slate-500">
                    {log.user?.fullName} • {formatDateTime(log.timestamp)}
                  </p>
                  {log.details && (
                    <p className="text-xs text-slate-400 mt-1">
                      {JSON.stringify(log.details).substring(0, 100)}...
                    </p>
                  )}
                </div>
                <Badge variant="info">
                  {log.action}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const AnomaliesTab = () => (
    <Card className="emooti-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5" />
          <span>Alertas de Anomalías</span>
        </CardTitle>
        <CardDescription>
          Detección automática de comportamientos anómalos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {anomaliesLoading ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {anomaliesData?.data?.map((anomaly) => (
              <div key={anomaly.id} className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  anomaly.severity === 'CRITICAL' ? 'bg-red-100' :
                  anomaly.severity === 'HIGH' ? 'bg-orange-100' :
                  anomaly.severity === 'MEDIUM' ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${
                    anomaly.severity === 'CRITICAL' ? 'text-red-600' :
                    anomaly.severity === 'HIGH' ? 'text-orange-600' :
                    anomaly.severity === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {anomaly.action}
                  </p>
                  <p className="text-xs text-slate-500">
                    {anomaly.user?.fullName} • {formatDateTime(anomaly.detectedAt)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Risk Score: {anomaly.riskScore}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={
                    anomaly.severity === 'CRITICAL' ? 'error' :
                    anomaly.severity === 'HIGH' ? 'warning' :
                    anomaly.severity === 'MEDIUM' ? 'info' : 'success'
                  }>
                    {anomaly.severity}
                  </Badge>
                  <Badge variant={
                    anomaly.status === 'PENDING' ? 'warning' :
                    anomaly.status === 'RESOLVED' ? 'success' : 'info'
                  }>
                    {anomaly.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'audit-logs':
        return <AuditLogsTab />;
      case 'anomalies':
        return <AnomaliesTab />;
      case 'retention':
        return (
          <Card className="emooti-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Políticas de Retención</span>
              </CardTitle>
              <CardDescription>
                Gestión de políticas de retención de datos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-slate-500 py-8">
                <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>Funcionalidad en desarrollo</p>
              </div>
            </CardContent>
          </Card>
        );
      case 'consent':
        return (
          <Card className="emooti-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Gestión de Consentimientos</span>
              </CardTitle>
              <CardDescription>
                Registro y gestión de consentimientos RGPD
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-slate-500 py-8">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>Funcionalidad en desarrollo</p>
              </div>
            </CardContent>
          </Card>
        );
      case 'data-subjects':
        return (
          <Card className="emooti-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Solicitudes de Datos</span>
              </CardTitle>
              <CardDescription>
                Gestión de solicitudes de derechos de datos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-slate-500 py-8">
                <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>Funcionalidad en desarrollo</p>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Seguridad RGPD
            </h1>
            <p className="text-slate-600 mt-1">
              Gestión de compliance y seguridad de datos
            </p>
          </div>
          <Badge variant="info" className="text-sm">
            <Shield className="w-4 h-4 mr-1" />
            RGPD Compliant
          </Badge>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderTabContent()}
      </motion.div>
    </div>
  );
};

export default Security;

