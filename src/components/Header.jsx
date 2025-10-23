import React from 'react';
import { motion } from 'framer-motion';
import {
  Menu,
  Bell,
  Search,
  Settings,
  LogOut,
  User,
  Moon,
  Sun,
  ChevronDown,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useAppStore from '../store/appStore';
import { useNotifications } from '../hooks/useNotifications';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

const Header = () => {
  const { user, logout } = useAuthStore();
  const {
    sidebarOpen,
    toggleSidebar,
    theme,
    setTheme,
    searchQuery,
    setSearchQuery
  } = useAppStore();

  // Use notifications hook with 60 second polling interval
  const { unreadCount } = useNotifications(60000);

  const handleLogout = async () => {
    await logout();
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hidden sm:flex"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </div>
          {/* Settings */}
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-900">
                {user?.fullName || 'Usuario'}
              </p>
              <p className="text-xs text-slate-500">
                {user?.userType || 'Usuario'}
              </p>
            </div>
            
            <div className="w-8 h-8 bg-gradient-to-r from-emooti-blue-500 to-emooti-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.fullName?.charAt(0) || 'U'}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-slate-500 hover:text-slate-700"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
