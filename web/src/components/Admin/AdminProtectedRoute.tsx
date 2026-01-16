import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface AdminUserData {
  role: 'user' | 'admin';
  organizationId: string;
  email: string;
}

const AdminProtectedRoute: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState<AdminUserData | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (authLoading) return;

      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
          setIsAdmin(false);
          setChecking(false);
          return;
        }

        const data = userDoc.data();

        if (data?.role !== 'admin') {
          setIsAdmin(false);
          setChecking(false);
          return;
        }

        if (!data?.organizationId) {
          setIsAdmin(false);
          setChecking(false);
          return;
        }

        setUserData({
          role: data.role,
          organizationId: data.organizationId,
          email: data.email || user.email || '',
        });
        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };

    checkAdminStatus();
  }, [user, authLoading]);

  // Show loading while auth is loading or checking admin status
  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Not an admin - show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have administrator access. Please contact your organization admin if you believe this is an error.
          </p>
          <a
            href="/chat"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Go to Chat
          </a>
        </div>
      </div>
    );
  }

  // Admin verified - render child routes
  return <Outlet context={{ userData }} />;
};

export default AdminProtectedRoute;
