import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import useAppStore from '../store/appStore';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const Layout = ({ children }) => {
  const { sidebarOpen, sidebarCollapsed } = useAppStore();

  // Monitor online/offline status
  const isOnline = useOnlineStatus();

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`
              ${sidebarCollapsed ? 'w-16' : 'w-72'}
              bg-slate-800 dark:bg-gray-900 text-white shadow-xl z-30
              transition-all duration-300 ease-in-out
            `}
          >
            <Sidebar />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => useAppStore.getState().toggleSidebar()}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
