import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import {
  ConversationsChart,
  SymptomsChart,
  UsageTimesChart,
  EmergencyTrendsChart,
} from './charts';

type DateRange = '7d' | '30d' | '90d';

const dateRangeToDays: Record<DateRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

const AnalyticsDashboard: React.FC = () => {
  const { metrics, metricsLoading, analyticsData, analyticsLoading, refreshAnalytics } = useAdmin();
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  // Refresh analytics when date range changes
  useEffect(() => {
    refreshAnalytics(dateRangeToDays[dateRange]);
  }, [dateRange, refreshAnalytics]);

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Track usage patterns and health trends</p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
          {(['7d', '30d', '90d'] as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => handleDateRangeChange(range)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === range
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Conversations</p>
          {metricsLoading ? (
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{metrics?.totalConversations ?? 0}</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">This Month</p>
          {metricsLoading ? (
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{metrics?.conversationsThisMonth ?? 0}</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Active Users</p>
          {metricsLoading ? (
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{metrics?.activeUsers ?? 0}</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Emergency Alerts</p>
          {metricsLoading ? (
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-red-600">{metrics?.emergencyFlags ?? 0}</p>
          )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversations Over Time */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Conversations Over Time</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              Last {dateRangeToDays[dateRange]} days
            </span>
          </div>
          <ConversationsChart
            data={analyticsData?.conversationsByDay ?? []}
            loading={analyticsLoading}
          />
        </div>

        {/* Most Common Symptoms */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Most Common Symptoms</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              Top mentions
            </span>
          </div>
          <SymptomsChart
            data={analyticsData?.topSymptoms ?? []}
            loading={analyticsLoading}
          />
        </div>

        {/* Peak Usage Times */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Peak Usage Times</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              24-hour distribution
            </span>
          </div>
          <UsageTimesChart
            data={analyticsData?.usageByHour ?? []}
            loading={analyticsLoading}
          />
        </div>

        {/* Emergency Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Emergency Flag Trends</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              Critical alerts
            </span>
          </div>
          <EmergencyTrendsChart
            data={analyticsData?.emergencyByDay ?? []}
            loading={analyticsLoading}
          />
        </div>
      </div>

      {/* Insights Section */}
      <div className="bg-gradient-to-r from-primary-50 to-emerald-50 rounded-xl border border-primary-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Quick Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/60 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700">Engagement Rate</p>
            <p className="text-2xl font-bold text-primary-700 mt-1">
              {metrics && metrics.totalUsers > 0
                ? Math.round((metrics.activeUsers / metrics.totalUsers) * 100)
                : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Users active in last 7 days</p>
          </div>
          <div className="bg-white/60 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700">Avg. Conversations/User</p>
            <p className="text-2xl font-bold text-primary-700 mt-1">
              {metrics && metrics.totalUsers > 0
                ? (metrics.totalConversations / metrics.totalUsers).toFixed(1)
                : 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">All time average</p>
          </div>
          <div className="bg-white/60 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700">Emergency Detection Rate</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {metrics && metrics.totalConversations > 0
                ? ((metrics.emergencyFlags / metrics.totalConversations) * 100).toFixed(1)
                : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Conversations with alerts</p>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={() => refreshAnalytics(dateRangeToDays[dateRange])}
          disabled={analyticsLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 ${analyticsLoading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {analyticsLoading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
