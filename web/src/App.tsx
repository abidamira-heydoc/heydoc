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
import DoctorApproval from './components/Admin/DoctorApproval';

// Doctor Portal components
import DoctorSignup from './components/DoctorPortal/DoctorSignup';
import DoctorLogin from './components/DoctorPortal/DoctorLogin';
import DoctorProtectedRoute from './components/DoctorPortal/DoctorProtectedRoute';
import DoctorLayout from './components/DoctorPortal/DoctorLayout';
import DoctorDashboard from './components/DoctorPortal/DoctorDashboard';
import DoctorPending from './components/DoctorPortal/DoctorPending';
import DoctorRejected from './components/DoctorPortal/DoctorRejected';
import CaseQueue from './components/DoctorPortal/CaseQueue';
import ActiveCases from './components/DoctorPortal/ActiveCases';
import DoctorChat from './components/DoctorPortal/DoctorChat';
import PatientConsultChat from './components/Chat/PatientConsultChat';
import StripeConnect from './components/DoctorPortal/StripeConnect';
import EarningsDashboard from './components/DoctorPortal/EarningsDashboard';
import CaseHistory from './components/DoctorPortal/CaseHistory';
import DoctorProfile from './components/DoctorPortal/DoctorProfile';
import DoctorSettings from './components/DoctorPortal/DoctorSettings';

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
        path="/consultation/:caseId"
        element={
          <ProtectedRoute>
            <PatientConsultChat />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes - Protected by admin role check */}
      <Route path="/admin" element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="doctors" element={<DoctorApproval />} />
          <Route path="reports" element={<ImpactReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>

      {/* Doctor Portal Routes */}
      <Route path="/doctor/signup" element={<DoctorSignup />} />
      <Route path="/doctor/login" element={<DoctorLogin />} />
      <Route path="/doctor/pending" element={<DoctorPending />} />
      <Route path="/doctor/rejected" element={<DoctorRejected />} />

      {/* Protected Doctor Routes */}
      <Route path="/doctor" element={<DoctorProtectedRoute />}>
        <Route element={<DoctorLayout />}>
          <Route index element={<DoctorDashboard />} />
          <Route path="cases" element={<CaseQueue />} />
          <Route path="active" element={<ActiveCases />} />
          {/* Phase 4 routes */}
          <Route path="history" element={<CaseHistory />} />
          <Route path="earnings" element={<EarningsDashboard />} />
          <Route path="payments/connect" element={<StripeConnect />} />
          {/* Phase 5 routes */}
          <Route path="profile" element={<DoctorProfile />} />
          <Route path="settings" element={<DoctorSettings />} />
          <Route path="chat/:caseId" element={<DoctorChat />} />
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
