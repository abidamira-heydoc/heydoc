import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { chatService, type ConversationStage } from '../../services/chatService';
import { doc, getDoc, collection, addDoc, updateDoc, query, where, orderBy, getDocs, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { COLLECTIONS } from '../../../../shared/firebase.config';
import type { Message, Conversation } from '../../../../shared/types';
import EmergencyBanner from './EmergencyBanner';
import ChatMessage from './ChatMessage';
import ChatSidebar from './ChatSidebar';
import DoctorConsultModal from './DoctorConsultModal';

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [emergencyDetected, setEmergencyDetected] = useState(false);
  const [healthProfile, setHealthProfile] = useState<any>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversationStage, setConversationStage] = useState<ConversationStage>('INTAKE1');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Handle swipe gestures for sidebar
  useEffect(() => {
    const minSwipeDistance = 50;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchEndX.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      if (!touchStartX.current || !touchEndX.current) return;

      const distance = touchEndX.current - touchStartX.current;
      const isLeftSwipe = distance < -minSwipeDistance;
      const isRightSwipe = distance > minSwipeDistance;

      // Only handle swipes on mobile
      if (window.innerWidth < 1024) {
        // Swipe right from left edge to open sidebar
        if (isRightSwipe && touchStartX.current < 50) {
          setSidebarOpen(true);
        }
        // Swipe left to close sidebar
        if (isLeftSwipe && sidebarOpen) {
          setSidebarOpen(false);
        }
      }

      touchStartX.current = null;
      touchEndX.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [sidebarOpen]);

  // Set sidebar open on desktop only after mount
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, []);

  // Load health profile
  useEffect(() => {
    const loadHealthProfile = async () => {
      if (!user) return;

      try {
        const profileDoc = await getDoc(doc(db, COLLECTIONS.HEALTH_PROFILES, user.uid));
        if (profileDoc.exists()) {
          setHealthProfile(profileDoc.data());
        }
      } catch (error) {
        console.error('Error loading health profile:', error);
      }
    };

    loadHealthProfile();
  }, [user]);

  // Load conversations
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, COLLECTIONS.CONVERSATIONS),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs: Conversation[] = [];
      snapshot.forEach((doc) => {
        convs.push({ id: doc.id, ...doc.data() } as Conversation);
      });
      setConversations(convs);
    });

    return () => unsubscribe();
  }, [user]);

  // Create new conversation
  const createNewConversation = async () => {
    if (!user) return null;

    const conversationData = {
      userId: user.uid,
      title: 'New Conversation',
      createdAt: new Date(),
      updatedAt: new Date(),
      emergencyDetected: false,
      messages: [],
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.CONVERSATIONS), conversationData);
    setCurrentConversationId(docRef.id);
    setMessages([]);
    setEmergencyDetected(false);
    setConversationStage('INTAKE1');
    return docRef.id;
  };

  // Load conversation
  const loadConversation = async (conversationId: string) => {
    try {
      const q = query(
        collection(db, COLLECTIONS.MESSAGES),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      );

      const snapshot = await getDocs(q);
      const msgs: Message[] = [];
      snapshot.forEach((docSnap) => {
        msgs.push({ id: docSnap.id, ...docSnap.data() } as Message);
      });

      setMessages(msgs);
      setCurrentConversationId(conversationId);

      // Reset stage based on whether conversation has messages
      // New conversations start at INTAKE1, existing ones continue at FULL_RESPONSE
      setConversationStage(msgs.length === 0 ? 'INTAKE1' : 'FULL_RESPONSE');

      // Check if conversation has emergency
      const convDoc = await getDoc(doc(db, COLLECTIONS.CONVERSATIONS, conversationId));
      if (convDoc.exists()) {
        setEmergencyDetected(convDoc.data().emergencyDetected || false);
      }
    } catch (error: any) {
      console.error('Error loading conversation:', error);
      // Check if it's a missing index error
      if (error?.message?.includes('index')) {
        alert('Missing database index. Check browser console for the link to create it.');
      }
    }
  };

  // Delete conversation
  const deleteConversation = async (conversationId: string) => {
    try {
      // Delete all messages in the conversation
      const messagesQuery = query(
        collection(db, COLLECTIONS.MESSAGES),
        where('conversationId', '==', conversationId)
      );
      const messagesSnapshot = await getDocs(messagesQuery);

      const batch = writeBatch(db);
      messagesSnapshot.forEach((messageDoc) => {
        batch.delete(messageDoc.ref);
      });

      // Delete the conversation document
      batch.delete(doc(db, COLLECTIONS.CONVERSATIONS, conversationId));

      await batch.commit();

      // If the deleted conversation was the current one, clear the view
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
        setEmergencyDetected(false);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  // Send message
  const handleSend = async () => {
    if (!input.trim() || loading || (emergencyDetected && !input.includes('emergency'))) return;
    if (!user) return;

    // Check for emergency keywords
    const quickEmergency = chatService.quickEmergencyCheck(input);

    try {
      setLoading(true);

      // Ensure we have a conversation
      let convId = currentConversationId;
      if (!convId) {
        convId = await createNewConversation();
        if (!convId) return;
      }

      // Create user message
      const userMessage: Omit<Message, 'id'> = {
        conversationId: convId,
        role: 'user',
        content: input,
        timestamp: new Date(),
        emergencyFlag: quickEmergency,
      };

      // Add to Firestore
      await addDoc(collection(db, COLLECTIONS.MESSAGES), userMessage);

      // Add to local state
      setMessages((prev) => [...prev, userMessage as Message]);

      // Clear input
      const userInput = input;
      setInput('');

      // Check for emergency
      if (quickEmergency) {
        setEmergencyDetected(true);
        await updateDoc(doc(db, COLLECTIONS.CONVERSATIONS, convId), {
          emergencyDetected: true,
          updatedAt: new Date(),
        });
        setLoading(false);
        return;
      }

      // Build message history for AI
      const messageHistory = [
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: userInput },
      ];

      // Get AI response with current stage
      const { message: aiResponse, nextStage } = await chatService.sendMessage(
        messageHistory,
        healthProfile,
        conversationStage
      );

      // Update stage for next turn
      setConversationStage(nextStage);

      // Create assistant message
      const assistantMessage: Omit<Message, 'id'> = {
        conversationId: convId,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      // Add to Firestore
      await addDoc(collection(db, COLLECTIONS.MESSAGES), assistantMessage);

      // Add to local state
      setMessages((prev) => [...prev, assistantMessage as Message]);

      // Update conversation title on first user message (greeting doesn't count)
      const userMessages = messages.filter(m => m.role === 'user');
      if (userMessages.length === 0) {
        const title = userInput.slice(0, 50) + (userInput.length > 50 ? '...' : '');
        await updateDoc(doc(db, COLLECTIONS.CONVERSATIONS, convId), {
          title,
          updatedAt: new Date(),
        });
      } else {
        await updateDoc(doc(db, COLLECTIONS.CONVERSATIONS, convId), {
          updatedAt: new Date(),
        });
      }

      // Update health profile if needed (auto-update based on conversation)
      // This would be implemented to extract info from the conversation
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50">
      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={loadConversation}
        onNewConversation={createNewConversation}
        onDeleteConversation={deleteConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Emergency Banner */}
        {emergencyDetected && <EmergencyBanner />}

        {/* Chat Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-green-100 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/chat')}
            >
              <img
                src="/heydoclogo.png"
                alt="HeyDoc Logo"
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">HeyDoc</h1>
                <p className="text-xs text-green-600">Your AI Health Assistant</p>
              </div>
            </div>
          </div>
          {healthProfile && (
            <div className="flex items-center gap-2 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                {healthProfile.age}yo {healthProfile.sex}
              </span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
          {/* Welcome screen - shows when no messages */}
          {messages.length === 0 && !emergencyDetected && (
            <div className="text-center py-8 sm:py-16 px-2 sm:px-4">
              <div className="inline-block p-4 sm:p-8 bg-white rounded-2xl mb-4 sm:mb-6 shadow-lg border-2 border-green-100">
                <img
                  src="/heydoclogo.png"
                  alt="HeyDoc Logo"
                  className="w-24 h-24 sm:w-40 sm:h-40 object-contain"
                />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                Welcome to HeyDoc!
              </h2>
              <p className="text-gray-700 max-w-lg mx-auto text-base sm:text-lg mb-4 sm:mb-6">
                Your first step to better care — with natural remedy guidance.
              </p>
              <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8">
                <div className="bg-white/60 backdrop-blur-sm p-4 sm:p-5 rounded-xl shadow-md border border-green-200/50 hover:shadow-lg transition-all">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Describe Symptoms</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Share what you're experiencing</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm p-4 sm:p-5 rounded-xl shadow-md border border-blue-200/50 hover:shadow-lg transition-all">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Get Guidance</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Receive personalized advice</p>
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 via-emerald-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-md border border-green-100">
                <div className="flex space-x-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-bounce" />
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce delay-100" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-bounce delay-200" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white/80 backdrop-blur-md border-t border-green-100 px-3 sm:px-6 py-3 sm:py-5 shadow-lg">
          {!emergencyDetected && messages.length > 0 && (
            <div className="mb-3 sm:mb-4">
              <button
                onClick={() => setShowDoctorModal(true)}
                className="group relative w-full bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 hover:from-green-600 hover:via-emerald-600 hover:to-cyan-600 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-xl transition-all shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 relative z-10 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="relative z-10 text-base sm:text-lg">Speak to a Doctor</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex items-end space-x-2 sm:space-x-3">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  emergencyDetected
                    ? 'Please call emergency services immediately'
                    : 'Describe your symptoms...'
                }
                disabled={emergencyDetected || loading}
                className="w-full px-3 sm:px-5 py-2.5 sm:py-3.5 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none disabled:bg-gray-50 disabled:cursor-not-allowed transition-all shadow-sm bg-white/80 text-sm sm:text-base"
                rows={2}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || emergencyDetected}
              className="bg-gradient-to-br from-green-500 via-emerald-500 to-cyan-500 hover:from-green-600 hover:via-emerald-600 hover:to-cyan-600 text-white p-3 sm:p-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-xl disabled:shadow-sm flex-shrink-0"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          {/* Permanent Disclaimer */}
          <p className="text-xs text-gray-500 text-center mt-3 px-4">
            HeyDoc provides informational guidance only, not medical advice. Always consult a healthcare provider for medical decisions.
          </p>
        </div>
      </div>

      {/* Doctor Consult Modal */}
      {showDoctorModal && <DoctorConsultModal onClose={() => setShowDoctorModal(false)} />}
    </div>
  );
};

export default Chat;
