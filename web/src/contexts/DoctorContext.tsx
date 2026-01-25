import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot, orderBy, limit, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { COLLECTIONS } from '@shared/firebase.config';
import type { DoctorProfile, ConsultationCase } from '@shared/types';

export interface DoctorMetrics {
  casesToday: number;
  casesThisWeek: number;
  earningsThisWeek: number;
  pendingBalance: number;
  averageRating: number;
  totalCases: number;
}

interface DoctorContextType {
  // Doctor profile
  doctor: DoctorProfile | null;

  // Cases
  pendingCases: ConsultationCase[]; // Standard $25 queue
  priorityCases: ConsultationCase[]; // Priority $45 requests for this doctor
  activeCases: ConsultationCase[]; // Cases currently being handled
  completedCases: ConsultationCase[]; // History

  // Metrics
  metrics: DoctorMetrics | null;

  // Loading states
  loading: boolean;
  casesLoading: boolean;
  metricsLoading: boolean;

  // Error state
  error: string | null;

  // Actions
  refreshDoctor: () => Promise<void>;
  refreshCases: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  toggleAvailability: () => Promise<void>;
  acceptCase: (caseId: string) => Promise<void>;
  declineCase: (caseId: string) => Promise<void>;
  clearError: () => void;
}

const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

export const useDoctor = () => {
  const context = useContext(DoctorContext);
  if (!context) {
    throw new Error('useDoctor must be used within a DoctorProvider');
  }
  return context;
};

export const DoctorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // State
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [pendingCases, setPendingCases] = useState<ConsultationCase[]>([]);
  const [priorityCases, setPriorityCases] = useState<ConsultationCase[]>([]);
  const [activeCases, setActiveCases] = useState<ConsultationCase[]>([]);
  const [completedCases, setCompletedCases] = useState<ConsultationCase[]>([]);
  const [metrics, setMetrics] = useState<DoctorMetrics | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [casesLoading, setCasesLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch doctor profile
  const refreshDoctor = useCallback(async () => {
    if (!user) return;

    try {
      const doctorDoc = await getDoc(doc(db, COLLECTIONS.DOCTORS, user.uid));
      if (!doctorDoc.exists()) {
        throw new Error('Doctor profile not found');
      }

      const data = doctorDoc.data();
      setDoctor({
        ...data,
        id: doctorDoc.id,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        approvedAt: data.approvedAt?.toDate?.() || undefined,
      } as DoctorProfile);
    } catch (err: any) {
      console.error('Error fetching doctor profile:', err);
      setError(err.message || 'Failed to load doctor profile');
    }
  }, [user]);

  // Fetch cases
  const refreshCases = useCallback(async () => {
    if (!user || !doctor) return;

    setCasesLoading(true);
    try {
      // Fetch pending standard cases (visible to all available doctors)
      const pendingQuery = query(
        collection(db, COLLECTIONS.CONSULTATION_CASES),
        where('status', '==', 'pending'),
        where('tier', '==', 'standard'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      const pending = pendingSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      })) as ConsultationCase[];
      setPendingCases(pending);

      // Fetch priority cases specifically for this doctor
      const priorityQuery = query(
        collection(db, COLLECTIONS.CONSULTATION_CASES),
        where('status', '==', 'pending'),
        where('tier', '==', 'priority'),
        where('requestedDoctorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const prioritySnapshot = await getDocs(priorityQuery);
      const priority = prioritySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        priorityExpiresAt: doc.data().priorityExpiresAt?.toDate?.() || undefined,
      })) as ConsultationCase[];
      setPriorityCases(priority);

      // Fetch active cases assigned to this doctor
      const activeQuery = query(
        collection(db, COLLECTIONS.CONSULTATION_CASES),
        where('assignedDoctorId', '==', user.uid),
        where('status', 'in', ['assigned', 'active']),
        orderBy('createdAt', 'desc')
      );
      const activeSnapshot = await getDocs(activeQuery);
      const active = activeSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        assignedAt: doc.data().assignedAt?.toDate?.() || undefined,
        startedAt: doc.data().startedAt?.toDate?.() || undefined,
      })) as ConsultationCase[];
      setActiveCases(active);

      // Fetch completed cases (last 50)
      const completedQuery = query(
        collection(db, COLLECTIONS.CONSULTATION_CASES),
        where('assignedDoctorId', '==', user.uid),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc'),
        limit(50)
      );
      const completedSnapshot = await getDocs(completedQuery);
      const completed = completedSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        completedAt: doc.data().completedAt?.toDate?.() || undefined,
      })) as ConsultationCase[];
      setCompletedCases(completed);
    } catch (err: any) {
      console.error('Error fetching cases:', err);
      setError(err.message || 'Failed to load cases');
    } finally {
      setCasesLoading(false);
    }
  }, [user, doctor]);

  // Fetch metrics
  const refreshMetrics = useCallback(async () => {
    if (!user || !doctor) return;

    setMetricsLoading(true);
    try {
      // Calculate date ranges
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);

      // Query completed cases for this doctor
      const casesQuery = query(
        collection(db, COLLECTIONS.CONSULTATION_CASES),
        where('assignedDoctorId', '==', user.uid),
        where('status', '==', 'completed')
      );
      const casesSnapshot = await getDocs(casesQuery);

      let casesToday = 0;
      let casesThisWeek = 0;
      let earningsThisWeek = 0;
      let totalRatingSum = 0;
      let ratingCount = 0;

      casesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const completedAt = data.completedAt?.toDate?.();

        if (completedAt) {
          if (completedAt >= startOfToday) {
            casesToday++;
          }
          if (completedAt >= startOfWeek) {
            casesThisWeek++;
            earningsThisWeek += data.doctorPayout || 0;
          }
        }

        if (data.patientRating) {
          totalRatingSum += data.patientRating;
          ratingCount++;
        }
      });

      setMetrics({
        casesToday,
        casesThisWeek,
        earningsThisWeek,
        pendingBalance: doctor.pendingBalance || 0,
        averageRating: ratingCount > 0 ? totalRatingSum / ratingCount : 0,
        totalCases: doctor.totalCases || casesSnapshot.docs.length,
      });
    } catch (err: any) {
      console.error('Error fetching metrics:', err);
      setError(err.message || 'Failed to load metrics');
    } finally {
      setMetricsLoading(false);
    }
  }, [user, doctor]);

  // Toggle availability
  const toggleAvailability = useCallback(async () => {
    if (!user || !doctor) return;

    try {
      const newAvailability = !doctor.isAvailable;
      await updateDoc(doc(db, COLLECTIONS.DOCTORS, user.uid), {
        isAvailable: newAvailability,
        updatedAt: new Date(),
      });
      setDoctor((prev: DoctorProfile | null) => prev ? { ...prev, isAvailable: newAvailability } : null);
    } catch (err: any) {
      console.error('Error toggling availability:', err);
      setError(err.message || 'Failed to update availability');
    }
  }, [user, doctor]);

  // Accept a case
  const acceptCase = useCallback(async (caseId: string) => {
    if (!user || !doctor) return;

    try {
      await updateDoc(doc(db, COLLECTIONS.CONSULTATION_CASES, caseId), {
        assignedDoctorId: user.uid,
        status: 'active',
        assignedAt: new Date(),
        startedAt: new Date(),
      });

      // Refresh cases after accepting
      await refreshCases();
    } catch (err: any) {
      console.error('Error accepting case:', err);
      setError(err.message || 'Failed to accept case');
      throw err;
    }
  }, [user, doctor, refreshCases]);

  // Decline a case (for priority requests)
  const declineCase = useCallback(async (caseId: string) => {
    if (!user) return;

    try {
      // This will trigger a refund on the backend
      await updateDoc(doc(db, COLLECTIONS.CONSULTATION_CASES, caseId), {
        status: 'refunded',
        cancelledAt: new Date(),
      });

      // Refresh cases after declining
      await refreshCases();
    } catch (err: any) {
      console.error('Error declining case:', err);
      setError(err.message || 'Failed to decline case');
      throw err;
    }
  }, [user, refreshCases]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      if (user) {
        setLoading(true);
        await refreshDoctor();
        setLoading(false);
      }
    };
    loadInitialData();
  }, [user, refreshDoctor]);

  // Load cases and metrics after doctor is loaded
  useEffect(() => {
    if (doctor && doctor.status === 'approved') {
      refreshCases();
      refreshMetrics();
    }
  }, [doctor, refreshCases, refreshMetrics]);

  // Real-time listener for priority cases
  useEffect(() => {
    if (!user || !doctor || doctor.status !== 'approved') return;

    const priorityQuery = query(
      collection(db, COLLECTIONS.CONSULTATION_CASES),
      where('status', '==', 'pending'),
      where('tier', '==', 'priority'),
      where('requestedDoctorId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(priorityQuery, (snapshot) => {
      const priority = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        priorityExpiresAt: doc.data().priorityExpiresAt?.toDate?.() || undefined,
      })) as ConsultationCase[];
      setPriorityCases(priority);

      // Play notification sound if new priority case
      if (priority.length > priorityCases.length) {
        // You could add audio notification here
        console.log('New priority case received!');
      }
    });

    return () => unsubscribe();
  }, [user, doctor, priorityCases.length]);

  const value: DoctorContextType = {
    doctor,
    pendingCases,
    priorityCases,
    activeCases,
    completedCases,
    metrics,
    loading,
    casesLoading,
    metricsLoading,
    error,
    refreshDoctor,
    refreshCases,
    refreshMetrics,
    toggleAvailability,
    acceptCase,
    declineCase,
    clearError,
  };

  return <DoctorContext.Provider value={value}>{children}</DoctorContext.Provider>;
};
