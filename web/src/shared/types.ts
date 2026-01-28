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

// Role type for hierarchical RBAC
export type UserRole = 'user' | 'org_admin' | 'platform_admin';

// Supported language codes
export type PreferredLanguage = 'en' | 'es' | 'ar' | 'zh' | 'hi' | 'ur' | 'fr' | 'pt' | 'vi' | 'ko';

export interface UserProfile {
  id: string;
  email: string;
  organizationId: string | null;  // null for platform_admin
  role: UserRole;
  avatarUrl?: string;
  preferredLanguage?: PreferredLanguage;  // User's preferred UI language
  createdAt: Date;
  updatedAt: Date;
}

// Role helper functions
export const isPlatformAdmin = (profile: UserProfile | null | undefined): boolean => {
  return profile?.role === 'platform_admin';
};

export const isOrgAdmin = (profile: UserProfile | null | undefined): boolean => {
  return profile?.role === 'org_admin';
};

export const isAnyAdmin = (profile: UserProfile | null | undefined): boolean => {
  return profile?.role === 'org_admin' || profile?.role === 'platform_admin';
};

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

export interface ImageMetadata {
  originalName: string;
  size: number; // bytes
  type: string; // mime type
  uploadedAt: Date;
}

// Source citation from RAG or web search
export interface SourceCitation {
  name: string;
  url: string;
  snippet?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  emergencyFlag?: boolean;
  imageUrl?: string; // Firebase Storage download URL
  imageMetadata?: ImageMetadata;
  sources?: SourceCitation[]; // Citations from RAG or web search
  usedWebSearch?: boolean; // Whether web search was used for this response
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

// Doctor Portal Types
export type DoctorStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

// Notification Settings for Doctors
export interface NotificationSettings {
  // Email notifications
  emailNewCase: boolean;       // New case available in queue
  emailCaseAssigned: boolean;  // Priority case assigned to you
  emailPayoutSent: boolean;    // Payout processed
  emailWeeklyDigest: boolean;  // Weekly summary email
  // Push notifications
  pushNewCase: boolean;        // Instant push for new cases
  pushMessages: boolean;       // Patient message alerts
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailNewCase: true,
  emailCaseAssigned: true,
  emailPayoutSent: true,
  emailWeeklyDigest: true,
  pushNewCase: true,
  pushMessages: true,
};

export type DoctorSpecialty =
  | 'family_medicine'
  | 'internal_medicine'
  | 'pediatrics'
  | 'dermatology'
  | 'psychiatry'
  | 'obgyn'
  | 'cardiology'
  | 'orthopedics'
  | 'neurology'
  | 'emergency_medicine'
  | 'other';

export const SPECIALTY_LABELS: Record<DoctorSpecialty, string> = {
  family_medicine: 'Family Medicine',
  internal_medicine: 'Internal Medicine',
  pediatrics: 'Pediatrics',
  dermatology: 'Dermatology',
  psychiatry: 'Psychiatry',
  obgyn: 'OB/GYN',
  cardiology: 'Cardiology',
  orthopedics: 'Orthopedics',
  neurology: 'Neurology',
  emergency_medicine: 'Emergency Medicine',
  other: 'Other'
};

export interface DoctorProfile {
  id: string;
  email: string;
  name: string;
  displayName?: string; // For emails/notifications
  specialties: DoctorSpecialty[];
  credentials: string[];
  licenseNumber: string;
  licenseState: string;
  licenseUrl: string; // Firebase Storage URL
  photoUrl: string;
  bio: string;
  yearsExperience: number;
  rating: number;
  totalRatings: number;
  totalCases: number;
  isAvailable: boolean;
  status: DoctorStatus;
  // Stripe Connect
  stripeAccountId?: string;
  stripeOnboardingComplete: boolean;
  // Earnings
  pendingBalance: number; // cents - awaiting payout
  totalEarnings: number; // cents - lifetime
  // Notifications
  notificationSettings?: NotificationSettings;
  fcmTokens?: string[]; // Push notification tokens
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

// Consultation Case - represents a $25 or $45 consultation request
export type ConsultationTier = 'standard' | 'priority';
export type CaseStatus = 'pending' | 'assigned' | 'active' | 'completed' | 'cancelled' | 'refunded';

export interface ConsultationCase {
  id: string;
  // Patient info
  userId: string;
  patientName: string;
  patientAge: number;
  patientSex: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  // Case details
  chiefComplaint: string;
  symptoms: string;
  aiConversationId?: string; // Reference to AI chat that led to this
  imageUrls: string[]; // Any images patient attached
  // Tier & Pricing
  tier: ConsultationTier;
  amount: number; // cents: 2500 or 4500
  platformFee: number; // cents: 500 or 900
  doctorPayout: number; // cents: 2000 or 3600
  // Doctor assignment
  requestedDoctorId?: string; // Only for priority tier
  assignedDoctorId?: string;
  // Payment
  paymentIntentId: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  // Status & Timestamps
  status: CaseStatus;
  createdAt: Date;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  // Priority request timeout
  priorityExpiresAt?: Date; // 5 min from creation for priority cases
  // Completion
  doctorNotes?: string;
  patientRating?: number; // 1-5
  patientReview?: string;
}

// Doctor-Patient Chat Messages
export interface ConsultationMessage {
  id: string;
  caseId: string;
  senderId: string;
  senderRole: 'doctor' | 'patient';
  content: string;
  imageUrl?: string;
  imageMetadata?: ImageMetadata;
  timestamp: Date;
  read: boolean;
}

// Doctor Earnings/Payout
export interface DoctorPayout {
  id: string;
  doctorId: string;
  amount: number; // cents
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stripeTransferId?: string;
  cases: string[]; // Array of case IDs included in this payout
  createdAt: Date;
  processedAt?: Date;
  failureReason?: string;
}

// Doctor availability for patient selection
export interface AvailableDoctor {
  id: string;
  name: string;
  photoUrl: string;
  specialties: DoctorSpecialty[];
  yearsExperience: number;
  rating: number;
  totalRatings: number;
  bio: string;
  isAvailable: boolean;
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

// Payment and Consultation types
export interface ConsultationSession {
  id: string;
  userId: string;
  doctorId: string;
  conversationId?: string;
  consultationType: 'text' | 'voice' | 'video';
  status: 'pending_payment' | 'paid' | 'in_progress' | 'completed' | 'cancelled';
  paymentIntentId: string;
  amount: number; // in cents (2500 = $25)
  duration: number; // in minutes (15)
  createdAt: Date;
  paidAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface Payment {
  id: string;
  userId: string;
  consultationSessionId: string;
  amount: number; // in cents
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  stripePaymentIntentId: string;
  createdAt: Date;
  completedAt?: Date;
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
