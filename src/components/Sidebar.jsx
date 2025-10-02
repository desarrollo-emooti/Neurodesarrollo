import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useAppStore from '../store/appStore';
import { cn } from '../lib/utils';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useAppStore();

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR', 'EXAMINADOR', 'FAMILIA'],
      },
    ];

    const adminItems = [
      {
        title: 'Gestión de Usuarios',
        href: '/users',
        icon: Users,
        roles: ['ADMINISTRADOR'],
      },
      {
        title: 'Gestión de Centros',
        href: '/centers',
        icon: Building2,
        roles: ['ADMINISTRADOR'],
      },
      {
        title: 'Bases de Datos',
        href: '/database',
        icon: Database,
        roles: ['ADMINISTRADOR'],
      },
    ];

    const clinicalItems = [
      {
        title: 'Alumnos',
        href: '/students',
        icon: GraduationCap,
        roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR'],
      },
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
        title: 'Pruebas EMOOTI',
        href: '/emoti-tests',
        icon: Brain,
        roles: ['ADMINISTRADOR', 'CLINICA', 'EXAMINADOR'],
      },
    ];

    const resourceItems = [
      {
        title: 'Agenda',
        href: '/agenda',
        icon: Calendar,
        roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR'],
      },
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
    ];

    const financialItems = [
      {
        title: 'Suscripciones',
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
    ];

    const securityItems = [
      {
        title: 'Seguridad RGPD',
        href: '/security',
        icon: Shield,
        roles: ['ADMINISTRADOR'],
      },
      {
        title: 'Autorizaciones',
        href: '/authorizations',
        icon: Shield,
        roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR'],
      },
    ];

    const configItems = [
      {
        title: 'Configuración',
        href: '/configuration',
        icon: Settings,
        roles: ['ADMINISTRADOR'],
      },
      {
        title: 'Exportar Datos',
        href: '/export',
        icon: Download,
        roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR'],
      },
      {
        title: 'Importar Datos',
        href: '/import',
        icon: Upload,
        roles: ['ADMINISTRADOR'],
      },
    ];

    const reportItems = [
      {
        title: 'Tutoriales',
        href: '/tutorials',
        icon: BookOpen,
        roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR', 'EXAMINADOR', 'FAMILIA'],
      },
      {
        title: 'Reportes',
        href: '/reports',
        icon: BarChart3,
        roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR'],
      },
      {
        title: 'Estadísticas',
        href: '/statistics',
        icon: TrendingUp,
        roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR'],
      },
    ];

    const profileItems = [
      {
        title: 'Mi Perfil',
        href: '/profile',
        icon: User,
        roles: ['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR', 'EXAMINADOR', 'FAMILIA'],
      },
    ];

    return [
      ...baseItems,
      ...adminItems,
      ...clinicalItems,
      ...resourceItems,
      ...financialItems,
      ...securityItems,
      ...configItems,
      ...reportItems,
      ...profileItems,
    ].filter(item => item.roles.includes(user?.userType));
  };

  const navigationItems = getNavigationItems();

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    return (
      <NavLink
        to={item.href}
        className={({ isActive }) =>
          cn(
            'flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200',
            'hover:bg-white hover:text-slate-900 rounded-lg mx-2',
            isActive
              ? 'bg-white text-slate-900 shadow-lg'
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
            {item.title}
          </motion.span>
        )}
      </NavLink>
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
          {navigationItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <NavItem item={item} />
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
