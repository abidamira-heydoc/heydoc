import { ref, uploadBytesResumable, getDownloadURL, deleteObject, listAll, getMetadata } from 'firebase/storage';
import { storage } from '../config/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from '../../../shared/firebase.config';

export interface UploadedDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  category?: 'lab_result' | 'prescription' | 'medical_record' | 'insurance' | 'other';
}

export interface ChatImageUpload {
  url: string;
  metadata: {
    originalName: string;
    size: number;
    type: string;
    uploadedAt: Date;
  };
}

// Allowed image types for chat uploads
const CHAT_IMAGE_TYPES: Record<string, { ext: string; maxSize: number }> = {
  'image/jpeg': { ext: '.jpg', maxSize: 10 * 1024 * 1024 },
  'image/png': { ext: '.png', maxSize: 10 * 1024 * 1024 },
  'image/heic': { ext: '.heic', maxSize: 10 * 1024 * 1024 },
  'image/webp': { ext: '.webp', maxSize: 10 * 1024 * 1024 },
};

export const documentService = {
  /**
   * Upload a document to Firebase Storage
   * @param userId - User's ID
   * @param file - File to upload
   * @param category - Document category
   * @param onProgress - Progress callback (0-100)
   */
  async uploadDocument(
    userId: string,
    file: File,
    category: UploadedDocument['category'] = 'other',
    onProgress?: (progress: number) => void
  ): Promise<UploadedDocument> {
    // Create storage reference
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `users/${userId}/documents/${fileName}`);

    // Upload file
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(Math.round(progress));
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          // Get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          const uploadedDoc: UploadedDocument = {
            id: fileName,
            name: file.name,
            url: downloadURL,
            type: file.type,
            size: file.size,
            uploadedAt: new Date(),
            category,
          };

          // Save document metadata to Firestore
          await updateDoc(doc(db, COLLECTIONS.HEALTH_PROFILES, userId), {
            documents: arrayUnion(uploadedDoc),
          });

          resolve(uploadedDoc);
        }
      );
    });
  },

  /**
   * Delete a document from Storage
   */
  async deleteDocument(userId: string, documentId: string): Promise<void> {
    const storageRef = ref(storage, `users/${userId}/documents/${documentId}`);
    await deleteObject(storageRef);

    // Also remove from Firestore metadata
    // (You'd need to implement array remove logic here)
  },

  /**
   * Get all documents for a user
   */
  async getUserDocuments(userId: string): Promise<UploadedDocument[]> {
    const listRef = ref(storage, `users/${userId}/documents`);
    const list = await listAll(listRef);

    const documents = await Promise.all(
      list.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);

        return {
          id: itemRef.name,
          name: metadata.name,
          url,
          type: metadata.contentType || 'unknown',
          size: metadata.size,
          uploadedAt: new Date(metadata.timeCreated),
        } as UploadedDocument;
      })
    );

    return documents;
  },

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(
    userId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image must be less than 5MB');
    }

    const storageRef = ref(storage, `users/${userId}/profile/avatar.jpg`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(Math.round(progress));
        },
        reject,
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Update user profile with avatar URL
          await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
            avatarUrl: downloadURL,
          });

          resolve(downloadURL);
        }
      );
    });
  },

  /**
   * Allowed file types for medical documents
   */
  ALLOWED_TYPES: {
    'application/pdf': { ext: '.pdf', maxSize: 20 * 1024 * 1024 }, // 20MB
    'image/jpeg': { ext: '.jpg', maxSize: 10 * 1024 * 1024 }, // 10MB
    'image/png': { ext: '.png', maxSize: 10 * 1024 * 1024 }, // 10MB
    'image/heic': { ext: '.heic', maxSize: 10 * 1024 * 1024 }, // 10MB (iPhone photos)
    'application/msword': { ext: '.doc', maxSize: 10 * 1024 * 1024 }, // 10MB
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      ext: '.docx',
      maxSize: 10 * 1024 * 1024,
    }, // 10MB
  },

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const allowedType = this.ALLOWED_TYPES[file.type as keyof typeof this.ALLOWED_TYPES];

    if (!allowedType) {
      return {
        valid: false,
        error: 'File type not allowed. Please upload PDF, JPG, PNG, HEIC, DOC, or DOCX files.',
      };
    }

    if (file.size > allowedType.maxSize) {
      const maxSizeMB = allowedType.maxSize / (1024 * 1024);
      return {
        valid: false,
        error: `File size must be less than ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  },

  /**
   * Validate chat image before upload
   */
  validateChatImage(file: File): { valid: boolean; error?: string } {
    const allowedType = CHAT_IMAGE_TYPES[file.type];

    if (!allowedType) {
      return {
        valid: false,
        error: 'Only JPG, PNG, HEIC, and WebP images are allowed.',
      };
    }

    if (file.size > allowedType.maxSize) {
      const maxSizeMB = allowedType.maxSize / (1024 * 1024);
      return {
        valid: false,
        error: `Image must be less than ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  },

  /**
   * Upload a chat image to Firebase Storage
   * @param userId - User's ID
   * @param conversationId - Conversation ID
   * @param file - Image file to upload
   * @param onProgress - Progress callback (0-100)
   */
  async uploadChatImage(
    userId: string,
    conversationId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ChatImageUpload> {
    // Validate file
    const validation = this.validateChatImage(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Create storage reference: /chat-images/{userId}/{conversationId}/{timestamp}_{filename}
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    const storageRef = ref(storage, `chat-images/${userId}/${conversationId}/${fileName}`);

    // Upload file
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(Math.round(progress));
        },
        (error) => {
          console.error('Chat image upload error:', error);
          reject(error);
        },
        async () => {
          // Get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          const result: ChatImageUpload = {
            url: downloadURL,
            metadata: {
              originalName: file.name,
              size: file.size,
              type: file.type,
              uploadedAt: new Date(),
            },
          };

          resolve(result);
        }
      );
    });
  },
};
