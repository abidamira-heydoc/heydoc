import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLLECTIONS } from '@shared/firebase.config';
import type { DoctorProfile } from '@shared/types';

const DoctorRejected: React.FC = () => {
  const { t } = useTranslation('doctor');
  const { user, signOut } = useAuth();
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  useEffect(() => {
    const fetchReason = async () => {
      if (!user) return;
      try {
        const doctorDoc = await getDoc(doc(db, COLLECTIONS.DOCTORS, user.uid));
        if (doctorDoc.exists()) {
          const data = doctorDoc.data() as DoctorProfile;
          setRejectionReason(data.rejectionReason || null);
        }
      } catch (err) {
        console.error('Error fetching rejection reason:', err);
      }
    };
    fetchReason();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          {/* Content */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{t('auth.rejected.title')}</h1>
          <p className="text-gray-600 mb-6">
            {t('auth.rejected.message')}
          </p>

          {/* Rejection reason */}
          {rejectionReason && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 text-start">
              <h3 className="font-semibold text-red-800 mb-2">{t('auth.rejected.reason')}</h3>
              <p className="text-red-700 text-sm">{rejectionReason}</p>
            </div>
          )}

          {/* What you can do */}
          <div className="bg-gray-50 rounded-xl p-6 text-start mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">{t('auth.rejected.whatCanYouDo')}</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('auth.rejected.reviewDocuments')}
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {t('auth.rejected.contactIfError')}
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('auth.rejected.reapply')}
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="mailto:doctors@heydoccare.com"
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition text-center"
            >
              {t('auth.rejected.contactSupport')}
            </a>
            <button
              onClick={signOut}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
            >
              {t('auth.rejected.signOut')}
            </button>
          </div>
        </div>

        {/* Back to login */}
        <div className="text-center mt-6">
          <Link to="/doctor/login" className="text-gray-500 hover:text-gray-700 text-sm">
            {t('auth.rejected.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DoctorRejected;
