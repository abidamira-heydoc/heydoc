import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import type { ConsultationSession, ConsultationTier } from '@shared/types';

interface CreatePaymentIntentResponse {
  clientSecret: string;
  sessionId: string;
  caseId: string;
}

interface CreatePaymentIntentRequest {
  doctorId: string;
  consultationType: 'text' | 'voice' | 'video';
  tier: ConsultationTier;
  conversationId?: string;
  chiefComplaint?: string;
}

export const paymentService = {
  /**
   * Create a payment intent for a consultation session
   * Returns the client secret for Stripe Elements
   */
  async createConsultationPayment(
    doctorId: string,
    consultationType: 'text' | 'voice' | 'video',
    tier: ConsultationTier = 'standard',
    conversationId?: string,
    chiefComplaint?: string
  ): Promise<CreatePaymentIntentResponse> {
    const createPayment = httpsCallable<CreatePaymentIntentRequest, CreatePaymentIntentResponse>(
      functions,
      'createConsultationPayment'
    );

    const result = await createPayment({
      doctorId,
      consultationType,
      tier,
      conversationId,
      chiefComplaint,
    });

    return {
      clientSecret: result.data.clientSecret,
      sessionId: result.data.sessionId,
      caseId: result.data.caseId,
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
