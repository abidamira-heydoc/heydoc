// Firebase configuration
// NOTE: Replace these with your actual Firebase project credentials

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
};

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  ORGANIZATIONS: 'organizations',
  HEALTH_PROFILES: 'healthProfiles',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  CONSENTS: 'consents',
  AUDIT_LOGS: 'auditLogs',
  MEDICAL_HISTORY: 'medicalHistory',
  CONSULTATION_SESSIONS: 'consultationSessions',
  PAYMENTS: 'payments',
  STRIPE_EVENT_LOGS: 'stripeEventLogs'
};
