import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLLECTIONS } from '@shared/firebase.config';
import type { DoctorProfile } from '@shared/types';

const DoctorProtectedRoute: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [doctorData, setDoctorData] = useState<DoctorProfile | null>(null);
  const [status, setStatus] = useState<'loading' | 'not-doctor' | 'pending' | 'rejected' | 'suspended' | 'no-stripe' | 'approved'>('loading');

  useEffect(() => {
    const checkDoctorStatus = async () => {
      if (authLoading) return;

      if (!user) {
        setStatus('not-doctor');
        setChecking(false);
        return;
      }

      try {
        const doctorDoc = await getDoc(doc(db, COLLECTIONS.DOCTORS, user.uid));

        if (!doctorDoc.exists()) {
          setStatus('not-doctor');
          setChecking(false);
          return;
        }

        const data = doctorDoc.data() as DoctorProfile;
        setDoctorData(data);

        switch (data.status) {
          case 'pending':
            setStatus('pending');
            break;
          case 'rejected':
            setStatus('rejected');
            break;
          case 'suspended':
            setStatus('suspended');
            break;
          case 'approved':
            if (!data.stripeOnboardingComplete) {
              setStatus('no-stripe');
            } else {
              setStatus('approved');
            }
            break;
          default:
            setStatus('not-doctor');
        }
      } catch (error) {
        console.error('Error checking doctor status:', error);
        setStatus('not-doctor');
      } finally {
        setChecking(false);
      }
    };

    checkDoctorStatus();
  }, [user, authLoading]);

  // Loading state
  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Verifying doctor access...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to doctor login
  if (!user || status === 'not-doctor') {
    return <Navigate to="/doctor/login" state={{ from: location }} replace />;
  }

  // Pending approval
  if (status === 'pending') {
    return <Navigate to="/doctor/pending" replace />;
  }

  // Rejected
  if (status === 'rejected') {
    return <Navigate to="/doctor/rejected" replace />;
  }

  // Suspended
  if (status === 'suspended') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Suspended</h2>
          <p className="text-gray-600 mb-6">
            Your doctor account has been suspended. Please contact support for more information.
          </p>
          <a
            href="mailto:support@heydoccare.com"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  // Needs Stripe onboarding
  if (status === 'no-stripe') {
    return <Navigate to="/doctor/payments/connect" replace />;
  }

  // Approved - render dashboard
  return <Outlet context={{ doctorData }} />;
};

export default DoctorProtectedRoute;
