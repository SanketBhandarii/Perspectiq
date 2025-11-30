import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SessionWizard from './components/SessionWizard';
import ChatInterface from './components/ChatInterface';
import Summary from './pages/Summary';
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
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
