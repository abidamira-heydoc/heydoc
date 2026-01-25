import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import type { Organization, UserRole } from '@shared/types';

export interface PlatformUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date | null;
}

export interface PlatformMetrics {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  totalDoctors: number;
  pendingDoctors: number;
  approvedDoctors: number;
  totalRevenue: number; // cents
  monthlyRevenue: number; // cents
  totalCases: number;
  activeCases: number;
}

export interface OrganizationWithStats extends Organization {
  userCount: number;
  conversationCount: number;
}

interface PlatformContextType {
  // Current platform admin user
  platformUser: PlatformUser | null;

  // All organizations
  organizations: OrganizationWithStats[];

  // Platform-wide metrics
  metrics: PlatformMetrics | null;

  // Selected org for "view as org admin" feature
  selectedOrgId: string | null;
  selectedOrg: Organization | null;

  // Loading states
  loading: boolean;
  metricsLoading: boolean;
  orgsLoading: boolean;

  // Error state
  error: string | null;

  // Actions
  refreshOrganizations: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  selectOrganization: (orgId: string | null) => void;
  refreshAll: () => Promise<void>;
  clearError: () => void;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
};

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // State
  const [platformUser, setPlatformUser] = useState<PlatformUser | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationWithStats[]>([]);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [orgsLoading, setOrgsLoading] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch platform user data
  const fetchPlatformUser = useCallback(async () => {
    if (!user) return null;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      if (userData.role !== 'platform_admin') {
        throw new Error('Not a platform admin');
      }

      const pUser: PlatformUser = {
        id: user.uid,
        email: userData.email || user.email || '',
        role: userData.role,
        createdAt: userData.createdAt?.toDate?.() || null,
      };

      setPlatformUser(pUser);
      return pUser;
    } catch (err: any) {
      console.error('Error fetching platform user:', err);
      setError(err.message || 'Failed to load platform user');
      return null;
    }
  }, [user]);

  // Fetch all organizations with stats
  const refreshOrganizations = useCallback(async () => {
    setOrgsLoading(true);
    try {
      const orgsSnapshot = await getDocs(collection(db, 'organizations'));
      const orgsWithStats: OrganizationWithStats[] = [];

      for (const orgDoc of orgsSnapshot.docs) {
        const orgData = orgDoc.data();

        // Get user count for this org
        const usersQuery = query(
          collection(db, 'users'),
          where('organizationId', '==', orgDoc.id)
        );
        const usersSnapshot = await getDocs(usersQuery);

        // Get conversation count (approximate - count from first few users)
        let conversationCount = 0;
        const userIds = usersSnapshot.docs.slice(0, 10).map(d => d.id);
        for (const userId of userIds) {
          const convQuery = query(
            collection(db, 'conversations'),
            where('userId', '==', userId)
          );
          const convSnapshot = await getDocs(convQuery);
          conversationCount += convSnapshot.docs.length;
        }

        orgsWithStats.push({
          id: orgDoc.id,
          name: orgData.name,
          code: orgData.code,
          type: orgData.type,
          isActive: orgData.isActive,
          maxUsers: orgData.maxUsers,
          createdAt: orgData.createdAt?.toDate?.() || new Date(),
          updatedAt: orgData.updatedAt?.toDate?.() || new Date(),
          userCount: usersSnapshot.docs.length,
          conversationCount,
        });
      }

      setOrganizations(orgsWithStats);
    } catch (err: any) {
      console.error('Error fetching organizations:', err);
      setError(err.message || 'Failed to load organizations');
    } finally {
      setOrgsLoading(false);
    }
  }, []);

  // Fetch platform-wide metrics
  const refreshMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      // Get all organizations
      const orgsSnapshot = await getDocs(collection(db, 'organizations'));
      const totalOrganizations = orgsSnapshot.docs.length;
      const activeOrganizations = orgsSnapshot.docs.filter(d => d.data().isActive).length;

      // Get all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.docs.length;

      // Get all doctors
      const doctorsSnapshot = await getDocs(collection(db, 'doctors'));
      const totalDoctors = doctorsSnapshot.docs.length;
      const pendingDoctors = doctorsSnapshot.docs.filter(d => d.data().status === 'pending').length;
      const approvedDoctors = doctorsSnapshot.docs.filter(d => d.data().status === 'approved').length;

      // Get consultation cases for revenue
      const casesSnapshot = await getDocs(collection(db, 'consultationCases'));
      const totalCases = casesSnapshot.docs.length;
      const activeCases = casesSnapshot.docs.filter(d =>
        ['pending', 'assigned', 'active'].includes(d.data().status)
      ).length;

      // Calculate revenue
      let totalRevenue = 0;
      let monthlyRevenue = 0;
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      casesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.paymentStatus === 'paid') {
          const platformFee = data.platformFee || 0;
          totalRevenue += platformFee;

          const createdAt = data.createdAt?.toDate?.();
          if (createdAt && createdAt >= startOfMonth) {
            monthlyRevenue += platformFee;
          }
        }
      });

      setMetrics({
        totalOrganizations,
        activeOrganizations,
        totalUsers,
        totalDoctors,
        pendingDoctors,
        approvedDoctors,
        totalRevenue,
        monthlyRevenue,
        totalCases,
        activeCases,
      });
    } catch (err: any) {
      console.error('Error fetching metrics:', err);
      setError(err.message || 'Failed to load metrics');
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // Select an organization for viewing
  const selectOrganization = useCallback((orgId: string | null) => {
    setSelectedOrgId(orgId);
    if (orgId) {
      const org = organizations.find(o => o.id === orgId);
      setSelectedOrg(org || null);
    } else {
      setSelectedOrg(null);
    }
  }, [organizations]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    setLoading(true);
    await fetchPlatformUser();
    await Promise.all([refreshOrganizations(), refreshMetrics()]);
    setLoading(false);
  }, [fetchPlatformUser, refreshOrganizations, refreshMetrics]);

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

  const value: PlatformContextType = {
    platformUser,
    organizations,
    metrics,
    selectedOrgId,
    selectedOrg,
    loading,
    metricsLoading,
    orgsLoading,
    error,
    refreshOrganizations,
    refreshMetrics,
    selectOrganization,
    refreshAll,
    clearError,
  };

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
};
