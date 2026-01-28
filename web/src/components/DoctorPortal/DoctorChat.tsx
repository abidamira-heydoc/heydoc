import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLLECTIONS } from '@shared/firebase.config';
import type { ConsultationCase, ConsultationMessage, HealthProfile } from '@shared/types';

const DoctorChat: React.FC = () => {
  const { t } = useTranslation('doctor');
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [caseData, setCaseData] = useState<ConsultationCase | null>(null);
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showPatientInfo, setShowPatientInfo] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate time elapsed
  const getTimeElapsed = useCallback(() => {
    if (!caseData?.startedAt) return '0:00';
    const start = caseData.startedAt instanceof Date ? caseData.startedAt : new Date(caseData.startedAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [caseData?.startedAt]);

  const [timeElapsed, setTimeElapsed] = useState('0:00');

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(getTimeElapsed());
    }, 1000);
    return () => clearInterval(interval);
  }, [getTimeElapsed]);

  // Fetch case data
  useEffect(() => {
    if (!caseId) return;

    const fetchCase = async () => {
      try {
        const caseDoc = await getDoc(doc(db, COLLECTIONS.CONSULTATION_CASES, caseId));
        if (!caseDoc.exists()) {
          navigate('/doctor/cases');
          return;
        }

        const data = caseDoc.data();
        setCaseData({
          ...data,
          id: caseDoc.id,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          startedAt: data.startedAt?.toDate?.() || new Date(),
          assignedAt: data.assignedAt?.toDate?.() || undefined,
        } as ConsultationCase);

        // Fetch patient health profile
        if (data.userId) {
          const profileDoc = await getDoc(doc(db, COLLECTIONS.HEALTH_PROFILES, data.userId));
          if (profileDoc.exists()) {
            setHealthProfile(profileDoc.data() as HealthProfile);
          }
        }
      } catch (err) {
        console.error('Error fetching case:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [caseId, navigate]);

  // Real-time messages listener
  useEffect(() => {
    if (!caseId) return;

    const messagesQuery = query(
      collection(db, COLLECTIONS.CONSULTATION_MESSAGES),
      where('caseId', '==', caseId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
      })) as ConsultationMessage[];
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [caseId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !caseId) return;

    setSending(true);
    try {
      await addDoc(collection(db, COLLECTIONS.CONSULTATION_MESSAGES), {
        caseId,
        senderId: user.uid,
        senderRole: 'doctor',
        content: newMessage.trim(),
        timestamp: new Date(),
        read: false,
      });
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !caseId) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert(t('chat.imageUpload.selectImage'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert(t('chat.imageUpload.sizeLimit'));
      return;
    }

    setUploadingImage(true);
    try {
      const fileName = `consultation-images/${caseId}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          null,
          reject,
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            await addDoc(collection(db, COLLECTIONS.CONSULTATION_MESSAGES), {
              caseId,
              senderId: user.uid,
              senderRole: 'doctor',
              content: '',
              imageUrl: downloadUrl,
              timestamp: new Date(),
              read: false,
            });
            resolve();
          }
        );
      });
    } catch (err) {
      console.error('Error uploading image:', err);
      alert(t('chat.imageUpload.uploadFailed'));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">{t('chat.loadingConsultation')}</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{t('chat.caseNotFound')}</p>
          <button
            onClick={() => navigate('/doctor/cases')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            {t('chat.backToQueue')}
          </button>
        </div>
      </div>
    );
  }

  const isPriority = caseData.tier === 'priority';

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Top Bar */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        isPriority ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/doctor/active')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-5 h-5 text-gray-600 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">{caseData.patientName}</h2>
              {isPriority && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                  {t('chat.priority')}
                </span>
              )}
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {t('chat.active')}
              </span>
            </div>
            <p className="text-sm text-gray-500">{caseData.chiefComplaint}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-mono text-sm text-gray-700">{timeElapsed}</span>
          </div>

          {/* Toggle Patient Info */}
          <button
            onClick={() => setShowPatientInfo(!showPatientInfo)}
            className={`p-2 rounded-lg transition ${showPatientInfo ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
            title={t('chat.togglePatientInfo')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Complete Button */}
          <button
            onClick={() => setShowCompleteModal(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t('chat.markComplete')}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Patient Info Sidebar */}
        {showPatientInfo && (
          <div className="w-80 border-e border-gray-200 bg-gray-50 overflow-y-auto">
            <PatientInfoSidebar
              caseData={caseData}
              healthProfile={healthProfile}
              t={t}
            />
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>{t('chat.startConversation', { name: caseData.patientName })}</p>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} isDoctor={msg.senderRole === 'doctor'} t={t} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex items-end gap-3">
              {/* Image Upload */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
              >
                {uploadingImage ? (
                  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </button>

              {/* Message Input */}
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder={t('chat.placeholder')}
                  rows={1}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </form>

            {/* Placeholder buttons for future features */}
            <div className="flex items-center gap-2 mt-3">
              <button
                disabled
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {t('chat.videoCallComingSoon')}
              </button>
              <button
                disabled
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {t('chat.voiceCallComingSoon')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Consultation Modal */}
      {showCompleteModal && (
        <CompleteModal
          caseData={caseData}
          onClose={() => setShowCompleteModal(false)}
          onComplete={() => navigate('/doctor/active')}
          t={t}
        />
      )}
    </div>
  );
};

// Message Bubble Component
interface MessageBubbleProps {
  message: ConsultationMessage;
  isDoctor: boolean;
  t: (key: string) => string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isDoctor, t }) => {
  const [showLightbox, setShowLightbox] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className={`flex ${isDoctor ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[70%] ${isDoctor ? 'order-2' : 'order-1'}`}>
          {message.imageUrl && (
            <div
              className={`mb-1 cursor-pointer ${isDoctor ? 'ms-auto' : 'me-auto'}`}
              onClick={() => setShowLightbox(true)}
            >
              <img
                src={message.imageUrl}
                alt={t('chat.sharedImage')}
                className="max-w-full rounded-xl max-h-64 object-cover"
              />
            </div>
          )}
          {message.content && (
            <div className={`px-4 py-2.5 rounded-2xl ${
              isDoctor
                ? 'bg-blue-600 text-white rounded-ee-sm'
                : 'bg-gray-100 text-gray-900 rounded-es-sm'
            }`}>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          )}
          <p className={`text-xs text-gray-400 mt-1 ${isDoctor ? 'text-end' : 'text-start'}`}>
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && message.imageUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 end-4 text-white p-2 hover:bg-white/20 rounded-lg"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={message.imageUrl}
            alt={t('chat.fullSize')}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

// Patient Info Sidebar
interface PatientInfoSidebarProps {
  caseData: ConsultationCase;
  healthProfile: HealthProfile | null;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const PatientInfoSidebar: React.FC<PatientInfoSidebarProps> = ({ caseData, healthProfile, t }) => {
  return (
    <div className="p-4 space-y-4">
      {/* Patient Card */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl font-semibold text-blue-600">
            {caseData.patientName?.[0]?.toUpperCase() || 'P'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{caseData.patientName}</h3>
            <p className="text-sm text-gray-500">
              {caseData.patientAge} {t('chat.patientCard.yearsOld')}, {caseData.patientSex}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">{t('chat.patientCard.chiefComplaint')}</p>
            <p className="text-gray-900">{caseData.chiefComplaint}</p>
          </div>

          {caseData.symptoms && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">{t('chat.patientCard.symptoms')}</p>
              <p className="text-gray-900 text-sm">{caseData.symptoms}</p>
            </div>
          )}
        </div>
      </div>

      {/* Attached Images */}
      {caseData.imageUrls && caseData.imageUrls.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">{t('chat.attachedImages')}</h4>
          <div className="grid grid-cols-2 gap-2">
            {caseData.imageUrls.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`${t('common.image')} ${idx + 1}`}
                className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
              />
            ))}
          </div>
        </div>
      )}

      {/* Health Profile */}
      {healthProfile && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">{t('chat.healthProfile')}</h4>
          <div className="space-y-3 text-sm">
            {healthProfile.allergies && healthProfile.allergies.length > 0 && (
              <div>
                <p className="text-xs text-red-600 font-medium">{t('chat.allergies')}</p>
                <p className="text-gray-900">{healthProfile.allergies.join(', ')}</p>
              </div>
            )}

            {healthProfile.currentConditions && healthProfile.currentConditions.length > 0 && (
              <div>
                <p className="text-xs text-gray-500">{t('chat.currentConditions')}</p>
                <p className="text-gray-900">{healthProfile.currentConditions.join(', ')}</p>
              </div>
            )}

            {healthProfile.currentMedications && healthProfile.currentMedications.length > 0 && (
              <div>
                <p className="text-xs text-gray-500">{t('chat.medications')}</p>
                <p className="text-gray-900">
                  {healthProfile.currentMedications.map((m: { name: string }) => m.name).join(', ')}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <div>
                <p className="text-xs text-gray-500">{t('chat.height')}</p>
                <p className="text-gray-900">{healthProfile.height} cm</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('chat.weight')}</p>
                <p className="text-gray-900">{healthProfile.weight} kg</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout Info */}
      <div className={`rounded-xl p-4 ${caseData.tier === 'priority' ? 'bg-amber-50' : 'bg-green-50'}`}>
        <p className="text-xs font-medium text-gray-500 uppercase mb-1">{t('chat.yourPayout')}</p>
        <p className={`text-2xl font-bold ${caseData.tier === 'priority' ? 'text-amber-600' : 'text-green-600'}`}>
          ${(caseData.doctorPayout / 100).toFixed(2)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {caseData.tier === 'priority' ? t('chat.priorityRequest') : t('chat.standardConsultation')}
        </p>
      </div>
    </div>
  );
};

// Complete Modal
interface CompleteModalProps {
  caseData: ConsultationCase;
  onClose: () => void;
  onComplete: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const CompleteModal: React.FC<CompleteModalProps> = ({ caseData, onClose, onComplete, t }) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.CONSULTATION_CASES, caseData.id), {
        status: 'completed',
        completedAt: new Date(),
        doctorNotes: notes || null,
      });
      onComplete();
    } catch (err) {
      console.error('Error completing case:', err);
      alert(t('chat.completeFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-green-600 text-white px-6 py-4">
          <h2 className="text-xl font-semibold">{t('chat.completeModal.title')}</h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{t('chat.completeModal.consultationWith', { name: caseData.patientName })}</p>
                <p className="text-sm text-gray-600">{caseData.chiefComplaint}</p>
              </div>
              <div className="text-end">
                <p className="text-2xl font-bold text-green-600">
                  ${(caseData.doctorPayout / 100).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">{t('chat.completeModal.yourEarnings')}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('chat.completeModal.finalNotes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('chat.completeModal.notesPlaceholder')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p className="font-medium text-gray-900 mb-1">{t('chat.completeModal.whatHappensNext')}</p>
            <ul className="space-y-1">
              <li>- {t('chat.completeModal.ratingPrompt')}</li>
              <li>- {t('chat.completeModal.earningsAdded')}</li>
              <li>- {t('chat.completeModal.payoutProcessed')}</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
            >
              {t('chat.completeModal.cancel')}
            </button>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {t('chat.completeModal.completeAndEarn', { amount: `$${(caseData.doctorPayout / 100).toFixed(2)}` })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorChat;
