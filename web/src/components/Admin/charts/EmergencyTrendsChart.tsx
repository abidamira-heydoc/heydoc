import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DailyConversation } from '../../../contexts/AdminContext';

interface EmergencyTrendsChartProps {
  data: DailyConversation[];
  loading?: boolean;
}

const EmergencyTrendsChart: React.FC<EmergencyTrendsChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading chart...</p>
        </div>
      </div>
    );
  }

  // Format date for display
  const formattedData = data.map((item) => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  // Check if there's any emergency data
  const totalEmergencies = data.reduce((sum, item) => sum + item.emergencies, 0);

  if (totalEmergencies === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto text-green-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium text-green-600">No emergencies detected</p>
          <p className="text-sm text-gray-400 mt-1">Great news! No emergency flags in this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={formattedData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id="emergencyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#e5e7eb' }}
            axisLine={{ stroke: '#e5e7eb' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#e5e7eb' }}
            axisLine={{ stroke: '#e5e7eb' }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value) => [value, 'Emergency Flags']}
          />
          <Area
            type="monotone"
            dataKey="emergencies"
            name="Emergencies"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#emergencyGradient)"
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, fill: '#ef4444' }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-2 mt-2">
        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
        <p className="text-xs text-gray-500">
          Total emergencies detected: <span className="font-medium text-red-600">{totalEmergencies}</span>
        </p>
      </div>
    </div>
  );
};

export default EmergencyTrendsChart;
