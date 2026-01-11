# HeyDoc - Quick Setup Guide

## Step-by-Step Setup

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project"
3. Enter project name: `heydoc`
4. Enable Google Analytics (optional)
5. Click "Create Project"

### 2. Enable Firebase Services

#### Authentication
1. In Firebase Console, go to **Authentication** → **Get Started**
2. Click on **Email/Password** → Enable → Save

#### Firestore Database
1. Go to **Firestore Database** → **Create Database**
2. Start in **Production mode** (we have custom rules)
3. Choose location (us-central1 recommended)

#### Storage
1. Go to **Storage** → **Get Started**
2. Start in **Production mode**
3. Same location as Firestore

### 3. Get Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click on **Web** icon (</>) to add a web app
4. Register app with name "HeyDoc Web"
5. Copy the `firebaseConfig` object
6. Create `/web/.env` file:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=heydoc-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=heydoc-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=heydoc-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxx
```

### 4. OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in
3. Go to **API Keys** → **Create new secret key**
4. Copy the key
5. Create `/functions/.env` file:

```env
OPENAI_API_KEY=sk-...
```

### 5. Install Dependencies

```bash
# Web app
cd web
npm install

# Mobile app
cd ../mobile
npm install

# Firebase Functions
cd ../functions
npm install
```

### 6. Deploy Firebase

```bash
# Login to Firebase
firebase login

# Select your project
firebase use heydoc-xxxxx

# Deploy everything
firebase deploy
```

### 7. Run the App

```bash
# Web app
cd web
npm run dev
```

Open http://localhost:5173

### 8. Test the Application

1. Click **Sign Up**
2. Enter email and password
3. Accept consent forms
4. Complete health intake form
5. Start chatting!

Try typing "I have a headache" and see the AI ask follow-up questions.

## Troubleshooting

### "Permission denied" errors
- Check Firestore rules are deployed: `firebase deploy --only firestore`
- Verify user is logged in

### "Function not found" errors
- Deploy functions: `firebase deploy --only functions`
- Check Functions logs in Firebase Console

### OpenAI API errors
- Verify API key in `/functions/.env`
- Check you have OpenAI API credits
- Redeploy functions after adding env vars

### Build errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Clear cache: `npm cache clean --force`

## Cost Estimates

### Firebase (Spark/Free Tier)
- ✅ Auth: 10K verifications/month free
- ✅ Firestore: 50K reads, 20K writes/day free
- ✅ Storage: 5GB free
- ✅ Functions: 2M invocations/month free

### OpenAI API (Pay as you go)
- GPT-4: ~$0.03 per request (varies by length)
- Estimated $10-50/month for moderate testing

### Total: $0-50/month during development

## Next Steps

1. **Customize branding**: Update colors in `tailwind.config.js`
2. **Add more remedies**: Enhance AI system prompt
3. **Implement payment**: Integrate Stripe for doctor consultations
4. **Deploy web app**: Use Firebase Hosting or Vercel
5. **Build mobile app**: `cd mobile && npx expo build`

## Support

- Firebase Docs: https://firebase.google.com/docs
- OpenAI Docs: https://platform.openai.com/docs
- React Docs: https://react.dev
- Expo Docs: https://docs.expo.dev
