# HeyDoc - AI-Powered Health Assistant

A mobile health application that combines AI-driven medical intake with natural remedy guidance, built with React (web), React Native (mobile), Firebase backend, and OpenAI integration.

## Features

### 🤖 AI Chat Interface
- ChatGPT-style conversational interface
- Acts as a medical intake assistant
- Asks thorough patient questions (onset, severity, triggers, history, etc.)
- Provides natural remedy guidance (teas, herbs, nutrition) with specific instructions
- Auto-updates health log after each conversation

### 📋 Comprehensive Health Profile
- Required intake form on signup:
  - Age, sex, height, weight
  - Medical history, current conditions
  - Allergies, current medications
  - Family history
  - Lifestyle factors (smoking, alcohol, exercise)
- View and edit profile anytime

### 🚨 Emergency Detection System
- Real-time scanning for red flag symptoms
- Keywords: chest pain, shortness of breath, severe bleeding, loss of consciousness, stroke symptoms, etc.
- Immediate emergency banner display
- Stops self-care suggestions and advises calling emergency services

### 👨‍⚕️ Doctor Consultation Feature
- "Speak to a Doc!" button at end of each chat
- Informational popup about $25 consultation (UI placeholder)
- Mock doctor profiles with credentials
- Toggle views for text chat vs voice call (non-functional)

### 💬 Chat History
- Sidebar showing all previous conversations
- Click to reopen past chats
- Conversation titles auto-generated from first message

### 🔐 Security & Compliance
- End-to-end encryption for sensitive health data
- HIPAA/GDPR-compliant data storage
- Explicit user consent flow
- Firestore security rules
- Audit logging for data access

### 🎨 Calming UI Design
- K-Health inspired interface
- Soothing color palette (blues, greens)
- Clean, professional design
- Responsive across devices

## Tech Stack

### Frontend
- **Web**: React 18 with TypeScript, Vite
- **Mobile**: React Native with Expo
- **Styling**: Tailwind CSS (web), React Native StyleSheet (mobile)
- **Routing**: React Router (web), React Navigation (mobile)

### Backend
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Cloud Functions**: Firebase Cloud Functions (Node.js)
- **AI**: OpenAI API (GPT-4)

### Security
- Client-side encryption using Web Crypto API
- Firebase Security Rules
- Encrypted storage for mobile (react-native-encrypted-storage)

## Project Structure

```
/heydoc
├── /web                    # React web application
│   ├── /src
│   │   ├── /components
│   │   │   ├── /Auth       # SignUp, SignIn
│   │   │   ├── /Chat       # Chat interface, messages, sidebar
│   │   │   ├── /Consent    # HIPAA/GDPR consent forms
│   │   │   ├── /Intake     # Health profile intake form
│   │   │   └── /Profile    # Profile view/edit
│   │   ├── /contexts       # AuthContext
│   │   ├── /services       # chatService, encryption
│   │   └── /config         # Firebase config
│   └── package.json
├── /mobile                 # React Native mobile app
│   ├── /App.tsx
│   └── package.json
├── /functions              # Firebase Cloud Functions
│   ├── /src
│   │   └── index.ts        # OpenAI integration, emergency detection
│   └── package.json
├── /shared                 # Shared types and configs
│   ├── types.ts            # TypeScript interfaces
│   ├── firebase.config.ts  # Firebase configuration
│   └── encryption.ts       # Encryption utilities
├── firebase.json           # Firebase configuration
├── firestore.rules         # Firestore security rules
└── firestore.indexes.json  # Firestore indexes
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project (create at https://console.firebase.google.com)
- OpenAI API key (get from https://platform.openai.com)

### 1. Clone and Install

```bash
cd heydoc

# Install web dependencies
cd web
npm install

# Install mobile dependencies
cd ../mobile
npm install

# Install Firebase Functions dependencies
cd ../functions
npm install
```

### 2. Firebase Setup

```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Select:
# - Firestore
# - Functions
# - Storage
```

### 3. Environment Variables

Create `.env` file in `/web`:

```env
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Create `.env` file in `/functions`:

```env
OPENAI_API_KEY=your-openai-api-key
```

### 4. Deploy Firebase

```bash
# Deploy Firestore rules and indexes
firebase deploy --only firestore

# Deploy Cloud Functions
firebase deploy --only functions

# Deploy Storage rules
firebase deploy --only storage
```

### 5. Run the Applications

**Web App:**
```bash
cd web
npm run dev
# Open http://localhost:5173
```

**Mobile App:**
```bash
cd mobile
npx expo start
# Scan QR code with Expo Go app
```

## Usage Flow

1. **Sign Up** → Create account with email/password
2. **Consent** → Accept HIPAA/GDPR privacy policies
3. **Health Intake** → Complete comprehensive health profile (3 steps)
4. **Chat** → Start describing symptoms
   - AI asks thorough intake questions
   - Provides natural remedy guidance
   - Emergency detection if critical symptoms mentioned
5. **Doctor Consult** → Click "Speak to a Doc!" (UI placeholder)
6. **Profile** → View/edit health information anytime

## Key Components

### Medical Intake System Prompt
Located in `/functions/src/index.ts`, the AI is prompted to:
- Ask comprehensive intake questions conversationally
- Gather symptom onset, severity (1-10), triggers, history
- Provide natural remedy recommendations with exact instructions
- Be warm, empathetic, and thorough

### Emergency Detection
- Client-side quick check (instant feedback)
- Server-side comprehensive check via Cloud Function
- Keywords include: chest pain, shortness of breath, stroke symptoms, severe bleeding, etc.
- Displays emergency banner and stops all self-care suggestions

### Encryption
- Health data encrypted before storage in Firestore
- Uses AES-GCM encryption
- Encryption keys managed securely
- Located in `/shared/encryption.ts`

## Security Considerations

### HIPAA Compliance
- ✅ End-to-end encryption
- ✅ Access controls via Firestore rules
- ✅ Audit logging
- ✅ User consent tracking
- ⚠️ **Note**: Full HIPAA compliance requires Business Associate Agreements with Firebase/Google Cloud

### Data Protection
- User data isolated by Firebase Auth UID
- Firestore rules prevent unauthorized access
- Encrypted storage for sensitive fields
- Automatic audit trail for health profile changes

## Known Limitations & Future Enhancements

### Current Limitations
- Doctor consultation is UI-only (no payment processing)
- Voice call feature is non-functional placeholder
- Auto-update health log from conversations not fully implemented
- Mobile app basic structure created but components need porting from web

### Planned Features
- Payment integration (Stripe) for doctor consultations
- Real doctor availability and scheduling system
- Voice/video call functionality
- More sophisticated natural remedy database
- Symptom checker with visual body map
- Health trend tracking and analytics
- Integration with wearables
- Multi-language support

## Testing

### Test Emergency Detection
Type any of these phrases in chat:
- "I have chest pain"
- "I can't breathe"
- "severe bleeding"
- "I think I'm having a stroke"

The emergency banner should appear immediately.

### Test Chat Flow
1. Sign up and complete intake form
2. Start new conversation
3. Describe a symptom (e.g., "I have a headache")
4. AI should ask follow-up questions before giving advice
5. Try the "Speak to a Doc!" button

## Contributing

This is a demonstration project showcasing:
- Full-stack health app architecture
- AI integration for medical intake
- HIPAA/GDPR compliance patterns
- Emergency detection systems
- React + Firebase + OpenAI integration

## Disclaimer

⚠️ **IMPORTANT**: This application is for demonstration purposes only and is NOT intended to replace professional medical advice, diagnosis, or treatment. Always seek the advice of qualified health providers with any questions regarding a medical condition. Never disregard professional medical advice or delay seeking it because of something you have read in this app.

## License

MIT License - See LICENSE file for details

## Support

For questions or issues:
- Open an issue on GitHub
- Check Firebase Console for backend errors
- Review browser console for frontend errors
