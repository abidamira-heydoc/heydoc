import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLLECTIONS } from '@shared/firebase.config';
import type { DoctorProfile } from '@shared/types';

const StripeConnect: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check for return from Stripe
  useEffect(() => {
    const stripeSuccess = searchParams.get('success');
    const stripeRefresh = searchParams.get('refresh');

    if (stripeSuccess === 'true') {
      setSuccess(true);
      // Verify the connection
      verifyStripeConnection();
    } else if (stripeRefresh === 'true') {
      // User needs to complete onboarding
      setError('Please complete the Stripe onboarding process.');
    }
  }, [searchParams]);

  // Fetch doctor profile
  useEffect(() => {
    const fetchDoctor = async () => {
      if (!user) return;

      try {
        const doctorDoc = await getDoc(doc(db, COLLECTIONS.DOCTORS, user.uid));
        if (doctorDoc.exists()) {
          setDoctor({
            ...doctorDoc.data(),
            id: doctorDoc.id,
          } as DoctorProfile);
        }
      } catch (err) {
        console.error('Error fetching doctor:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [user]);

  const verifyStripeConnection = async () => {
    if (!user) return;

    try {
      const verifyConnect = httpsCallable(functions, 'verifyStripeConnect');
      const result = await verifyConnect({});

      if ((result.data as any).connected) {
        // Update local state
        const doctorDoc = await getDoc(doc(db, COLLECTIONS.DOCTORS, user.uid));
        if (doctorDoc.exists()) {
          setDoctor({
            ...doctorDoc.data(),
            id: doctorDoc.id,
          } as DoctorProfile);
        }
      }
    } catch (err) {
      console.error('Error verifying connection:', err);
    }
  };

  const handleConnectStripe = async () => {
    if (!user) return;

    setConnecting(true);
    setError(null);

    try {
      const createConnectAccount = httpsCallable(functions, 'createStripeConnectAccount');
      const result = await createConnectAccount({
        returnUrl: `${window.location.origin}/doctor/payments/connect?success=true`,
        refreshUrl: `${window.location.origin}/doctor/payments/connect?refresh=true`,
      });

      const { accountLinkUrl } = result.data as { accountLinkUrl: string };

      // Redirect to Stripe
      window.location.href = accountLinkUrl;
    } catch (err: any) {
      console.error('Error creating Connect account:', err);
      setError(err.message || 'Failed to connect with Stripe. Please try again.');
      setConnecting(false);
    }
  };

  const handleContinueToDashboard = () => {
    navigate('/doctor/earnings');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Already connected
  if (doctor?.stripeOnboardingComplete) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Stripe Connected!</h2>
          <p className="text-gray-600 mb-6">
            Your bank account is connected. You'll receive automatic payouts every Monday.
          </p>
          <button
            onClick={handleContinueToDashboard}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
          >
            View Earnings Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Success state after returning from Stripe
  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Successfully Connected!</h2>
          <p className="text-gray-600 mb-6">
            Your Stripe account is now connected. You can start accepting cases and earning money.
          </p>
          <button
            onClick={handleContinueToDashboard}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Go to Earnings Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Bank Account</h1>
        <p className="text-gray-600">
          To receive payments for consultations, you need to connect your bank account via Stripe.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Stripe Branding */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-center text-white">
          <div className="flex items-center justify-center gap-2 mb-4">
            <svg className="w-10 h-10" viewBox="0 0 32 32" fill="white">
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
            </svg>
            <span className="text-2xl font-bold">Stripe Connect</span>
          </div>
          <p className="text-indigo-100">
            Secure, fast payments directly to your bank account
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Benefits */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Why Stripe?</h3>
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Automatic Weekly Payouts</p>
                  <p className="text-sm text-gray-500">Receive your earnings every Monday automatically</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Instant Transfers Available</p>
                  <p className="text-sm text-gray-500">Get paid immediately for a small $2 fee</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Bank-Level Security</p>
                  <p className="text-sm text-gray-500">Your financial data is encrypted and secure</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">1099 Tax Forms</p>
                  <p className="text-sm text-gray-500">Stripe generates your tax documents automatically</p>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings Preview */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Your Earnings Per Case</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-sm text-gray-500">Standard Case</p>
                <p className="text-xl font-bold text-green-600">$20</p>
                <p className="text-xs text-gray-400">Patient pays $25</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-amber-200">
                <p className="text-sm text-amber-600">Priority Request</p>
                <p className="text-xl font-bold text-amber-600">$36</p>
                <p className="text-xs text-gray-400">Patient pays $45</p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Connect Button */}
          <button
            onClick={handleConnectStripe}
            disabled={connecting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {connecting ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Connecting to Stripe...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                </svg>
                Connect with Stripe
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            By connecting, you agree to Stripe's{' '}
            <a href="https://stripe.com/connect-account/legal" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
              Terms of Service
            </a>
          </p>
        </div>
      </div>

      {/* Skip for Now */}
      <div className="text-center">
        <button
          onClick={() => navigate('/doctor')}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          I'll do this later
        </button>
      </div>
    </div>
  );
};

export default StripeConnect;
