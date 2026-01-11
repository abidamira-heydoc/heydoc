import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import InviteCode from './components/Auth/InviteCode';
import SignIn from './components/Auth/SignIn';
import ConsentForm from './components/Consent/ConsentForm';
import IntakeForm from './components/Intake/IntakeForm';
import Chat from './components/Chat/Chat';
import ProfileView from './components/Profile/ProfileView';
import AdminDashboard from './components/Admin/AdminDashboard';

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
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
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
