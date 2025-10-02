import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Centers from './pages/Centers';
import Tests from './pages/Tests';
import Agenda from './pages/Agenda';
import Resources from './pages/Resources';
import Financial from './pages/Financial';
import Reports from './pages/Reports';
import Security from './pages/Security';
import Configuration from './pages/Configuration';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-slate-50">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="students" element={<Students />} />
                <Route path="centers" element={<Centers />} />
                <Route path="tests" element={<Tests />} />
                <Route path="agenda" element={<Agenda />} />
                <Route path="resources" element={<Resources />} />
                <Route path="financial" element={<Financial />} />
                <Route path="reports" element={<Reports />} />
                <Route path="security" element={<Security />} />
                <Route path="configuration" element={<Configuration />} />
                <Route path="profile" element={<Profile />} />
              </Route>
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            
            {/* Toast notifications */}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  color: '#1e293b',
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

