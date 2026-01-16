import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import InviteCode from './components/Auth/InviteCode';
import SignIn from './components/Auth/SignIn';
import ConsentForm from './components/Consent/ConsentForm';
import IntakeForm from './components/Intake/IntakeForm';
import Chat from './components/Chat/Chat';
import ProfileView from './components/Profile/ProfileView';

// Admin components
import AdminProtectedRoute from './components/Admin/AdminProtectedRoute';
import AdminLayout from './components/Admin/AdminLayout';
import DashboardHome from './components/Admin/DashboardHome';
import AnalyticsDashboard from './components/Admin/AnalyticsDashboard';
import UserManagement from './components/Admin/UserManagement';
import ImpactReports from './components/Admin/ImpactReports';
import AdminSettings from './components/Admin/AdminSettings';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen calm-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Require org code before accessing login
const OrgProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const orgCode = sessionStorage.getItem('orgCode');

  if (!orgCode) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public: Invite code entry */}
      <Route path="/" element={<InviteCode />} />

      {/* Requires org code */}
      <Route
        path="/login"
        element={
          <OrgProtectedRoute>
            <SignIn />
          </OrgProtectedRoute>
        }
      />

      {/* Requires auth */}
      <Route
        path="/consent"
        element={
          <ProtectedRoute>
            <ConsentForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/intake"
        element={
          <ProtectedRoute>
            <IntakeForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfileView />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes - Protected by admin role check */}
      <Route path="/admin" element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="reports" element={<ImpactReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
