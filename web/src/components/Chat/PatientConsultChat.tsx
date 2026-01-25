import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLLECTIONS } from '@shared/firebase.config';
import type { ConsultationCase, ConsultationMessage, DoctorProfile } from '@shared/types';
import { SPECIALTY_LABELS } from '@shared/types';
import type { DoctorSpecialty } from '@shared/types';

const PatientConsultChat: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [caseData, setCaseData] = useState<ConsultationCase | null>(null);
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch case data and listen for updates
  useEffect(() => {
    if (!caseId) return;

    // Real-time listener for case updates
    const unsubscribeCase = onSnapshot(
      doc(db, COLLECTIONS.CONSULTATION_CASES, caseId),
      async (snapshot) => {
        if (!snapshot.exists()) {
          navigate('/chat');
          return;
        }

        const data = snapshot.data();
        const caseInfo = {
          ...data,
          id: snapshot.id,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          startedAt: data.startedAt?.toDate?.() || undefined,
          completedAt: data.completedAt?.toDate?.() || undefined,
        } as ConsultationCase;

        setCaseData(caseInfo);

        // Show rating modal when completed
        if (data.status === 'completed' && !data.patientRating) {
          setShowRatingModal(true);
        }

        // Fetch doctor info
        if (data.assignedDoctorId) {
          const doctorDoc = await getDoc(doc(db, COLLECTIONS.DOCTORS, data.assignedDoctorId));
          if (doctorDoc.exists()) {
            setDoctor({
              ...doctorDoc.data(),
              id: doctorDoc.id,
            } as DoctorProfile);
          }
        }

        setLoading(false);
      }
    );

    return () => unsubscribeCase();
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
        senderRole: 'patient',
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

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
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
              senderRole: 'patient',
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
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading consultation...</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Consultation not found</p>
          <button
            onClick={() => navigate('/chat')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = caseData.status === 'completed';
  const isWaiting = caseData.status === 'pending';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/chat')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {doctor ? (
              <div className="flex items-center gap-3">
                {doctor.photoUrl ? (
                  <img src={doctor.photoUrl} alt={doctor.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                    {doctor.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-gray-900">Dr. {doctor.name}</h2>
                  <p className="text-xs text-gray-500">
                    {doctor.specialties?.slice(0, 2).map((s: DoctorSpecialty) => SPECIALTY_LABELS[s] || s).join(', ')}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="font-semibold text-gray-900">Doctor Consultation</h2>
                <p className="text-xs text-gray-500">Waiting for doctor...</p>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isCompleted
              ? 'bg-gray-100 text-gray-600'
              : isWaiting
                ? 'bg-amber-100 text-amber-700'
                : 'bg-green-100 text-green-700'
          }`}>
            {isCompleted ? 'Completed' : isWaiting ? 'Waiting...' : 'In Progress'}
          </div>
        </div>
      </header>

      {/* Waiting State */}
      {isWaiting && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Waiting for a Doctor</h3>
            <p className="text-gray-600 mb-6">
              {caseData.tier === 'priority'
                ? `Your priority request has been sent. The doctor has 5 minutes to accept.`
                : `Your case is in the queue. A doctor will accept it shortly.`}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <p className="text-sm text-blue-800">
                <strong>Your Complaint:</strong> {caseData.chiefComplaint}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      {!isWaiting && (
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
          {/* Doctor Info Card (if just connected) */}
          {doctor && messages.length === 0 && (
            <div className="p-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-4">
                  {doctor.photoUrl ? (
                    <img src={doctor.photoUrl} alt={doctor.name} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl text-blue-600 font-semibold">
                      {doctor.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Dr. {doctor.name}</h3>
                    <p className="text-sm text-gray-500">{doctor.yearsExperience} years experience</p>
                    {doctor.rating > 0 && (
                      <div className="flex items-center gap-1 text-amber-500 text-sm mt-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {doctor.rating.toFixed(1)} ({doctor.totalRatings} reviews)
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">{doctor.bio}</p>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isPatient={msg.senderRole === 'patient'} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Completed Banner */}
          {isCompleted && (
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="bg-white rounded-lg p-4 text-center">
                <svg className="w-10 h-10 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-semibold text-gray-900">Consultation Complete</p>
                <p className="text-sm text-gray-500">Thank you for using HeyDoc</p>
                {!caseData.patientRating && (
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    Rate Your Experience
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Input Area (only if active) */}
          {!isCompleted && (
            <div className="border-t border-gray-200 bg-white p-4">
              <form onSubmit={handleSendMessage} className="flex items-end gap-3">
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
                    placeholder="Type your message..."
                    rows={1}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50"
                >
                  {sending ? (
                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && caseData && doctor && (
        <RatingModal
          caseData={caseData}
          doctor={doctor}
          onClose={() => setShowRatingModal(false)}
          onSubmit={() => {
            setShowRatingModal(false);
            navigate('/chat');
          }}
        />
      )}
    </div>
  );
};

// Message Bubble
interface MessageBubbleProps {
  message: ConsultationMessage;
  isPatient: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isPatient }) => {
  const [showLightbox, setShowLightbox] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className={`flex ${isPatient ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[80%]`}>
          {message.imageUrl && (
            <div
              className={`mb-1 cursor-pointer ${isPatient ? 'ml-auto' : 'mr-auto'}`}
              onClick={() => setShowLightbox(true)}
            >
              <img
                src={message.imageUrl}
                alt="Shared image"
                className="max-w-full rounded-xl max-h-64 object-cover"
              />
            </div>
          )}
          {message.content && (
            <div className={`px-4 py-2.5 rounded-2xl ${
              isPatient
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
            }`}>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          )}
          <p className={`text-xs text-gray-400 mt-1 ${isPatient ? 'text-right' : 'text-left'}`}>
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>

      {showLightbox && message.imageUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-lg"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={message.imageUrl}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

// Rating Modal
interface RatingModalProps {
  caseData: ConsultationCase;
  doctor: DoctorProfile;
  onClose: () => void;
  onSubmit: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({ caseData, doctor, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setLoading(true);
    try {
      // Update case with rating
      await updateDoc(doc(db, COLLECTIONS.CONSULTATION_CASES, caseData.id), {
        patientRating: rating,
        patientReview: review || null,
      });

      // Update doctor's average rating
      const newTotalRatings = doctor.totalRatings + 1;
      const newAvgRating = ((doctor.rating * doctor.totalRatings) + rating) / newTotalRatings;

      await updateDoc(doc(db, COLLECTIONS.DOCTORS, doctor.id), {
        rating: newAvgRating,
        totalRatings: newTotalRatings,
      });

      onSubmit();
    } catch (err) {
      console.error('Error submitting rating:', err);
      alert('Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4 text-center">
          <h2 className="text-xl font-semibold">Rate Your Experience</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Doctor Info */}
          <div className="flex items-center gap-4">
            {doctor.photoUrl ? (
              <img src={doctor.photoUrl} alt={doctor.name} className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-xl text-blue-600 font-semibold">
                {doctor.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">Dr. {doctor.name}</h3>
              <p className="text-sm text-gray-500">How was your consultation?</p>
            </div>
          </div>

          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <svg
                  className={`w-10 h-10 ${
                    star <= (hoverRating || rating) ? 'text-amber-400' : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Write a review (optional)
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || loading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                'Submit Rating'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientConsultChat;
