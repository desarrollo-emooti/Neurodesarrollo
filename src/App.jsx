import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Stores
import useAuthStore from './store/authStore';
import useAppStore from './store/appStore';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Students from './pages/Students';
import Centers from './pages/Centers';
import TestAssignments from './pages/TestAssignments';
import TestResults from './pages/TestResults';
import EmotiTests from './pages/EmotiTests';
import Agenda from './pages/Agenda';
import Devices from './pages/Devices';
import Inventory from './pages/Inventory';
import Subscriptions from './pages/Subscriptions';
import Invoices from './pages/Invoices';
import Security from './pages/Security';
import Configuration from './pages/Configuration';
import Authorizations from './pages/Authorizations';
import Export from './pages/Export';
import Import from './pages/Import';
import Tutorials from './pages/Tutorials';
import Reports from './pages/Reports';
import Statistics from './pages/Statistics';
import Database from './pages/Database';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore();
  const { theme } = useAppStore();

  useEffect(() => {
    // Initialize authentication from localStorage
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/login" 
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Login />
                    </motion.div>
                  )
                } 
              />

              {/* Protected Routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        {/* Dashboard */}
                        <Route path="/dashboard" element={<Dashboard />} />
                        
                        {/* User Management */}
                        <Route path="/users" element={<Users />} />
                        
                        {/* Student Management */}
                        <Route path="/students" element={<Students />} />
                        
                        {/* Center Management */}
                        <Route path="/centers" element={<Centers />} />
                        
                        {/* Test Management */}
                        <Route path="/test-assignments" element={<TestAssignments />} />
                        <Route path="/test-results" element={<TestResults />} />
                        <Route path="/emoti-tests" element={<EmotiTests />} />
                        
                        {/* Agenda */}
                        <Route path="/agenda" element={<Agenda />} />
                        
                        {/* Resources */}
                        <Route path="/devices" element={<Devices />} />
                        <Route path="/inventory" element={<Inventory />} />
                        
                        {/* Financial */}
                        <Route path="/subscriptions" element={<Subscriptions />} />
                        <Route path="/invoices" element={<Invoices />} />
                        
                        {/* Security & Compliance */}
                        <Route path="/security" element={<Security />} />
                        <Route path="/authorizations" element={<Authorizations />} />
                        
                        {/* Configuration */}
                        <Route path="/configuration" element={<Configuration />} />
                        
                        {/* Data Management */}
                        <Route path="/export" element={<Export />} />
                        <Route path="/import" element={<Import />} />
                        
                        {/* Help & Support */}
                        <Route path="/tutorials" element={<Tutorials />} />
                        
                        {/* Reports & Analytics */}
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/statistics" element={<Statistics />} />
                        
                        {/* Admin Only */}
                        <Route path="/database" element={<Database />} />
                        
                        {/* Profile */}
                        <Route path="/profile" element={<Profile />} />
                        
                        {/* Default redirect */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        
                        {/* 404 */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AnimatePresence>
        </div>
        
        {/* Toast Notifications */}
        <Toaster
          position="top-center"
          duration={4000}
          richColors
          closeButton
          expand
        />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
