import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import type { SourceCitation } from '@shared/types';

type ConversationStage = 'INTAKE1' | 'INTAKE2' | 'FULL_RESPONSE';

interface ChatResponse {
  message: string;
  nextStage?: ConversationStage;
  sources?: SourceCitation[];
  usedWebSearch?: boolean;
  usage?: any;
}

interface SendMessageResult {
  message: string;
  nextStage: ConversationStage;
  sources?: SourceCitation[];
  usedWebSearch?: boolean;
}

interface EmergencyDetectionResponse {
  isEmergency: boolean;
  detectedAt: string;
}

export type { ConversationStage };

export const chatService = {
  /**
   * Send a message to the AI and get a response
   * Messages can include optional imageUrl for vision analysis
   * Options can include enableWebSearch to control web search behavior
   */
  async sendMessage(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string; imageUrl?: string }>,
    healthProfile?: any,
    stage: ConversationStage = 'INTAKE1',
    options?: { enableWebSearch?: boolean }
  ): Promise<SendMessageResult> {
    const chat = httpsCallable<any, ChatResponse>(functions, 'chat');

    const result = await chat({
      messages,
      healthProfile,
      stage,
      enableWebSearch: options?.enableWebSearch,
    });

    return {
      message: result.data.message,
      nextStage: result.data.nextStage || 'FULL_RESPONSE',
      sources: result.data.sources,
      usedWebSearch: result.data.usedWebSearch,
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
