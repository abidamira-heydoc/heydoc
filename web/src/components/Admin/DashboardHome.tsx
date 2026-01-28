import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../contexts/AdminContext';

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'purple' | 'orange' | 'red';
  loading?: boolean;
}> = ({ title, value, icon, color, loading }) => {
  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          )}
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </div>
    </div>
  );
};

const QuickAction: React.FC<{
  title: string;
  description: string;
  to: string;
  icon: React.ReactNode;
}> = ({ title, description, to, icon }) => (
  <Link
    to={to}
    className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-primary-200 transition-all group"
  >
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 group-hover:bg-primary-100 transition-colors">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </div>
  </Link>
);

const DashboardHome: React.FC = () => {
  const { t } = useTranslation('admin');
  const { organization, metrics, metricsLoading } = useAdmin();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {organization?.name
            ? t('dashboard.welcomeWithName', { name: organization.name })
            : t('dashboard.welcome')}
        </h1>
        <p className="text-primary-100">
          {t('dashboard.overview')}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t('dashboard.stats.totalUsers')}
          value={metrics?.totalUsers ?? 0}
          loading={metricsLoading}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <MetricCard
          title={t('dashboard.stats.conversationsThisMonth')}
          value={metrics?.conversationsThisMonth ?? 0}
          loading={metricsLoading}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
        />
        <MetricCard
          title={t('dashboard.stats.emergencyFlags')}
          value={metrics?.emergencyFlags ?? 0}
          loading={metricsLoading}
          color="red"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <MetricCard
          title={t('dashboard.stats.activeUsersDays')}
          value={metrics?.activeUsers ?? 0}
          loading={metricsLoading}
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.quickActions.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickAction
            title={t('dashboard.quickActions.viewAnalytics')}
            description={t('dashboard.quickActions.viewAnalyticsDesc')}
            to="/admin/analytics"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <QuickAction
            title={t('dashboard.quickActions.manageUsers')}
            description={t('dashboard.quickActions.manageUsersDesc')}
            to="/admin/users"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            }
          />
          <QuickAction
            title={t('dashboard.quickActions.generateReport')}
            description={t('dashboard.quickActions.generateReportDesc')}
            to="/admin/reports"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.recentActivity.title')}</h2>
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{t('dashboard.recentActivity.comingSoon')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('dashboard.recentActivity.trackActivity')}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
