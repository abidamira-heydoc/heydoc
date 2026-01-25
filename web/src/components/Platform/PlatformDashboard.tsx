import React from 'react';
import { usePlatform } from '../../contexts/PlatformContext';
import { Link } from 'react-router-dom';

const PlatformDashboard: React.FC = () => {
  const { metrics, metricsLoading, organizations, refreshMetrics } = usePlatform();

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const statCards = [
    {
      title: 'Total Organizations',
      value: metrics?.totalOrganizations || 0,
      subtext: `${metrics?.activeOrganizations || 0} active`,
      color: 'blue',
      link: '/platform/organizations',
    },
    {
      title: 'Total Users',
      value: metrics?.totalUsers || 0,
      subtext: 'Across all organizations',
      color: 'emerald',
    },
    {
      title: 'Pending Doctors',
      value: metrics?.pendingDoctors || 0,
      subtext: `${metrics?.approvedDoctors || 0} approved`,
      color: 'amber',
      link: '/platform/doctors',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(metrics?.monthlyRevenue || 0),
      subtext: `${formatCurrency(metrics?.totalRevenue || 0)} lifetime`,
      color: 'green',
      link: '/platform/revenue',
    },
    {
      title: 'Total Cases',
      value: metrics?.totalCases || 0,
      subtext: `${metrics?.activeCases || 0} active`,
      color: 'purple',
    },
    {
      title: 'Total Doctors',
      value: metrics?.totalDoctors || 0,
      subtext: `${metrics?.approvedDoctors || 0} available`,
      color: 'indigo',
      link: '/platform/doctors',
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500' },
    green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-500' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
          <p className="text-gray-500 mt-1">Monitor all HeyDoc organizations and metrics</p>
        </div>
        <button
          onClick={() => refreshMetrics()}
          disabled={metricsLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {metricsLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const colors = colorClasses[stat.color];
          const cardContent = (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className={`text-2xl font-bold mt-1 ${colors.text}`}>
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
                <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>
              </div>
              <div className={`w-12 h-12 ${colors.bg} rounded-full flex items-center justify-center`}>
                <div className={`w-6 h-6 ${colors.icon}`}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          );

          return stat.link ? (
            <Link
              key={stat.title}
              to={stat.link}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition cursor-pointer"
            >
              {cardContent}
            </Link>
          ) : (
            <div
              key={stat.title}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              {cardContent}
            </div>
          );
        })}
      </div>

      {/* Recent Organizations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Organizations</h2>
            <Link
              to="/platform/organizations"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {organizations.slice(0, 5).map((org) => (
            <div key={org.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-700 font-semibold">
                    {org.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{org.name}</p>
                  <p className="text-sm text-gray-500">Code: {org.code}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{org.userCount} users</p>
                <p className="text-xs text-gray-500">
                  {org.isActive ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-red-600">Inactive</span>
                  )}
                </p>
              </div>
            </div>
          ))}
          {organizations.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No organizations found
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/platform/doctors"
          className="bg-amber-50 border border-amber-200 rounded-xl p-6 hover:bg-amber-100 transition"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-amber-900">Review Doctor Applications</h3>
              <p className="text-sm text-amber-700">
                {metrics?.pendingDoctors || 0} pending applications
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/platform/organizations"
          className="bg-blue-50 border border-blue-200 rounded-xl p-6 hover:bg-blue-100 transition"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Manage Organizations</h3>
              <p className="text-sm text-blue-700">
                Add, edit, or view organization details
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default PlatformDashboard;
