// Shared types for HeyDoc application

// Organization - each business/shelter/school that uses HeyDoc
export interface Organization {
  id: string;
  name: string;
  code: string;              // Invite code (e.g., "SUNRISE2025")
  type: 'company' | 'school' | 'shelter' | 'refugee_camp' | 'prison' | 'nonprofit' | 'other';
  isActive: boolean;
  maxUsers?: number;         // Optional limit on users
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  organizationId: string;    // Links user to their org
  role: 'user' | 'admin';    // Admin can create/manage users
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthProfile {
  userId: string;
  // Basic Info
  age: number;
  sex: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  height: number; // in cm
  weight: number; // in kg

  // Medical History
  medicalHistory: string[];
  currentConditions: string[];
  allergies: string[];
  currentMedications: Medication[];
  familyHistory: FamilyHistory[];

  // Lifestyle Factors
  lifestyle: LifestyleFactors;

  // Documents (lab results, prescriptions, medical records)
  documents?: UploadedDocument[];

  // Metadata
  updatedAt: Date;
  consentGiven: boolean;
  consentDate?: Date;
}

export interface UploadedDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  category?: 'lab_result' | 'prescription' | 'medical_record' | 'insurance' | 'other';
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate?: Date;
}

export interface FamilyHistory {
  condition: string;
  relation: string; // e.g., 'mother', 'father', 'sibling'
}

export interface LifestyleFactors {
  smoking: 'never' | 'former' | 'current';
  smokingDetails?: string;
  alcohol: 'never' | 'occasionally' | 'regularly' | 'heavily';
  alcoholDetails?: string;
  exercise: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  exerciseDetails?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  emergencyDetected: boolean;
  messages: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  emergencyFlag?: boolean;
}

export interface EmergencySymptom {
  keywords: string[];
  description: string;
  severity: 'critical' | 'urgent';
}

export interface NaturalRemedy {
  type: 'tea' | 'herb' | 'nutrition' | 'lifestyle';
  name: string;
  instructions: string;
  dosage?: string;
  frequency?: string;
  warnings?: string[];
}

export interface DoctorProfile {
  id: string;
  name: string;
  specialties: string[];
  credentials: string[];
  rating: number;
  yearsExperience: number;
  avatarUrl: string;
  availability: 'available' | 'busy' | 'offline';
}

export interface Consent {
  userId: string;
  hipaaConsent: boolean;
  gdprConsent: boolean;
  dataCollectionConsent: boolean;
  consentDate: Date;
  ipAddress?: string;
}

// Medical History Entry - auto-saved from conversations
export interface MedicalHistoryEntry {
  id: string;
  userId: string;
  conversationId: string;
  date: Date;

  // Extracted from conversation
  symptoms: string[];           // e.g., ["headache", "fatigue", "nausea"]
  possibleConditions: string[]; // e.g., ["tension headache", "migraine"]
  recommendedRemedies: string[]; // e.g., ["peppermint oil", "rest", "hydration"]
  severity: 'mild' | 'moderate' | 'severe';

  // Summary for quick doctor review
  summary: string;              // e.g., "Patient reported headache with fatigue, likely tension headache"

  // Follow-up
  followUpNeeded: boolean;
  followUpNotes?: string;

  // Metadata
  createdAt: Date;
}

export const EMERGENCY_SYMPTOMS: EmergencySymptom[] = [
  {
    keywords: ['chest pain', 'chest pressure', 'heart attack', 'crushing chest'],
    description: 'Chest pain or pressure',
    severity: 'critical'
  },
  {
    keywords: ['shortness of breath', 'can\'t breathe', 'difficulty breathing', 'gasping'],
    description: 'Severe breathing difficulty',
    severity: 'critical'
  },
  {
    keywords: ['severe bleeding', 'uncontrolled bleeding', 'hemorrhage', 'bleeding won\'t stop'],
    description: 'Severe or uncontrolled bleeding',
    severity: 'critical'
  },
  {
    keywords: ['unconscious', 'passed out', 'loss of consciousness', 'fainted', 'unresponsive'],
    description: 'Loss of consciousness',
    severity: 'critical'
  },
  {
    keywords: ['stroke', 'face drooping', 'arm weakness', 'slurred speech', 'sudden confusion'],
    description: 'Signs of stroke',
    severity: 'critical'
  },
  {
    keywords: ['severe head injury', 'head trauma', 'skull fracture', 'brain injury'],
    description: 'Severe head injury',
    severity: 'critical'
  },
  {
    keywords: ['seizure', 'convulsions', 'fitting'],
    description: 'Seizure or convulsions',
    severity: 'critical'
  },
  {
    keywords: ['suicide', 'suicidal', 'want to die', 'kill myself', 'end my life'],
    description: 'Suicidal thoughts',
    severity: 'critical'
  },
  {
    keywords: ['severe allergic reaction', 'anaphylaxis', 'throat closing', 'tongue swelling'],
    description: 'Severe allergic reaction',
    severity: 'critical'
  },
  {
    keywords: ['poisoning', 'overdose', 'ingested', 'swallowed'],
    description: 'Poisoning or overdose',
    severity: 'critical'
  },
  {
    keywords: ['broken bone', 'bone protruding', 'compound fracture'],
    description: 'Severe fracture',
    severity: 'urgent'
  },
  {
    keywords: ['severe burn', 'third degree burn', 'extensive burn'],
    description: 'Severe burns',
    severity: 'urgent'
  }
];
