import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  User, 
  Users, 
  GraduationCap, 
  Building2, 
  ClipboardList, 
  BarChart3, 
  Calendar, 
  Tablet, 
  Package, 
  FileText, 
  Shield, 
  Settings, 
  BookOpen, 
  LogOut,
  ChevronDown,
  Home,
  TestTube,
  History,
  Download,
  Upload,
  CreditCard,
  Receipt,
  Clock,
  MapPin,
  Database,
  AlertTriangle,
  TrendingUp,
  FileCheck,
  UserCheck,
  Brain,
  Heart,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useData } from '@/components/DataContext';
import { toast } from 'sonner';

// Navegación por rol
const getAdminNavigation = () => [
  { name: 'Dashboard', href: '/', icon: Home },
  {
    name: 'Gestión de Usuarios',
    icon: Users,
    children: [
      { name: 'Miembros', href: '/users', icon: User },
      { name: 'Alumnos', href: '/students', icon: GraduationCap },
      { name: 'Gestión de Centros', href: '/centers', icon: Building2 },
      { name: 'Exportar Usuarios', href: '/export-users', icon: Download },
    ]
  },
  {
    name: 'Gestión de las pruebas',
    icon: TestTube,
    children: [
      { name: 'Asignación de pruebas', href: '/test-assignments', icon: ClipboardList },
      { name: 'Resultado pruebas', href: '/test-results', icon: FileCheck },
      { name: 'Historial por Alumno', href: '/student-history', icon: History },
      { name: 'Import. automática', href: '/import-automatic', icon: Upload },
      { name: 'Import. manual', href: '/import-manual', icon: Upload },
    ]
  },
  {
    name: 'Financiero',
    icon: CreditCard,
    children: [
      { name: 'Gestión de Suscripciones', href: '/subscriptions', icon: CreditCard },
      { name: 'Facturación', href: '/invoicing', icon: Receipt },
      { name: 'Historial de Cobros', href: '/payment-history', icon: Clock },
    ]
  },
  { name: 'Agenda', href: '/agenda', icon: Calendar },
  {
    name: 'Recursos',
    icon: Package,
    children: [
      { name: 'Dispositivos', href: '/devices', icon: Tablet },
      { name: 'Inventario', href: '/inventory', icon: Package },
    ]
  },
  {
    name: 'Reportes y Análisis',
    icon: BarChart3,
    children: [
      { name: 'Estadísticas', href: '/statistics', icon: TrendingUp },
      { name: 'Informes', href: '/reports', icon: FileText },
      { name: 'Pruebas', href: '/test-comparison', icon: TestTube },
    ]
  },
  { name: 'Seguridad RGPD', href: '/security', icon: Shield },
  {
    name: 'Configuración',
    icon: Settings,
    children: [
      { name: 'Valoraciones de Pruebas', href: '/value-configurations', icon: BarChart3 },
      { name: 'Ajustes', href: '/settings', icon: Settings },
      { name: 'Plantillas', href: '/templates', icon: FileText },
      { name: 'Pruebas EMOOTI', href: '/emoti-tests', icon: Brain },
      { name: 'Bases de datos', href: '/database', icon: Database },
    ]
  },
  { name: 'Tutoriales', href: '/tutorials', icon: BookOpen },
];

const getClinicaNavigation = () => [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Usuarios', href: '/users', icon: Users },
  { name: 'Alumnos', href: '/students', icon: GraduationCap },
  { name: 'Estadísticas', href: '/statistics', icon: TrendingUp },
  { name: 'Agenda', href: '/agenda', icon: Calendar },
  { name: 'Informes', href: '/reports', icon: FileText },
  { name: 'Pruebas', href: '/test-results', icon: TestTube },
  { name: 'Configuración', href: '/settings', icon: Settings },
  { name: 'Tutoriales', href: '/tutorials', icon: BookOpen },
];

const getOrientadorNavigation = () => [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Alumnos', href: '/students', icon: GraduationCap },
  { name: 'Agenda', href: '/agenda', icon: Calendar },
  { name: 'Reportes', href: '/reports', icon: FileText },
  { name: 'Informes', href: '/reports', icon: FileText },
  { name: 'Tutoriales', href: '/tutorials', icon: BookOpen },
];

const getExaminadorNavigation = () => [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Mis Pruebas', href: '/my-tests', icon: TestTube },
  { name: 'Resultados', href: '/test-results', icon: FileCheck },
  { name: 'Tutoriales', href: '/tutorials', icon: BookOpen },
];

const getFamiliaNavigation = () => [
  { name: 'Resumen', href: '/', icon: Home },
  { name: 'Informes', href: '/reports', icon: FileText },
  { name: 'Pruebas Realizadas', href: '/test-results', icon: TestTube },
  { name: 'Recomendaciones', href: '/recommendations', icon: Heart },
  { name: 'Tutoriales', href: '/tutorials', icon: BookOpen },
];

const getRoleBasedNavigation = (userType) => {
  switch (userType) {
    case 'administrador':
      return getAdminNavigation();
    case 'clinica':
      return getClinicaNavigation();
    case 'orientador':
      return getOrientadorNavigation();
    case 'examinador':
      return getExaminadorNavigation();
    case 'familia':
      return getFamiliaNavigation();
    default:
      return [];
  }
};

const SidebarItem = ({ item, isActive, onClick, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    } else {
      onClick(item.href);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
          level > 0 ? 'ml-4' : ''
        } ${
          isActive
            ? 'bg-white text-slate-900 shadow-lg'
            : 'text-slate-300 hover:bg-white hover:text-slate-900'
        }`}
      >
        <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
        <span className="flex-1 text-left">{item.name}</span>
        {hasChildren && (
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`} 
          />
        )}
      </button>
      
      {hasChildren && (
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-1 space-y-1"
            >
              {item.children.map((child) => (
                <SidebarItem
                  key={child.href}
                  item={child}
                  isActive={isActive}
                  onClick={onClick}
                  level={level + 1}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const { currentUser, isLoading } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  // Cerrar sidebar en mobile al cambiar de ruta
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      const { User } = await import('@/entities/User');
      await User.logout();
      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error durante logout:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  const handleNavigation = (href) => {
    navigate(href);
  };

  const navigation = currentUser ? getRoleBasedNavigation(currentUser.user_type) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Sidebar Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-slate-800 pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-white">EMOOTI</h1>
                <p className="text-xs text-slate-300">Neurodesarrollo</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <SidebarItem
                key={item.name}
                item={item}
                isActive={location.pathname === item.href}
                onClick={handleNavigation}
              />
            ))}
          </nav>

          {/* User info */}
          <div className="flex-shrink-0 flex border-t border-slate-700 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-0 h-auto">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser.avatar_url} />
                      <AvatarFallback>
                        {currentUser.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3 text-left">
                      <p className="text-sm font-medium text-white">
                        {currentUser.full_name}
                      </p>
                      <p className="text-xs text-slate-300 capitalize">
                        {currentUser.user_type}
                      </p>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Editar Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
            >
              <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
            </motion.div>

            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-800 fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="text-white hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Logo Mobile */}
              <div className="flex items-center flex-shrink-0 px-4 pt-5">
                <div className="flex items-center">
                  <Brain className="h-8 w-8 text-white" />
                  <div className="ml-3">
                    <h1 className="text-xl font-bold text-white">EMOOTI</h1>
                    <p className="text-xs text-slate-300">Neurodesarrollo</p>
                  </div>
                </div>
              </div>

              {/* Navigation Mobile */}
              <nav className="mt-8 flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <SidebarItem
                    key={item.name}
                    item={item}
                    isActive={location.pathname === item.href}
                    onClick={handleNavigation}
                  />
                ))}
              </nav>

              {/* User info Mobile */}
              <div className="flex-shrink-0 flex border-t border-slate-700 p-4">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser.avatar_url} />
                    <AvatarFallback>
                      {currentUser.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">
                      {currentUser.full_name}
                    </p>
                    <p className="text-xs text-slate-300 capitalize">
                      {currentUser.user_type}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="lg:pl-72 flex flex-col flex-1">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white/90 backdrop-blur-sm border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <div className="flex items-center">
                <Brain className="h-6 w-6 text-blue-600 mr-2" />
                <h1 className="text-lg font-semibold text-gray-900">EMOOTI</h1>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser.avatar_url} />
                      <AvatarFallback>
                        {currentUser.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Editar Perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

