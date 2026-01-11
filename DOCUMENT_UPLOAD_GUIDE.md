# Document Upload Feature Guide

## Overview

Firebase Storage is **configured but optional**. You can enable it when ready to allow users to upload:
- 📄 Lab results
- 💊 Prescription documents
- 🏥 Medical records
- 🩺 Insurance cards
- 📋 Any health-related documents

## Current Status

✅ **Already Set Up:**
- Storage rules (`storage.rules`)
- Document service (`web/src/services/documentService.ts`)
- Type definitions (`shared/types.ts`)
- Firebase config updated

⏸️ **To Enable:**
1. Enable Storage in Firebase Console
2. Deploy: `firebase deploy --only storage`
3. Add upload UI to your app (examples below)

---

## How to Enable Storage

### Step 1: Firebase Console
1. Go to **Build** → **Storage** → **Get Started**
2. Use default security rules (we'll override with custom ones)
3. Choose same location as Firestore

### Step 2: Deploy Rules
```bash
firebase deploy --only storage
```

### Step 3: Test (Optional)
Upload a test file in Firebase Console to verify it works

---

## Adding Document Upload UI

### Example 1: Simple Document Upload Component

Create `/web/src/components/Documents/DocumentUpload.tsx`:

```tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { documentService } from '../../services/documentService';

const DocumentUpload: React.FC = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<'lab_result' | 'prescription' | 'medical_record' | 'insurance' | 'other'>('other');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = documentService.validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    try {
      setUploading(true);
      const uploadedDoc = await documentService.uploadDocument(
        user.uid,
        selectedFile,
        category,
        setProgress
      );

      alert(`Document uploaded successfully: ${uploadedDoc.name}`);
      setSelectedFile(null);
      setProgress(0);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Upload Document</h3>

      <div className="space-y-4">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Type
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="lab_result">Lab Result</option>
            <option value="prescription">Prescription</option>
            <option value="medical_record">Medical Record</option>
            <option value="insurance">Insurance Card</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* File Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File
          </label>
          <input
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png,.heic,.doc,.docx"
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Accepted: PDF, JPG, PNG, HEIC, DOC, DOCX (max 20MB)
          </p>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-1">{progress}% uploaded</p>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </div>
    </div>
  );
};

export default DocumentUpload;
```

### Example 2: Document List Component

Create `/web/src/components/Documents/DocumentList.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { documentService, UploadedDocument } from '../../services/documentService';

const DocumentList: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocuments = async () => {
      if (!user) return;

      try {
        const docs = await documentService.getUserDocuments(user.uid);
        setDocuments(docs);
      } catch (error) {
        console.error('Error loading documents:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [user]);

  const handleDelete = async (documentId: string) => {
    if (!user || !confirm('Delete this document?')) return;

    try {
      await documentService.deleteDocument(user.uid, documentId);
      setDocuments(docs => docs.filter(d => d.id !== documentId));
    } catch (error) {
      alert('Failed to delete document');
    }
  };

  if (loading) return <div>Loading documents...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">My Documents</h3>

      {documents.length === 0 ? (
        <p className="text-gray-500">No documents uploaded yet</p>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center flex-1">
                <div className="w-10 h-10 bg-primary-100 rounded flex items-center justify-center mr-3">
                  📄
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{doc.name}</p>
                  <p className="text-xs text-gray-500">
                    {(doc.size / 1024).toFixed(0)} KB • {doc.uploadedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 text-sm"
                >
                  View
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;
```

### Example 3: Add to Profile Page

Update `/web/src/components/Profile/ProfileView.tsx`:

```tsx
import DocumentUpload from '../Documents/DocumentUpload';
import DocumentList from '../Documents/DocumentList';

// In the JSX, add a new section:
<div className="mt-8">
  <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical Documents</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <DocumentUpload />
    <DocumentList />
  </div>
</div>
```

---

## Storage Structure

```
/users/{userId}/
  ├── documents/
  │   ├── {timestamp}_lab_result.pdf
  │   ├── {timestamp}_prescription.jpg
  │   └── {timestamp}_insurance_card.png
  └── profile/
      └── avatar.jpg
```

---

## Security Rules Explained

The deployed `storage.rules` provide:

✅ **User Isolation**: Users can only access their own files
✅ **File Size Limits**:
   - Documents: 20MB max
   - Profile pics: 5MB max
✅ **Type Restrictions**: Only allowed file types (PDF, images, docs)
✅ **Authentication**: All access requires login

---

## File Type Support

| Type | Extension | Max Size | Use Case |
|------|-----------|----------|----------|
| PDF | `.pdf` | 20MB | Lab results, prescriptions |
| JPEG | `.jpg` | 10MB | Photo of documents |
| PNG | `.png` | 10MB | Screenshots |
| HEIC | `.heic` | 10MB | iPhone photos |
| Word | `.doc`, `.docx` | 10MB | Medical records |

---

## Cost Estimation

### Firebase Storage Pricing (Pay as you go)

**Free Tier:**
- ✅ 5GB storage
- ✅ 1GB/day downloads
- ✅ 20K uploads/day

**Paid (if you exceed free tier):**
- $0.026/GB/month storage
- $0.12/GB downloads

**Example:**
- 100 users × 50MB avg documents = 5GB = **FREE**
- 500 users × 50MB = 25GB = ~$0.52/month

**Much cheaper than alternatives!**

---

## When to Enable

Enable Storage when:
1. ✅ Users need to upload lab results
2. ✅ Doctors need to see patient documents
3. ✅ You want profile pictures
4. ✅ Users upload prescription images

You can skip it if:
- ❌ Only using text-based chat
- ❌ Not storing documents
- ❌ Want to minimize costs initially

---

## Testing Checklist

After enabling:

1. ✅ Deploy rules: `firebase deploy --only storage`
2. ✅ Upload test file via UI
3. ✅ Check Firebase Console → Storage for uploaded file
4. ✅ Try downloading the file
5. ✅ Try deleting the file
6. ✅ Verify only owner can access their files

---

## Troubleshooting

**"Permission denied" on upload:**
- Deploy storage rules: `firebase deploy --only storage`
- Verify user is logged in

**"File too large":**
- Check file size limits in `storage.rules`
- Update max size if needed

**"Invalid file type":**
- Check `documentService.ALLOWED_TYPES`
- Add new types if needed

---

## Future Enhancements

Potential features to add:

1. 📸 **Camera capture** (React Native)
2. 🔍 **OCR text extraction** from documents
3. 🗂️ **Folder organization** by category
4. 🔒 **Extra encryption** for sensitive docs
5. 🔗 **Share with doctors** (temporary access links)
6. ☁️ **Cloud backup** to user's Google Drive
7. 📊 **Document analytics** (what types uploaded most)

---

**Storage is ready to use whenever you need it! 🚀**
