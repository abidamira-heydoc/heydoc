import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from '@shared/firebase.config';
import type { AvailableDoctor } from '@shared/types';

export const doctorService = {
  /**
   * Fetch available doctors for patient selection
   * Returns only approved doctors who are currently available
   */
  async getAvailableDoctors(): Promise<AvailableDoctor[]> {
    try {
      const doctorsQuery = query(
        collection(db, COLLECTIONS.DOCTORS),
        where('status', '==', 'approved'),
        where('isAvailable', '==', true),
        orderBy('rating', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(doctorsQuery);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          photoUrl: data.photoUrl || '',
          specialties: data.specialties || [],
          yearsExperience: data.yearsExperience || 0,
          rating: data.rating || 0,
          totalRatings: data.totalRatings || 0,
          bio: data.bio || '',
          isAvailable: data.isAvailable,
        };
      });
    } catch (error) {
      console.error('Error fetching available doctors:', error);
      throw error;
    }
  },

  /**
   * Get a single doctor's public profile
   */
  async getDoctorProfile(doctorId: string): Promise<AvailableDoctor | null> {
    try {
      const doctorsQuery = query(
        collection(db, COLLECTIONS.DOCTORS),
        where('status', '==', 'approved')
      );

      const snapshot = await getDocs(doctorsQuery);
      const doctorDoc = snapshot.docs.find(doc => doc.id === doctorId);

      if (!doctorDoc) return null;

      const data = doctorDoc.data();
      return {
        id: doctorDoc.id,
        name: data.name,
        photoUrl: data.photoUrl || '',
        specialties: data.specialties || [],
        yearsExperience: data.yearsExperience || 0,
        rating: data.rating || 0,
        totalRatings: data.totalRatings || 0,
        bio: data.bio || '',
        isAvailable: data.isAvailable,
      };
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      throw error;
    }
  },
};
