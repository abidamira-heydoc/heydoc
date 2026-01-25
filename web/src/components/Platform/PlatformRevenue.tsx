import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface CaseData {
  id: string;
  amount: number;
  platformFee: number;
  doctorPayout: number;
  status: string;
  paymentStatus: string;
  tier: 'standard' | 'priority';
  createdAt: Date;
  completedAt?: Date;
}

interface MonthlyData {
  month: string;
  revenue: number;
  cases: number;
}

const PlatformRevenue: React.FC = () => {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [dateRange, setDateRange] = useState<'30' | '90' | '365'>('30');

  useEffect(() => {
    fetchRevenueData();
  }, [dateRange]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const casesQuery = query(
        collection(db, 'consultationCases'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(casesQuery);

      const allCases: CaseData[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: data.amount || 0,
          platformFee: data.platformFee || 0,
          doctorPayout: data.doctorPayout || 0,
          status: data.status,
          paymentStatus: data.paymentStatus,
          tier: data.tier,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          completedAt: data.completedAt?.toDate?.() || undefined,
        };
      });

      setCases(allCases);

      // Calculate monthly data
      const monthlyMap = new Map<string, { revenue: number; cases: number }>();
      allCases.forEach(c => {
        if (c.paymentStatus === 'paid') {
          const monthKey = c.createdAt.toISOString().slice(0, 7); // YYYY-MM
          const existing = monthlyMap.get(monthKey) || { revenue: 0, cases: 0 };
          monthlyMap.set(monthKey, {
            revenue: existing.revenue + c.platformFee,
            cases: existing.cases + 1,
          });
        }
      });

      const sortedMonthly = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => b.month.localeCompare(a.month))
        .slice(0, 12);

      setMonthlyData(sortedMonthly);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Calculate stats
  const paidCases = cases.filter(c => c.paymentStatus === 'paid');
  const totalRevenue = paidCases.reduce((sum, c) => sum + c.platformFee, 0);
  const totalTransactions = paidCases.reduce((sum, c) => sum + c.amount, 0);
  const standardCases = paidCases.filter(c => c.tier === 'standard').length;
  const priorityCases = paidCases.filter(c => c.tier === 'priority').length;
  const avgRevenuePerCase = paidCases.length > 0 ? totalRevenue / paidCases.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h1>
          <p className="text-gray-600 mt-1">Platform revenue and transaction analytics</p>
        </div>
        <div className="flex gap-2">
          {(['30', '90', '365'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                dateRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '30' ? '30 Days' : range === '90' ? '90 Days' : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Platform Revenue</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(totalRevenue)}
              </p>
              <p className="text-xs text-gray-400 mt-1">20% of transactions</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {formatCurrency(totalTransactions)}
              </p>
              <p className="text-xs text-gray-400 mt-1">{paidCases.length} paid consultations</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Revenue/Case</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {formatCurrency(avgRevenuePerCase)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Platform fee</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Case Breakdown</p>
              <div className="flex gap-4 mt-1">
                <div>
                  <p className="text-lg font-bold text-gray-900">{standardCases}</p>
                  <p className="text-xs text-gray-400">Standard</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-600">{priorityCases}</p>
                  <p className="text-xs text-gray-400">Priority</p>
                </div>
              </div>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Monthly Revenue</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-gray-500">Loading revenue data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cases
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthlyData.map((month) => (
                  <tr key={month.month} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {formatMonth(month.month)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {month.cases}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-green-600">
                      {formatCurrency(month.revenue)}
                    </td>
                  </tr>
                ))}
                {monthlyData.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      No revenue data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case ID
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform Fee
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cases.slice(0, 10).map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {c.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {c.id.slice(0, 8)}...
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.tier === 'priority'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {c.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {formatCurrency(c.amount)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                    {formatCurrency(c.platformFee)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : c.paymentStatus === 'refunded'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {c.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
              {cases.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlatformRevenue;
