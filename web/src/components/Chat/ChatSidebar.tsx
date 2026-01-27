import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import type { Conversation } from '@shared/types';

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  isOpen: boolean;
  onToggle?: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isOpen,
  onToggle,
}) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data()?.role || null);
        }
      } catch (err) {
        console.error('Error checking user role:', err);
      }
    };
    checkUserRole();
  }, [user]);

  // Check if user is any type of admin
  const isAdmin = userRole === 'org_admin' || userRole === 'platform_admin';
  const isPlatformAdmin = userRole === 'platform_admin';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setDeleteConfirm(conversationId);
  };

  const handleConfirmDelete = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    onDeleteConversation(conversationId);
    setDeleteConfirm(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(null);
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[280px] sm:w-80 bg-white/95 lg:bg-white/70 backdrop-blur-md border-r border-green-100
        flex flex-col shadow-lg
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:hidden'}
      `}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-green-100">
        <button
          onClick={onNewConversation}
          className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 hover:from-green-600 hover:via-emerald-600 hover:to-cyan-600 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-xl flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Conversation
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {conversations.map((conversation) => (
            <div key={conversation.id} className="relative group">
              <button
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                  currentConversationId === conversation.id
                    ? 'bg-gradient-to-r from-green-100 via-emerald-50 to-cyan-100 border border-green-200 shadow-md'
                    : 'hover:bg-white/50 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0 pr-8">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conversation.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {conversation.updatedAt?.toLocaleDateString?.()}
                    </p>
                  </div>
                  {conversation.emergencyDetected && (
                    <span className="flex-shrink-0 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full h-fit mt-0.5">
                      Emergency
                    </span>
                  )}
                </div>
              </button>

              <div className="absolute right-2 top-3 flex items-center gap-1">
                {deleteConfirm === conversation.id ? (
                  <div className="flex items-center gap-1 bg-white shadow-lg rounded-lg p-1 border border-gray-200 z-10">
                    <button
                      onClick={(e) => handleConfirmDelete(e, conversation.id)}
                      className="px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition"
                    >
                      Delete
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      className="px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => handleDeleteClick(e, conversation.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition opacity-0 group-hover:opacity-100"
                    title="Delete conversation"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}

          {conversations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-green-100 space-y-2 bg-white/50">
        {/* Platform Admin Dashboard Button */}
        {isPlatformAdmin && (
          <button
            onClick={() => navigate('/platform')}
            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 rounded-xl transition-all flex items-center"
          >
            <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-sm font-medium text-blue-700">Platform Dashboard</span>
          </button>
        )}
        {/* Org Admin Dashboard Button */}
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="w-full text-left px-4 py-2.5 hover:bg-purple-50 rounded-xl transition-all flex items-center"
          >
            <svg className="w-5 h-5 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-sm font-medium text-purple-700">Org Dashboard</span>
          </button>
        )}
        <button
          onClick={() => navigate('/profile')}
          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 rounded-xl transition-all flex items-center"
        >
          <svg className="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Health Profile</span>
        </button>
        <button
          onClick={handleSignOut}
          className="w-full text-left px-4 py-2.5 hover:bg-red-50 rounded-xl transition-all flex items-center text-red-600"
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
      </div>
    </>
  );
};

export default ChatSidebar;
