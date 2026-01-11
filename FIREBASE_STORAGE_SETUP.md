# Firebase Storage - Quick Reference

## 📦 Current Status

✅ **Already Configured** (ready to enable anytime):
- `storage.rules` - Security rules deployed
- `web/src/services/documentService.ts` - Upload/download service
- `shared/types.ts` - Document type definitions
- `firebase.json` - Storage config included

🔧 **To Activate**:
1. Enable in Firebase Console (takes 30 seconds)
2. Deploy: `firebase deploy --only storage`

---

## When Do I Need Storage?

### ✅ Enable Storage When:
- Users need to upload **lab results** (PDF, images)
- Users want to save **prescriptions** (photos, PDFs)
- Users upload **medical records** (documents)
- You want **profile pictures**
- Doctors need to view **patient documents**

### ⏭️ Skip Storage For Now If:
- Only using **text chat** (Firestore only)
- No document uploads needed
- Want to **minimize costs** during development

---

## Cost Comparison

| Service | What It Does | Free Tier | Your Cost |
|---------|-------------|-----------|-----------|
| **Firestore** | Chat, profiles, messages | 50K reads/day | ✅ FREE |
| **Auth** | Login/signup | 10K users/month | ✅ FREE |
| **Functions** | AI chat (OpenAI) | 2M calls/month | ✅ FREE |
| **Storage** | Document uploads | 5GB, 1GB/day downloads | ✅ FREE (initially) |

### Storage Cost Examples:
- **100 users** × 50MB docs each = 5GB = **$0/month** (free tier)
- **500 users** × 50MB = 25GB = **~$0.50/month**
- **1000 users** × 100MB = 100GB = **~$2.60/month**

**Way cheaper than storing files elsewhere!**

---

## 30-Second Setup (When Ready)

### Step 1: Enable in Firebase Console
```
1. Firebase Console → Build → Storage
2. Click "Get Started"
3. Choose same location as Firestore (us-central1)
4. Click "Done"
```

### Step 2: Deploy Rules
```bash
firebase deploy --only storage
```

### Step 3: Test (Optional)
```bash
# Upload a test file via Firebase Console
# Or use the documentService in your app
```

---

## What's Included

### 📁 File Upload Service
Location: `/web/src/services/documentService.ts`

**Features:**
- ✅ Upload with progress tracking
- ✅ Download documents
- ✅ Delete documents
- ✅ File type validation
- ✅ Size limit enforcement
- ✅ Profile picture upload

**Supported File Types:**
- PDF (20MB max)
- JPG, PNG, HEIC (10MB max)
- DOC, DOCX (10MB max)

### 🔒 Security Rules
Location: `/storage.rules`

**Protection:**
- Users can ONLY access their own files
- File size limits enforced
- File type restrictions
- Authentication required

### 📂 Storage Structure
```
/users/{userId}/documents/
  ├── lab_results/
  ├── prescriptions/
  └── medical_records/

/users/{userId}/profile/
  └── avatar.jpg
```

---

## How to Use in Your App

### Quick Integration (3 steps):

**1. Import the service:**
```tsx
import { documentService } from '../services/documentService';
```

**2. Upload a file:**
```tsx
const handleUpload = async (file: File) => {
  const doc = await documentService.uploadDocument(
    userId,
    file,
    'lab_result',
    (progress) => console.log(`${progress}% uploaded`)
  );
  console.log('Uploaded:', doc.url);
};
```

**3. Get user's documents:**
```tsx
const docs = await documentService.getUserDocuments(userId);
```

**Full UI examples:** See `DOCUMENT_UPLOAD_GUIDE.md`

---

## Decision Guide

### Option A: Enable Now
**When:** You want document uploads from day 1

**Pros:**
- ✅ Full featured app
- ✅ Users can upload records immediately
- ✅ Still FREE for small usage

**Cons:**
- ❌ Slightly more complex setup
- ❌ Additional Firebase service to manage

### Option B: Enable Later (Recommended)
**When:** Focus on core chat features first

**Pros:**
- ✅ Simpler initial setup
- ✅ 100% FREE (Firestore + Functions only)
- ✅ Can enable anytime in 30 seconds

**Cons:**
- ❌ Users can't upload documents yet

---

## Commands

```bash
# Check if Storage is configured
firebase deploy --only storage --dry-run

# Deploy Storage rules
firebase deploy --only storage

# Deploy everything
firebase deploy

# Check Storage usage
firebase use  # Shows current project
# Then check in Firebase Console → Storage → Usage
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `storage.rules` | Security rules (who can access what) |
| `web/src/services/documentService.ts` | Upload/download logic |
| `shared/types.ts` | Document type definitions |
| `firebase.json` | Storage config |
| `DOCUMENT_UPLOAD_GUIDE.md` | Full implementation guide |

---

## Bottom Line

🎯 **Recommendation:**

1. **Start without Storage** (saves setup time)
   - Just use: Authentication + Firestore + Functions
   - Deploy: `firebase deploy --only firestore,functions`
   - Cost: $0

2. **Enable Storage when needed** (takes 30 seconds)
   - Follow: Firebase Console → Storage → Get Started
   - Deploy: `firebase deploy --only storage`
   - Still cost: ~$0 (free tier covers most usage)

**Everything is already set up - just flip the switch when ready!** 🚀

---

## Quick Start Command

```bash
# WITHOUT Storage (simpler, recommended for testing)
firebase deploy --only firestore,functions

# WITH Storage (when you need document uploads)
firebase deploy --only firestore,functions,storage
```

Choose based on your immediate needs!
