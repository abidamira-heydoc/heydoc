import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import type { ConsultationSession } from '@shared/types';

interface CreatePaymentIntentResponse {
  clientSecret: string;
  sessionId: string;
}

interface CreatePaymentIntentRequest {
  doctorId: string;
  consultationType: 'text' | 'voice' | 'video';
}

export const paymentService = {
  /**
   * Create a payment intent for a consultation session
   * Returns the client secret for Stripe Elements
   */
  async createConsultationPayment(
    doctorId: string,
    consultationType: 'text' | 'voice' | 'video'
  ): Promise<CreatePaymentIntentResponse> {
    const createPayment = httpsCallable<CreatePaymentIntentRequest, CreatePaymentIntentResponse>(
      functions,
      'createConsultationPayment'
    );

    const result = await createPayment({
      doctorId,
      consultationType,
    });

    return {
      clientSecret: result.data.clientSecret,
      sessionId: result.data.sessionId,
    };
  },

  /**
   * Get consultation session status
   */
  async getConsultationSession(sessionId: string): Promise<ConsultationSession | null> {
    const getSession = httpsCallable<{ sessionId: string }, ConsultationSession | null>(
      functions,
      'getConsultationSession'
    );

    const result = await getSession({ sessionId });
    return result.data;
  },
};
