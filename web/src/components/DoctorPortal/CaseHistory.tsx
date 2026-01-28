import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, orderBy, getDocs, limit, startAfter } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLLECTIONS } from '@shared/firebase.config';
import type { ConsultationCase } from '@shared/types';

const CaseHistory: React.FC = () => {
  const { t } = useTranslation('doctor');
  const { user } = useAuth();
  const [cases, setCases] = useState<ConsultationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'standard' | 'priority'>('all');

  const PAGE_SIZE = 20;

  const fetchCases = async (loadMore = false) => {
    if (!user) return;

    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      let casesQuery = query(
        collection(db, COLLECTIONS.CONSULTATION_CASES),
        where('assignedDoctorId', '==', user.uid),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc'),
        limit(PAGE_SIZE)
      );

      if (loadMore && cases.length > 0) {
        const lastCase = cases[cases.length - 1];
        casesQuery = query(
          collection(db, COLLECTIONS.CONSULTATION_CASES),
          where('assignedDoctorId', '==', user.uid),
          where('status', '==', 'completed'),
          orderBy('completedAt', 'desc'),
          startAfter(lastCase.completedAt),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(casesQuery);
      const newCases = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        completedAt: doc.data().completedAt?.toDate?.() || new Date(),
      })) as ConsultationCase[];

      if (loadMore) {
        setCases(prev => [...prev, ...newCases]);
      } else {
        setCases(newCases);
      }

      setHasMore(newCases.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error fetching cases:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [user]);

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const filteredCases = cases.filter(c => {
    if (filter === 'all') return true;
    return c.tier === filter;
  });

  // Calculate stats
  const totalEarnings = cases.reduce((sum, c) => sum + c.doctorPayout, 0);
  const avgRating = cases.filter(c => c.patientRating).reduce((sum, c, _, arr) =>
    sum + (c.patientRating || 0) / arr.length, 0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">{t('cases.history.loadingHistory')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('cases.history.title')}</h1>
          <p className="text-gray-600">{t('cases.history.subtitle')}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">{t('cases.history.totalCases')}</p>
          <p className="text-2xl font-bold text-gray-900">{cases.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">{t('cases.history.totalEarned')}</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalEarnings)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">{t('cases.history.priorityCases')}</p>
          <p className="text-2xl font-bold text-amber-600">
            {cases.filter(c => c.tier === 'priority').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">{t('cases.history.avgRating')}</p>
          <p className="text-2xl font-bold text-gray-900 flex items-center gap-1">
            {avgRating > 0 ? avgRating.toFixed(1) : '\u2014'}
            {avgRating > 0 && (
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'standard', 'priority'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              filter === f
                ? f === 'priority'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? t('cases.history.allCases') : f === 'standard' ? t('common.standard') : t('common.priority')}
          </button>
        ))}
      </div>

      {/* Cases List */}
      {filteredCases.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('cases.history.empty')}</h3>
          <p className="text-gray-500">{t('cases.history.emptyDesc')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('cases.history.patient')}</th>
                <th className="px-5 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('cases.history.complaint')}</th>
                <th className="px-5 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('cases.history.date')}</th>
                <th className="px-5 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('cases.history.type')}</th>
                <th className="px-5 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('common.rating')}</th>
                <th className="px-5 py-3 text-end text-xs font-semibold text-gray-500 uppercase">{t('cases.history.earnings')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCases.map((caseItem) => (
                <tr key={caseItem.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        caseItem.tier === 'priority' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {caseItem.patientName?.[0]?.toUpperCase() || 'P'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{caseItem.patientName}</p>
                        <p className="text-sm text-gray-500">
                          {caseItem.patientAge}y, {caseItem.patientSex}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-gray-900 truncate max-w-xs">{caseItem.chiefComplaint}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {caseItem.completedAt?.toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      caseItem.tier === 'priority'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {caseItem.tier === 'priority' ? t('common.priority') : t('common.standard')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {caseItem.patientRating ? (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-gray-900">{caseItem.patientRating}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">{'\u2014'}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-end">
                    <span className={`font-semibold ${
                      caseItem.tier === 'priority' ? 'text-amber-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(caseItem.doctorPayout)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Load More */}
          {hasMore && (
            <div className="p-4 border-t border-gray-200 text-center">
              <button
                onClick={() => fetchCases(true)}
                disabled={loadingMore}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition disabled:opacity-50"
              >
                {loadingMore ? t('common.loading') : t('cases.history.loadMore')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CaseHistory;
