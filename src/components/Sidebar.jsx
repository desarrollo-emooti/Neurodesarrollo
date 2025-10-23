import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  ClipboardList,
  FileText,
  Brain,
  Calendar,
  Tablet,
  Package,
  CreditCard,
  Receipt,
  Shield,
  Settings,
  Download,
  Upload,
  BookOpen,
  BarChart3,
  TrendingUp,
  Database,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  History,
  FileBarChart,
  DollarSign,
  Wrench,
  UserCheck,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useAppStore from '../store/appStore';
import { cn } from '../lib/utils';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useAppStore();
  const [expandedGroups, setExpandedGroups] = useState({
    users: true,
    tests: true,
    financial: false,
    resources: false,
    reports: false,
    security: false,
    config: false,
  });

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Navigation groups based on user role
  const getNavigationGroups = () => {
    return [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: LayoutDashboard,
        href: '/dashboard',
        roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR', 'EXAMINADOR', 'FAMILIA'],
        single: true,
      },
      {
        id: 'users',
        title: 'Gestión de Usuarios',
        icon: Users,
        roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR'],
        items: [
          {
            title: 'Miembros',
            href: '/users',
            icon: UserCheck,
            roles: ['ADMINISTRADOR'],
          },
          {
            title: 'Alumnos',
            href: '/students',
            icon: GraduationCap,
            roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR'],
          },
          {
            title: 'Gestión de Centros',
            href: '/centers',
            icon: Building2,
            roles: ['ADMINISTRADOR'],
          },
        ],
      },
      {
        id: 'tests',
        title: 'Gestión de Pruebas',
        icon: Brain,
        roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR', 'EXAMINADOR'],
        items: [
          {
            title: 'Asignación de Pruebas',
            href: '/test-assignments',
            icon: ClipboardList,
            roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR'],
          },
          {
            title: 'Resultados de Pruebas',
            href: '/test-results',
            icon: FileText,
            roles: ['ADMINISTRADOR', 'CLINICA', 'EXAMINADOR'],
          },
          {
            title: 'Historial por Alumno',
            href: '/student-history',
            icon: History,
            roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR'],
          },
        ],
      },
      {
        id: 'financial',
        title: 'Financiero',
        icon: DollarSign,
        roles: ['ADMINISTRADOR'],
        items: [
          {
            title: 'Gestión de Suscripciones',
            href: '/subscriptions',
            icon: CreditCard,
            roles: ['ADMINISTRADOR'],
          },
          {
            title: 'Facturación',
            href: '/invoices',
            icon: Receipt,
            roles: ['ADMINISTRADOR'],
          },
          {
            title: 'Historial de Cobros',
            href: '/payment-history',
            icon: History,
            roles: ['ADMINISTRADOR'],
          },
        ],
      },
      {
        id: 'agenda',
        title: 'Agenda',
        icon: Calendar,
        href: '/agenda',
        roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR'],
        single: true,
      },
      {
        id: 'resources',
        title: 'Recursos',
        icon: Package,
        roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR'],
        items: [
          {
            title: 'Dispositivos',
            href: '/devices',
            icon: Tablet,
            roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR'],
          },
          {
            title: 'Inventario',
            href: '/inventory',
            icon: Package,
            roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR'],
          },
        ],
      },
      {
        id: 'reports',
        title: 'Reportes y Análisis',
        icon: BarChart3,
        roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR'],
        items: [
          {
            title: 'Estadísticas',
            href: '/statistics',
            icon: TrendingUp,
            roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR'],
          },
          {
            title: 'Pruebas',
            href: '/test-reports',
            icon: Brain,
            roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR'],
          },
        ],
      },
      {
        id: 'security',
        title: 'Seguridad y RGPD',
        icon: Shield,
        href: '/security',
        roles: ['ADMINISTRADOR'],
        single: true,
      },
      {
        id: 'config',
        title: 'Configuración',
        icon: Settings,
        roles: ['ADMINISTRADOR'],
        items: [
          {
            title: 'Valoraciones de Pruebas',
            href: '/test-ratings',
            icon: FileBarChart,
            roles: ['ADMINISTRADOR'],
          },
          {
            title: 'Ajustes',
            href: '/configuration',
            icon: Settings,
            roles: ['ADMINISTRADOR'],
          },
          {
            title: 'Plantillas',
            href: '/templates',
            icon: FileText,
            roles: ['ADMINISTRADOR'],
          },
          {
            title: 'Pruebas EMOOTI',
            href: '/emoti-tests',
            icon: Brain,
            roles: ['ADMINISTRADOR', 'CLINICA', 'EXAMINADOR'],
          },
        ],
      },
    ].filter(group => group.roles.includes(user?.userType));
  };

  const navigationGroups = getNavigationGroups();

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    return (
      <NavLink
        to={item.href}
        className={({ isActive }) =>
          cn(
            'flex items-center px-4 py-2.5 text-sm font-medium transition-colors duration-200',
            'hover:bg-slate-700 rounded-lg mx-2',
            isActive
              ? 'bg-emooti-blue-600 text-white'
              : 'text-slate-300'
          )
        }
      >
        <Icon className={cn('w-4 h-4', sidebarCollapsed ? 'mx-auto' : 'mr-3')} />
        {!sidebarCollapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {item.title}
          </motion.span>
        )}
      </NavLink>
    );
  };

  const NavGroup = ({ group, index }) => {
    const Icon = group.icon;
    const isExpanded = expandedGroups[group.id];
    const hasActiveChild = group.items?.some(item =>
      item.roles.includes(user?.userType) && location.pathname === item.href
    );

    // Si es un item single (sin subitems)
    if (group.single) {
      const isActive = location.pathname === group.href;
      return (
        <NavLink
          to={group.href}
          className={({ isActive }) =>
            cn(
              'flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200',
              'hover:bg-slate-700 rounded-lg mx-2',
              isActive
                ? 'bg-emooti-blue-600 text-white'
                : 'text-slate-300'
            )
          }
        >
          <Icon className={cn('w-5 h-5', sidebarCollapsed ? 'mx-auto' : 'mr-3')} />
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {group.title}
            </motion.span>
          )}
        </NavLink>
      );
    }

    // Grupo con subitems
    const visibleItems = group.items?.filter(item => item.roles.includes(user?.userType)) || [];

    if (visibleItems.length === 0) return null;

    return (
      <div className="mb-1">
        <button
          onClick={() => toggleGroup(group.id)}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors duration-200',
            'hover:bg-slate-700 rounded-lg mx-2',
            hasActiveChild ? 'text-white' : 'text-slate-300'
          )}
        >
          <div className="flex items-center">
            <Icon className={cn('w-5 h-5', sidebarCollapsed ? 'mx-auto' : 'mr-3')} />
            {!sidebarCollapsed && <span>{group.title}</span>}
          </div>
          {!sidebarCollapsed && (
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                isExpanded ? 'transform rotate-180' : ''
              )}
            />
          )}
        </button>

        <AnimatePresence>
          {isExpanded && !sidebarCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-4 mt-1 space-y-1">
                {visibleItems.map((item, itemIndex) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: itemIndex * 0.05 }}
                  >
                    <NavItem item={item} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-emooti-blue-500 to-emooti-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">EMOOTI</span>
          </motion.div>
        )}
        
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1 rounded-lg hover:bg-slate-700 transition-colors duration-200"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5 text-slate-300" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-slate-300" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 emooti-scrollbar">
        <div className="space-y-1">
          {navigationGroups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NavGroup group={group} index={index} />
            </motion.div>
          ))}
        </div>
      </nav>

      {/* User Info */}
      {!sidebarCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 border-t border-slate-700"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emooti-green-400 to-emooti-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.fullName?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.fullName || 'Usuario'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user?.userType || 'Usuario'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Sidebar;
