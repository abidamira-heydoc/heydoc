import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useDoctor } from '../../contexts/DoctorContext';
import { COLLECTIONS } from '@shared/firebase.config';
import type { ConsultationCase, DoctorPayout } from '@shared/types';

interface EarningsData {
  pendingBalance: number;
  lifetimeEarnings: number;
  thisWeek: number;
  thisMonth: number;
  casesThisWeek: number;
  casesThisMonth: number;
}

const EarningsDashboard: React.FC = () => {
  const { t } = useTranslation('doctor');
  const { user } = useAuth();
  const { doctor } = useDoctor();

  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [recentCases, setRecentCases] = useState<ConsultationCase[]>([]);
  const [payouts, setPayouts] = useState<DoctorPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Calculate next Monday for payout
  const getNextMonday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Fetch earnings data
  useEffect(() => {
    const fetchEarnings = async () => {
      if (!user) return;

      try {
        // Get date ranges
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Fetch completed cases
        const casesQuery = query(
          collection(db, COLLECTIONS.CONSULTATION_CASES),
          where('assignedDoctorId', '==', user.uid),
          where('status', '==', 'completed'),
          orderBy('completedAt', 'desc'),
          limit(50)
        );

        const casesSnapshot = await getDocs(casesQuery);
        const cases = casesSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          completedAt: doc.data().completedAt?.toDate?.() || new Date(),
        })) as ConsultationCase[];

        // Calculate earnings
        let thisWeek = 0;
        let thisMonth = 0;
        let casesThisWeek = 0;
        let casesThisMonth = 0;

        cases.forEach(c => {
          if (c.completedAt) {
            if (c.completedAt >= startOfWeek) {
              thisWeek += c.doctorPayout;
              casesThisWeek++;
            }
            if (c.completedAt >= startOfMonth) {
              thisMonth += c.doctorPayout;
              casesThisMonth++;
            }
          }
        });

        setEarnings({
          pendingBalance: doctor?.pendingBalance || 0,
          lifetimeEarnings: doctor?.totalEarnings || 0,
          thisWeek,
          thisMonth,
          casesThisWeek,
          casesThisMonth,
        });

        setRecentCases(cases.slice(0, 10));

        // Fetch payouts history
        const payoutsQuery = query(
          collection(db, COLLECTIONS.DOCTOR_PAYOUTS),
          where('doctorId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        const payoutsSnapshot = await getDocs(payoutsQuery);
        const payoutsData = payoutsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          processedAt: doc.data().processedAt?.toDate?.() || undefined,
        })) as DoctorPayout[];

        setPayouts(payoutsData);
      } catch (err) {
        console.error('Error fetching earnings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [user, doctor]);

  const handleInstantTransfer = async () => {
    if (!user || !earnings || earnings.pendingBalance < 500) return;

    setTransferring(true);
    try {
      const instantPayout = httpsCallable(functions, 'requestInstantPayout');
      await instantPayout({});

      // Refresh data
      window.location.reload();
    } catch (err: any) {
      console.error('Error requesting instant payout:', err);
      alert(err.message || 'Failed to process instant transfer');
    } finally {
      setTransferring(false);
      setShowTransferModal(false);
    }
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">{t('earnings.loadingEarnings')}</p>
        </div>
      </div>
    );
  }

  // Check if Stripe is connected
  if (!doctor?.stripeOnboardingComplete) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('earnings.connectBankFirst')}</h2>
          <p className="text-gray-600 mb-6">
            {t('earnings.connectBankMessage')}
          </p>
          <Link
            to="/doctor/payments/connect"
            className="inline-block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition"
          >
            {t('earnings.connectWithStripe')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('earnings.title')}</h1>
          <p className="text-gray-600">{t('earnings.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-end">
            <p className="text-sm text-gray-500">{t('earnings.nextPayout')}</p>
            <p className="font-semibold text-gray-900">{getNextMonday()}</p>
          </div>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Balance */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white">
          <p className="text-green-100 text-sm mb-1">{t('earnings.pendingBalance')}</p>
          <p className="text-3xl font-bold">{formatCurrency(earnings?.pendingBalance || 0)}</p>
          <p className="text-green-100 text-xs mt-2">{t('earnings.payoutOn', { date: getNextMonday() })}</p>
          {(earnings?.pendingBalance || 0) >= 500 && (
            <button
              onClick={() => setShowTransferModal(true)}
              className="mt-3 w-full bg-white/20 hover:bg-white/30 text-white text-sm font-medium py-2 rounded-lg transition"
            >
              {t('earnings.instantTransfer')}
            </button>
          )}
        </div>

        {/* This Week */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-gray-500 text-sm mb-1">{t('earnings.thisWeek')}</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(earnings?.thisWeek || 0)}</p>
          <p className="text-sm text-gray-500 mt-1">{earnings?.casesThisWeek || 0} {t('common.cases')}</p>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-gray-500 text-sm mb-1">{t('earnings.thisMonth')}</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(earnings?.thisMonth || 0)}</p>
          <p className="text-sm text-gray-500 mt-1">{earnings?.casesThisMonth || 0} {t('common.cases')}</p>
        </div>

        {/* Lifetime */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-gray-500 text-sm mb-1">{t('earnings.lifetimeEarnings')}</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(earnings?.lifetimeEarnings || 0)}</p>
          <p className="text-sm text-gray-500 mt-1">{doctor?.totalCases || 0} {t('earnings.totalCases')}</p>
        </div>
      </div>

      {/* Recent Cases & Payouts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Cases */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{t('earnings.recentEarnings')}</h2>
            <Link to="/doctor/history" className="text-sm text-blue-600 hover:text-blue-700">
              {t('common.viewAll')}
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentCases.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>{t('earnings.noCompletedCases')}</p>
              </div>
            ) : (
              recentCases.map((caseItem) => (
                <div key={caseItem.id} className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      caseItem.tier === 'priority' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {caseItem.patientName?.[0]?.toUpperCase() || 'P'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{caseItem.patientName}</p>
                      <p className="text-sm text-gray-500">
                        {caseItem.completedAt?.toLocaleDateString()}
                        {caseItem.tier === 'priority' && (
                          <span className="ms-2 text-amber-600">{t('common.priority')}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold ${
                    caseItem.tier === 'priority' ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    +{formatCurrency(caseItem.doctorPayout)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payout History */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">{t('earnings.payoutHistory')}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {payouts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>{t('earnings.noPayouts')}</p>
                <p className="text-sm mt-1">{t('earnings.firstPayoutOn', { date: getNextMonday() })}</p>
              </div>
            ) : (
              payouts.map((payout) => (
                <div key={payout.id} className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      payout.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : payout.status === 'processing'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}>
                      {payout.status === 'completed' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : payout.status === 'processing' ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {payout.status === 'completed' ? t('common.paid') : payout.status === 'processing' ? t('common.processing') : t('common.pending')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {payout.processedAt?.toLocaleDateString() || payout.createdAt.toLocaleDateString()}
                        {' \u2022 '}{payout.cases.length} {t('common.cases')}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(payout.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tax Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">{t('earnings.taxDocuments')}</h3>
            <p className="text-sm text-blue-700 mt-1">
              {t('earnings.taxDocumentsDesc')}{' '}
              <a
                href="https://connect.stripe.com/express_login"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                {t('earnings.stripeExpressDashboard')}
              </a>.
            </p>
          </div>
        </div>
      </div>

      {/* Instant Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-green-600 text-white px-6 py-4">
              <h2 className="text-xl font-semibold">{t('earnings.instantTransferModal.title')}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">{t('earnings.instantTransferModal.transferAmount')}</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency((earnings?.pendingBalance || 0) - 200)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t('earnings.instantTransferModal.instantTransferFee')}</span>
                  <span className="text-gray-500">-$2.00</span>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                {t('earnings.instantTransferModal.fundsDeposited')}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowTransferModal(false)}
                  disabled={transferring}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  {t('earnings.instantTransferModal.cancel')}
                </button>
                <button
                  onClick={handleInstantTransfer}
                  disabled={transferring}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {transferring ? (
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                  {t('earnings.instantTransferModal.transferNow')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarningsDashboard;
