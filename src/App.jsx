import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Stores
import useAuthStore from './store/authStore';
import useAppStore from './store/appStore';

// Components (eager load - necesarios inmediatamente)
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// Auth Pages (eager load - necesarios para login)
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';

// Lazy load pages (code splitting)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/Users'));
const Students = lazy(() => import('./pages/Students'));
const Centers = lazy(() => import('./pages/Centers'));
const TestAssignments = lazy(() => import('./pages/TestAssignments'));
const TestResults = lazy(() => import('./pages/TestResults'));
const EmotiTests = lazy(() => import('./pages/EmotiTests'));
const Agenda = lazy(() => import('./pages/Agenda'));
const Devices = lazy(() => import('./pages/Devices'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Security = lazy(() => import('./pages/Security'));
const Configuration = lazy(() => import('./pages/Configuration'));
const Authorizations = lazy(() => import('./pages/Authorizations'));
const Export = lazy(() => import('./pages/Export'));
const Import = lazy(() => import('./pages/Import'));
const Tutorials = lazy(() => import('./pages/Tutorials'));
const Reports = lazy(() => import('./pages/Reports'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Database = lazy(() => import('./pages/Database'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

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
              <Route path="/auth/callback" element={<AuthCallback />} />

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
                      <Suspense fallback={
                        <div className="flex items-center justify-center min-h-[400px]">
                          <LoadingSpinner />
                        </div>
                      }>
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
                      </Suspense>
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
