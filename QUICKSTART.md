# HeyDoc - Quick Start (5 Minutes)

## Prerequisites
- Node.js 18+ installed
- Firebase account (free)
- OpenAI account (pay-as-you-go)

## 1. Install Dependencies (2 min)

```bash
cd heydoc

# Install web dependencies
cd web && npm install

# Install functions dependencies
cd ../functions && npm install

cd ..
```

## 2. Firebase Setup (2 min)

### A. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add Project" → Name it "heydoc" → Create

### B. Enable Services
**Authentication:**
- Go to **Build** → **Authentication** → **Get Started**
- Click **Email/Password** → Enable → Save

**Firestore:**
- Go to **Build** → **Firestore Database** → **Create Database**
- Select **Production mode** → Choose **us-central1** → Enable

**Storage (Optional - for document uploads):**
- Go to **Build** → **Storage** → **Get Started**
- Use default security rules (custom rules will be deployed)
- Same location as Firestore
- ℹ️ **You can skip this for now** - it's only needed when users want to upload documents (lab results, prescriptions, etc.)

### C. Get Firebase Config
1. Project Settings (gear icon) → Scroll down
2. Click **Web** icon (</>)
3. Register app as "HeyDoc"
4. Copy the config values

### D. Create `/web/.env`
```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=heydoc-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=heydoc-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=heydoc-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxx
```

## 3. OpenAI Setup (1 min)

1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy it

### Create `/functions/.env`
```env
OPENAI_API_KEY=sk-...
```

## 4. Deploy Firebase (1 min)

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login
firebase login

# Initialize (select your project)
firebase use --add
# Select your heydoc project from the list

# Deploy
firebase deploy
```

## 5. Run the App! (30 sec)

```bash
cd web
npm run dev
```

Open http://localhost:5173

## 🎉 Test It Out

1. **Sign Up**: Create an account
2. **Consent**: Accept the privacy policies
3. **Intake**: Fill out the health form
4. **Chat**: Type "I have a headache"
   - Watch AI ask follow-up questions!
5. **Emergency**: Type "I have chest pain"
   - See the emergency banner!
6. **Doctor**: Click "Speak to a Doc!" button
   - View mock doctor profiles

## Troubleshooting

**"Permission denied"**
- Run: `firebase deploy --only firestore`

**"Function not found"**
- Run: `firebase deploy --only functions`
- Check `/functions/.env` has OpenAI key

**"Module not found"**
- Delete `node_modules` and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

**Can't connect to Firebase**
- Check `.env` file has correct values
- Verify project ID matches Firebase Console

## What You Just Built

✅ AI medical intake assistant
✅ Natural remedy recommendations
✅ Emergency symptom detection
✅ HIPAA/GDPR compliant storage
✅ Encrypted health data
✅ Chat history
✅ Doctor consultation UI
✅ Complete health profile system

## Next Steps

1. **Customize**: Update colors in `tailwind.config.js`
2. **Enhance AI**: Edit system prompt in `/functions/src/index.ts`
3. **Add Features**: Check `PROJECT_SUMMARY.md` for ideas
4. **Deploy**: Use Firebase Hosting or Vercel

## Support

- Full docs: `README.md`
- Detailed setup: `SETUP.md`
- Feature list: `PROJECT_SUMMARY.md`

---

**Enjoy your AI health assistant! 🏥✨**
