# HeyDoc - Developer Handoff Instructions

## What This Project Is

**HeyDoc** is an AI-powered health assistant app that helps users describe their symptoms and get natural remedy suggestions. Think of it as a medical intake assistant that asks questions before suggesting herbs, teas, or nutrition advice.

### Key Features:
- 🤖 **AI Chat**: GPT-4 powered conversational interface that asks medical intake questions
- 🚨 **Emergency Detection**: Automatically detects dangerous symptoms (chest pain, stroke, etc.) and tells users to call 911
- 👨‍⚕️ **Doctor Consultation**: UI for connecting with doctors (placeholder - payment not implemented)
- 📋 **Health Profile**: Collects comprehensive medical history, allergies, medications, lifestyle
- 💬 **Chat History**: Saves all previous conversations
- 🔐 **HIPAA/GDPR**: Encryption, consent forms, audit logging for healthcare compliance

## What's Inside the Archive

```
/heydoc
├── /web          # React web app (MAIN APP - fully functional)
├── /mobile       # React Native app (basic structure, needs work)
├── /functions    # Firebase Cloud Functions (AI integration)
├── /shared       # Shared TypeScript types and utilities
├── firebase.json # Firebase configuration
├── firestore.rules        # Database security rules
├── firestore.indexes.json # Database indexes
├── README.md              # Full documentation
└── PROJECT_SUMMARY.md     # Feature checklist
```

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Mobile**: React Native + Expo (not finished)
- **Backend**: Firebase (Firestore, Auth, Cloud Functions, Storage)
- **AI**: OpenAI API (GPT-4)
- **Security**: AES-GCM encryption, Firebase security rules

## Setup Instructions (10-15 minutes)

### 1. Prerequisites
Install these first:
```bash
# Node.js 18 or higher
node --version  # Check if installed

# Install Firebase CLI globally
npm install -g firebase-tools
```

You'll also need:
- **Firebase account** (free): https://console.firebase.google.com
- **OpenAI API key** ($10-20/month): https://platform.openai.com

### 2. Extract & Install Dependencies
```bash
# Extract the archive
tar -xzf heydoc-20251110.tar.gz
cd heydoc

# Install all dependencies (web + functions + mobile)
cd web && npm install
cd ../functions && npm install
cd ../mobile && npm install
cd ..
```

### 3. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name it (e.g., "heydoc-dev")
4. Enable Google Analytics (optional)
5. Once created, click the **⚙️ Settings** icon → **Project settings**
6. Scroll to "Your apps" → Click **</>** (web icon)
7. Register app, copy the config values

### 4. Set Up Environment Variables

**For Web App** (`/web/.env`):
```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**For Cloud Functions** (`/functions/.env`):
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

Get OpenAI key: https://platform.openai.com/api-keys

### 5. Initialize & Deploy Firebase
```bash
# Login to Firebase
firebase login

# Initialize (select your project)
firebase use --add
# Choose the project you created, give it an alias like "dev"

# Deploy everything
firebase deploy

# This will deploy:
# - Firestore database rules
# - Cloud Functions (AI chat, emergency detection)
# - Storage rules
```

### 6. Run the App Locally
```bash
# Start web app
cd web
npm run dev

# Opens at http://localhost:5173
```

## Testing the App

### Test Flow:
1. **Sign Up**: Create account with email/password
2. **Consent**: Accept privacy policies
3. **Health Intake**: Fill out 3-step medical form
4. **Chat**: Type "I have a headache"
   - AI should ask follow-up questions (severity, duration, etc.)
   - Then suggest natural remedies (teas, rest, etc.)
5. **Emergency Test**: Type "I have chest pain"
   - Red emergency banner should appear immediately
   - Chat should be disabled

### Check Chat History:
- Click "New Conversation" in sidebar
- Old conversations should be listed
- Click any to reopen it

### Check Profile:
- Click "Profile" in sidebar
- Should show all health info you entered
- Can edit and save changes

## File Structure Explained

### `/web/src/components/`
- `Auth/` - Sign up, sign in pages
- `Chat/` - Main chat interface, message bubbles, sidebar, emergency banner
- `Consent/` - HIPAA/GDPR consent forms
- `Intake/` - 3-step health profile form
- `Profile/` - View/edit health information

### `/functions/src/index.ts`
- `chat()` - Main AI function (calls OpenAI)
- `detectEmergency()` - Scans messages for dangerous symptoms
- System prompt for AI behavior (lines ~30-60)

### `/shared/`
- `types.ts` - TypeScript interfaces
- `encryption.ts` - AES-GCM encryption utilities
- `firebase.config.ts` - Firebase configuration

## What Works ✅

- ✅ User signup/login
- ✅ HIPAA/GDPR consent tracking
- ✅ Comprehensive health intake form
- ✅ AI chat with medical questions
- ✅ Natural remedy suggestions
- ✅ Emergency symptom detection
- ✅ Chat history sidebar
- ✅ Profile view/edit
- ✅ End-to-end encryption
- ✅ Firestore security rules
- ✅ Audit logging

## What Doesn't Work ⚠️

- ❌ **Doctor consultation payment** - UI exists but no Stripe integration
- ❌ **Voice/video calls** - Placeholder only
- ❌ **Mobile app** - Structure exists but components not ported from web
- ❌ **Auto-extract health log** - Conversations don't automatically update health profile

## Common Issues & Fixes

### "Firebase not initialized"
- Check `/web/.env` has correct Firebase config
- Restart dev server: `npm run dev`

### "OpenAI API error"
- Check `/functions/.env` has valid OpenAI API key
- Redeploy functions: `firebase deploy --only functions`

### Chat not responding
- Open browser console (F12)
- Check for errors
- Verify Cloud Functions deployed: `firebase functions:list`

### Emergency banner not appearing
- Check browser console for errors
- Keywords: "chest pain", "can't breathe", "severe bleeding", "stroke"

## Next Steps for Development

### Short-term (1-2 weeks):
1. **Add payment processing**: Integrate Stripe for $25 doctor consultations
2. **Improve mobile app**: Port web components to React Native
3. **Better error handling**: Add error boundaries, loading states
4. **Auto health log**: Extract symptoms from chat to update health profile

### Medium-term (1 month):
1. **Real doctor integration**: Connect to telemedicine API
2. **Voice/video calls**: Implement WebRTC or Twilio
3. **Symptom checker**: Visual body map for selecting symptoms
4. **Medication database**: Check drug interactions

### Long-term (3+ months):
1. **Lab results**: Upload and interpret test results
2. **Wearables**: Integrate Apple Health, Fitbit, etc.
3. **Analytics**: Health trends, symptom tracking over time
4. **Multi-language**: Spanish, French support

## Costs (Estimated)

### Development:
- Firebase: **Free** (Spark plan is enough for testing)
- OpenAI: **$10-20/month** (GPT-4 API usage)

### Production (1000 active users):
- Firebase: **$25-100/month** (Firestore + Functions)
- OpenAI: **$500-1000/month** (depends on chat volume)
- Domain/Hosting: **$10-20/month**
- **Total: ~$535-1120/month**

## Important Security Notes

### HIPAA Compliance:
- ✅ Data is encrypted (AES-GCM)
- ✅ Access controls in place (Firestore rules)
- ✅ Audit logs for profile changes
- ⚠️ **BUT**: Full HIPAA compliance requires Business Associate Agreement (BAA) with Google Cloud
  - Firebase doesn't offer BAA on free tier
  - Need Firebase Blaze plan + Google Cloud BAA

### Data Protection:
- User data isolated by Firebase Auth UID
- Firestore rules prevent unauthorized access
- Sensitive fields encrypted before storage
- No PHI in Cloud Function logs

## Useful Commands

```bash
# Install all dependencies
npm run install:all

# Run web app locally
npm run web

# Run mobile app
npm run mobile

# Deploy everything to Firebase
npm run deploy

# Deploy only functions
npm run deploy:functions

# Deploy only database rules
npm run deploy:firestore

# Build web app for production
npm run build:web

# View Firebase logs
firebase functions:log

# Test emergency detection
# (Type in chat): "I have chest pain"
```

## Documentation

- **README.md** - Full project overview with all features
- **PROJECT_SUMMARY.md** - Detailed feature checklist
- **SETUP.md** - Step-by-step setup guide
- **Inline comments** - Code is well-commented throughout

## Disclaimer

⚠️ **IMPORTANT**: This app is a **demonstration/prototype**. It is **NOT** intended to replace professional medical advice. Always tell users to consult real healthcare providers for medical decisions.

## Need Help?

Check these in order:
1. **Browser Console** (F12) - Look for JavaScript errors
2. **Firebase Console** - Check Functions logs, Firestore data
3. **README.md** - Detailed documentation
4. **PROJECT_SUMMARY.md** - Feature-by-feature breakdown
5. **Inline comments** - Code has extensive comments

## Contact

If you have questions about the codebase:
- Check the documentation files first
- Review Firebase Console for backend errors
- Test in incognito mode to rule out browser cache issues

---

**Package created**: November 10, 2025
**Status**: MVP complete, ready for testing and enhancement
**License**: MIT
