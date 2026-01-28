import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDoctor } from '../../contexts/DoctorContext';
import type { ConsultationCase } from '@shared/types';

const ActiveCases: React.FC = () => {
  const { t } = useTranslation('doctor');
  const { activeCases, casesLoading } = useDoctor();

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getTimeSince = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins} ${t('common.min')}`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m`;
  };

  if (casesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('cases.active.title')}</h1>
            <p className="text-gray-600 mt-1">{t('cases.active.subtitle')}</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-40 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('cases.active.title')}</h1>
          <p className="text-gray-600 mt-1">{t('cases.active.subtitle')}</p>
        </div>
        {activeCases.length > 0 && (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
            {activeCases.length} {t('common.active').toLowerCase()}
          </span>
        )}
      </div>

      {activeCases.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('cases.active.empty')}</h3>
          <p className="text-gray-500 mb-6">{t('cases.active.emptyDesc')}</p>
          <Link
            to="/doctor/cases"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            {t('cases.active.viewCaseQueue')}
            <svg className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activeCases.map((caseItem) => (
            <ActiveCaseCard
              key={caseItem.id}
              caseItem={caseItem}
              formatCurrency={formatCurrency}
              getTimeSince={getTimeSince}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface ActiveCaseCardProps {
  caseItem: ConsultationCase;
  formatCurrency: (cents: number) => string;
  getTimeSince: (date: Date) => string;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const ActiveCaseCard: React.FC<ActiveCaseCardProps> = ({
  caseItem,
  formatCurrency,
  getTimeSince,
  t,
}) => {
  const isPriority = caseItem.tier === 'priority';
  const startTime = caseItem.startedAt || caseItem.assignedAt || caseItem.createdAt;

  return (
    <Link
      to={`/doctor/chat/${caseItem.id}`}
      className={`block bg-white rounded-xl border-2 p-6 transition hover:shadow-lg ${
        isPriority ? 'border-amber-200' : 'border-green-200'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Patient Avatar */}
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold flex-shrink-0 ${
          isPriority ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
        }`}>
          {caseItem.patientName?.[0]?.toUpperCase() || 'P'}
        </div>

        {/* Case Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{caseItem.patientName}</h3>
            {isPriority && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {t('common.priority')}
              </span>
            )}
          </div>
          <p className="text-gray-600 mb-2">
            {caseItem.patientAge} {t('common.yearsOld')}, {caseItem.patientSex}
          </p>
          <p className="text-gray-900 font-medium line-clamp-1">{caseItem.chiefComplaint}</p>

          {/* Meta Info */}
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('cases.active.activeFor', { time: getTimeSince(startTime) })}
            </span>
            {caseItem.imageUrls && caseItem.imageUrls.length > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {caseItem.imageUrls.length} {caseItem.imageUrls.length > 1 ? t('common.images') : t('common.image')}
              </span>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={`text-lg font-bold ${isPriority ? 'text-amber-600' : 'text-green-600'}`}>
            {formatCurrency(caseItem.doctorPayout)}
          </span>
          <div className="flex items-center gap-2 text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">{t('cases.active.inProgress')}</span>
          </div>
          <div className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg">
            {t('cases.active.openChat')}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ActiveCases;
