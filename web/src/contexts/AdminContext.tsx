import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import type { Organization } from '@shared/types';

export interface AdminUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
  organizationId: string;
  createdAt: Date | null;
  lastActive?: Date | null;
}

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number; // active in last 7 days
  totalConversations: number;
  conversationsThisMonth: number;
  emergencyFlags: number;
}

// Analytics chart data types
export interface DailyConversation {
  date: string;
  conversations: number;
  emergencies: number;
}

export interface SymptomCount {
  name: string;
  count: number;
}

export interface HourlyUsage {
  hour: string;
  count: number;
}

export interface AnalyticsData {
  conversationsByDay: DailyConversation[];
  topSymptoms: SymptomCount[];
  usageByHour: HourlyUsage[];
  emergencyByDay: DailyConversation[];
}

interface AdminContextType {
  // Organization data
  organization: Organization | null;

  // Current admin user
  adminUser: AdminUser | null;

  // Organization users
  orgUsers: AdminUser[];

  // Dashboard metrics
  metrics: DashboardMetrics | null;

  // Analytics data for charts
  analyticsData: AnalyticsData | null;

  // Loading states
  loading: boolean;
  metricsLoading: boolean;
  usersLoading: boolean;
  analyticsLoading: boolean;

  // Error state
  error: string | null;

  // Actions
  refreshOrganization: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  refreshAnalytics: (days?: number) => Promise<void>;
  refreshAll: () => Promise<void>;
  clearError: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // State
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [orgUsers, setOrgUsers] = useState<AdminUser[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch organization data
  const refreshOrganization = useCallback(async () => {
    if (!user) return;

    try {
      // Get admin user document
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      const orgId = userData.organizationId;

      if (!orgId) {
        throw new Error('No organization associated with user');
      }

      // Set admin user data
      setAdminUser({
        id: user.uid,
        email: userData.email || user.email || '',
        role: userData.role,
        organizationId: orgId,
        createdAt: userData.createdAt?.toDate?.() || null,
      });

      // Get organization document
      const orgDoc = await getDoc(doc(db, 'organizations', orgId));
      if (!orgDoc.exists()) {
        throw new Error('Organization not found');
      }

      const orgData = orgDoc.data();
      setOrganization({
        id: orgDoc.id,
        name: orgData.name,
        code: orgData.code,
        type: orgData.type,
        isActive: orgData.isActive,
        maxUsers: orgData.maxUsers,
        createdAt: orgData.createdAt?.toDate?.() || new Date(),
        updatedAt: orgData.updatedAt?.toDate?.() || new Date(),
      });
    } catch (err: any) {
      console.error('Error fetching organization:', err);
      setError(err.message || 'Failed to load organization');
    }
  }, [user]);

  // Fetch organization users
  const refreshUsers = useCallback(async () => {
    if (!adminUser?.organizationId) return;

    setUsersLoading(true);
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('organizationId', '==', adminUser.organizationId)
      );

      const snapshot = await getDocs(usersQuery);
      const users: AdminUser[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email || '',
          role: data.role || 'user',
          organizationId: data.organizationId,
          createdAt: data.createdAt?.toDate?.() || null,
          lastActive: data.lastActive?.toDate?.() || null,
        };
      });

      setOrgUsers(users);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, [adminUser?.organizationId]);

  // Fetch dashboard metrics
  const refreshMetrics = useCallback(async () => {
    if (!adminUser?.organizationId) return;

    setMetricsLoading(true);
    try {
      // Get all users in org
      const usersQuery = query(
        collection(db, 'users'),
        where('organizationId', '==', adminUser.organizationId)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const userIds = usersSnapshot.docs.map((doc) => doc.id);
      const totalUsers = userIds.length;

      // Calculate active users (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let activeUsers = 0;
      usersSnapshot.docs.forEach((doc) => {
        const lastActive = doc.data().lastActive?.toDate?.();
        if (lastActive && lastActive >= sevenDaysAgo) {
          activeUsers++;
        }
      });

      // Get conversations for all users in org
      let totalConversations = 0;
      let conversationsThisMonth = 0;
      let emergencyFlags = 0;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Query conversations for each user (batch in groups if needed)
      for (const userId of userIds) {
        const conversationsQuery = query(
          collection(db, 'conversations'),
          where('userId', '==', userId)
        );

        const convSnapshot = await getDocs(conversationsQuery);
        totalConversations += convSnapshot.docs.length;

        convSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate?.();

          if (createdAt && createdAt >= startOfMonth) {
            conversationsThisMonth++;
          }

          if (data.emergencyDetected) {
            emergencyFlags++;
          }
        });
      }

      setMetrics({
        totalUsers,
        activeUsers,
        totalConversations,
        conversationsThisMonth,
        emergencyFlags,
      });
    } catch (err: any) {
      console.error('Error fetching metrics:', err);
      setError(err.message || 'Failed to load metrics');
    } finally {
      setMetricsLoading(false);
    }
  }, [adminUser?.organizationId]);

  // Fetch analytics data for charts
  const refreshAnalytics = useCallback(async (days: number = 30) => {
    if (!adminUser?.organizationId) return;

    setAnalyticsLoading(true);
    try {
      // Get all users in org
      const usersQuery = query(
        collection(db, 'users'),
        where('organizationId', '==', adminUser.organizationId)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const userIds = usersSnapshot.docs.map((doc) => doc.id);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Initialize data structures
      const conversationsByDay: Record<string, { conversations: number; emergencies: number }> = {};
      const symptomCounts: Record<string, number> = {};
      const usageByHour: Record<number, number> = {};

      // Initialize days
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        conversationsByDay[dateStr] = { conversations: 0, emergencies: 0 };
      }

      // Initialize hours
      for (let h = 0; h < 24; h++) {
        usageByHour[h] = 0;
      }

      // Fetch conversations for all users
      for (const userId of userIds) {
        const conversationsQuery = query(
          collection(db, 'conversations'),
          where('userId', '==', userId)
        );

        const convSnapshot = await getDocs(conversationsQuery);

        convSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate?.();

          if (createdAt && createdAt >= startDate && createdAt <= endDate) {
            const dateStr = createdAt.toISOString().split('T')[0];
            const hour = createdAt.getHours();

            if (conversationsByDay[dateStr]) {
              conversationsByDay[dateStr].conversations++;
              if (data.emergencyDetected) {
                conversationsByDay[dateStr].emergencies++;
              }
            }

            usageByHour[hour]++;

            // Extract symptoms from conversation title or first message
            // This is a simplified extraction - in production, you'd analyze messages
            const title = data.title?.toLowerCase() || '';
            const commonSymptoms = [
              'headache', 'fever', 'cough', 'fatigue', 'nausea',
              'pain', 'cold', 'flu', 'anxiety', 'insomnia',
              'stomach', 'back pain', 'sore throat', 'dizziness', 'rash'
            ];
            commonSymptoms.forEach((symptom) => {
              if (title.includes(symptom)) {
                symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
              }
            });
          }
        });
      }

      // Convert to array formats for charts
      const conversationsByDayArray: DailyConversation[] = Object.entries(conversationsByDay)
        .map(([date, data]) => ({
          date,
          conversations: data.conversations,
          emergencies: data.emergencies,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const topSymptoms: SymptomCount[] = Object.entries(symptomCounts)
        .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // If no symptoms found, add placeholder data
      if (topSymptoms.length === 0) {
        topSymptoms.push(
          { name: 'Headache', count: 0 },
          { name: 'Fever', count: 0 },
          { name: 'Fatigue', count: 0 },
          { name: 'Cough', count: 0 }
        );
      }

      const usageByHourArray: HourlyUsage[] = Object.entries(usageByHour)
        .map(([hour, count]) => ({
          hour: `${hour.padStart(2, '0')}:00`,
          count,
        }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

      setAnalyticsData({
        conversationsByDay: conversationsByDayArray,
        topSymptoms,
        usageByHour: usageByHourArray,
        emergencyByDay: conversationsByDayArray, // Same data, filtered for emergencies in chart
      });
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [adminUser?.organizationId]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    setLoading(true);
    await refreshOrganization();
    setLoading(false);
  }, [refreshOrganization]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial load
  useEffect(() => {
    if (user) {
      refreshAll();
    }
  }, [user, refreshAll]);

  // Load users and metrics after organization is loaded
  useEffect(() => {
    if (adminUser?.organizationId) {
      refreshUsers();
      refreshMetrics();
      refreshAnalytics(30); // Load last 30 days by default
    }
  }, [adminUser?.organizationId, refreshUsers, refreshMetrics, refreshAnalytics]);

  const value: AdminContextType = {
    organization,
    adminUser,
    orgUsers,
    metrics,
    analyticsData,
    loading,
    metricsLoading,
    usersLoading,
    analyticsLoading,
    error,
    refreshOrganization,
    refreshUsers,
    refreshMetrics,
    refreshAnalytics,
    refreshAll,
    clearError,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
