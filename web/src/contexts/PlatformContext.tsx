import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';
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

  // Fetch all organizations with stats via Cloud Function
  const refreshOrganizations = useCallback(async () => {
    setOrgsLoading(true);
    try {
      const getPlatformOrganizations = httpsCallable(functions, 'getPlatformOrganizations');
      const result = await getPlatformOrganizations({});
      const data = result.data as { organizations: any[] };

      const orgsWithStats: OrganizationWithStats[] = data.organizations.map(org => ({
        id: org.id,
        name: org.name,
        code: org.code,
        type: org.type,
        isActive: org.isActive,
        maxUsers: org.maxUsers,
        createdAt: org.createdAt ? new Date(org.createdAt) : new Date(),
        updatedAt: org.updatedAt ? new Date(org.updatedAt) : new Date(),
        userCount: org.userCount,
        conversationCount: 0, // Not fetched for performance
      }));

      setOrganizations(orgsWithStats);
    } catch (err: any) {
      console.error('Error fetching organizations:', err);
      setError(err.message || 'Failed to load organizations');
    } finally {
      setOrgsLoading(false);
    }
  }, []);

  // Fetch platform-wide metrics via Cloud Function
  const refreshMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const getPlatformAnalytics = httpsCallable(functions, 'getPlatformAnalytics');
      const result = await getPlatformAnalytics({});
      const data = result.data as PlatformMetrics;

      setMetrics({
        totalOrganizations: data.totalOrganizations,
        activeOrganizations: data.activeOrganizations,
        totalUsers: data.totalUsers,
        totalDoctors: data.totalDoctors,
        pendingDoctors: data.pendingDoctors,
        approvedDoctors: data.approvedDoctors,
        totalRevenue: data.totalRevenue,
        monthlyRevenue: data.monthlyRevenue,
        totalCases: data.totalCases,
        activeCases: data.activeCases,
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
