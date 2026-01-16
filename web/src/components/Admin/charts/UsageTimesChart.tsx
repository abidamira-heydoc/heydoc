import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { HourlyUsage } from '../../../contexts/AdminContext';

interface UsageTimesChartProps {
  data: HourlyUsage[];
  loading?: boolean;
}

const UsageTimesChart: React.FC<UsageTimesChartProps> = ({ data, loading }) => {
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

  // Check if there's any data
  const hasData = data.some((item) => item.count > 0);

  if (!hasData) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium">No usage data</p>
          <p className="text-sm text-gray-400 mt-1">Peak hours will show once users start chatting</p>
        </div>
      </div>
    );
  }

  // Find peak hour
  const peakHour = data.reduce((max, item) => (item.count > max.count ? item : max), data[0]);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickLine={{ stroke: '#e5e7eb' }}
            axisLine={{ stroke: '#e5e7eb' }}
            interval={2}
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
            formatter={(value) => [value, 'Conversations']}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Bar
            dataKey="count"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            name="Conversations"
          />
        </BarChart>
      </ResponsiveContainer>
      {peakHour && peakHour.count > 0 && (
        <p className="text-xs text-gray-500 text-center mt-2">
          Peak usage: <span className="font-medium text-blue-600">{peakHour.hour}</span> with{' '}
          {peakHour.count} conversation{peakHour.count !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export default UsageTimesChart;
