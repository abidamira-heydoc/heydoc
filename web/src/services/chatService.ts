import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

type ConversationStage = 'INTAKE1' | 'INTAKE2' | 'FULL_RESPONSE';

interface ChatResponse {
  message: string;
  nextStage?: ConversationStage;
  usage?: any;
}

interface SendMessageResult {
  message: string;
  nextStage: ConversationStage;
}

interface EmergencyDetectionResponse {
  isEmergency: boolean;
  detectedAt: string;
}

export type { ConversationStage };

export const chatService = {
  /**
   * Send a message to the AI and get a response
   */
  async sendMessage(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    healthProfile?: any,
    stage: ConversationStage = 'INTAKE1'
  ): Promise<SendMessageResult> {
    const chat = httpsCallable<any, ChatResponse>(functions, 'chat');

    const result = await chat({
      messages,
      healthProfile,
      stage,
    });

    return {
      message: result.data.message,
      nextStage: result.data.nextStage || 'FULL_RESPONSE',
    };
  },

  /**
   * Detect if a message contains emergency symptoms
   */
  async detectEmergency(message: string): Promise<boolean> {
    const detectEmergency = httpsCallable<{ message: string }, EmergencyDetectionResponse>(
      functions,
      'detectEmergency'
    );

    const result = await detectEmergency({ message });
    return result.data.isEmergency;
  },

  /**
   * Client-side emergency detection (fast, runs before server check)
   */
  quickEmergencyCheck(message: string): boolean {
    const messageLower = message.toLowerCase();

    const emergencyKeywords = [
      'chest pain',
      'chest pressure',
      'heart attack',
      'can\'t breathe',
      'shortness of breath',
      'difficulty breathing',
      'severe bleeding',
      'uncontrolled bleeding',
      'unconscious',
      'passed out',
      'loss of consciousness',
      'stroke',
      'face drooping',
      'slurred speech',
      'severe head injury',
      'head trauma',
      'seizure',
      'convulsions',
      'suicide',
      'suicidal',
      'want to die',
      'kill myself',
      'severe allergic',
      'anaphylaxis',
      'throat closing',
      'poisoning',
      'overdose',
    ];

    return emergencyKeywords.some((keyword) => messageLower.includes(keyword));
  },
};
