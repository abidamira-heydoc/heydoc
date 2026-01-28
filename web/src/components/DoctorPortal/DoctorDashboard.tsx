import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDoctor } from '../../contexts/DoctorContext';
import { SPECIALTY_LABELS } from '@shared/types';
import type { DoctorSpecialty } from '@shared/types';

const DoctorDashboard: React.FC = () => {
  const { t } = useTranslation('doctor');
  const {
    doctor,
    metrics,
    pendingCases,
    priorityCases,
    activeCases,
    metricsLoading,
    toggleAvailability
  } = useDoctor();

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              {t('dashboard.welcomeBack', { name: doctor?.name?.split(' ').pop() })}
            </h1>
            <p className="text-blue-100">
              {doctor?.isAvailable
                ? t('dashboard.availableMessage')
                : t('dashboard.unavailableMessage')}
            </p>
          </div>
          <button
            onClick={toggleAvailability}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              doctor?.isAvailable
                ? 'bg-white text-blue-600 hover:bg-blue-50'
                : 'bg-blue-500 text-white hover:bg-blue-400 border-2 border-white/50'
            }`}
          >
            <span className={`w-3 h-3 rounded-full ${doctor?.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`} />
            {doctor?.isAvailable ? t('dashboard.goOffline') : t('dashboard.goOnline')}
          </button>
        </div>
      </div>

      {/* Priority Alert */}
      {priorityCases.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800">
                {t('dashboard.priorityAlert', { count: priorityCases.length })}
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                {t('dashboard.priorityAlertDesc')}
              </p>
            </div>
            <Link
              to="/doctor/cases"
              className="px-4 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition"
            >
              {t('dashboard.viewNow')}
            </Link>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t('dashboard.stats.casesToday')}
          value={metrics?.casesToday ?? 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          color="blue"
          loading={metricsLoading}
        />
        <MetricCard
          title={t('dashboard.stats.thisWeek')}
          value={formatCurrency(metrics?.earningsThisWeek ?? 0)}
          subtitle={`${metrics?.casesThisWeek ?? 0} ${t('common.cases')}`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="green"
          loading={metricsLoading}
        />
        <MetricCard
          title={t('dashboard.stats.pendingBalance')}
          value={formatCurrency(metrics?.pendingBalance ?? 0)}
          subtitle={t('dashboard.stats.payoutMonday')}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
          color="purple"
          loading={metricsLoading}
        />
        <MetricCard
          title={t('dashboard.stats.rating')}
          value={metrics?.averageRating ? metrics.averageRating.toFixed(1) : '—'}
          subtitle={`${doctor?.totalRatings ?? 0} ${t('common.reviews')}`}
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          }
          color="amber"
          loading={metricsLoading}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Cases */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.availableCases')}</h2>
            <Link to="/doctor/cases" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              {t('common.viewAll')}
            </Link>
          </div>

          {pendingCases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p>{t('dashboard.noCasesInQueue')}</p>
              <p className="text-sm mt-1">{t('dashboard.checkBackSoon')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingCases.slice(0, 3).map((caseItem) => (
                <div key={caseItem.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                    {caseItem.patientName?.[0]?.toUpperCase() || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {caseItem.patientName}, {caseItem.patientAge}{caseItem.patientSex === 'male' ? 'M' : caseItem.patientSex === 'female' ? 'F' : ''}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{caseItem.chiefComplaint}</p>
                  </div>
                  <div className="text-end">
                    <span className="text-green-600 font-semibold">{formatCurrency(caseItem.doctorPayout)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Cases */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.activeCases')}</h2>
            <Link to="/doctor/active" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              {t('common.viewAll')}
            </Link>
          </div>

          {activeCases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>{t('dashboard.noActiveConsultations')}</p>
              <p className="text-sm mt-1">{t('dashboard.acceptCaseToStart')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeCases.slice(0, 3).map((caseItem) => (
                <Link
                  key={caseItem.id}
                  to={`/doctor/chat/${caseItem.id}`}
                  className="flex items-center gap-4 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition"
                >
                  <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center text-green-700 font-semibold">
                    {caseItem.patientName?.[0]?.toUpperCase() || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{caseItem.patientName}</p>
                    <p className="text-sm text-gray-500 truncate">{caseItem.chiefComplaint}</p>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">{t('common.active')}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.yourProfile')}</h2>
          <Link to="/doctor/profile" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            {t('dashboard.editProfile')}
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Photo */}
          <div className="flex-shrink-0">
            {doctor?.photoUrl ? (
              <img
                src={doctor.photoUrl}
                alt={doctor.name}
                className="w-24 h-24 rounded-xl object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl font-bold text-blue-600">
                  {doctor?.name?.[0]?.toUpperCase() || 'D'}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{doctor?.name}</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {doctor?.specialties?.map((specialty: DoctorSpecialty) => (
                <span
                  key={specialty}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                >
                  {SPECIALTY_LABELS[specialty] || specialty}
                </span>
              ))}
            </div>
            <p className="text-gray-600 text-sm mb-3">{doctor?.bio}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span>{doctor?.yearsExperience} {t('common.yearsExperience')}</span>
              <span>License: {doctor?.licenseNumber} ({doctor?.licenseState})</span>
              <span>{doctor?.totalCases || 0} {t('common.totalCases').toLowerCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'amber';
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, color, loading }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-20 mb-1" />
          <div className="h-4 bg-gray-100 rounded w-16" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{subtitle || title}</p>
        </>
      )}
    </div>
  );
};

export default DoctorDashboard;
