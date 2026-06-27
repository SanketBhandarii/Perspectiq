import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SessionWizard from './components/SessionWizard';
import ChatInterface from './components/ChatInterface';
import Summary from './pages/Summary';
import WhopEntry from './pages/WhopEntry';
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-100 dark:border-white/10 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/setup" element={
        <ProtectedRoute>
          <SessionWizard />
        </ProtectedRoute>
      } />
      <Route path="/chat/:sessionId" element={
        <ProtectedRoute>
          <ChatInterface />
        </ProtectedRoute>
      } />
      <Route path="/summary/:sessionId" element={
        <ProtectedRoute>
          <Summary />
        </ProtectedRoute>
      } />
      <Route path="/experiences/:experienceId" element={<WhopEntry />} />
      <Route path="/experiences/:experienceId/*" element={<WhopEntry />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Layout>
            <AppRoutes />
          </Layout>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};
export default App;
