import React, { useState } from 'react';
import type { Message, SourceCitation } from '@shared/types';

interface ChatMessageProps {
  message: Message;
}

// Sources section component for AI responses
const SourcesSection: React.FC<{ sources: SourceCitation[]; usedWebSearch?: boolean }> = ({
  sources,
  usedWebSearch,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-200/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        <span className="mr-1.5">📚</span>
        <span className="font-medium">Sources ({sources.length})</span>
        <svg
          className={`w-4 h-4 ml-1 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {usedWebSearch && (
          <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
            🔍 Web search
          </span>
        )}
      </button>

      {expanded && (
        <ul className="mt-2 space-y-1.5 text-sm">
          {sources.map((source, idx) => (
            <li key={idx} className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-700 hover:underline transition-colors break-all"
              >
                {source.name}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Image Lightbox Component
const ImageLightbox: React.FC<{ imageUrl: string; onClose: () => void }> = ({ imageUrl, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <img
        src={imageUrl}
        alt="Full size"
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

// Parse markdown content into React elements
// Handles: [text](url) links, **bold**, and plain https:// URLs
function parseMessageContent(content: string, isUser: boolean): React.ReactNode {
  // Combined regex to match markdown links, bold text, and plain URLs
  const tokenRegex = /(\[([^\]]+)\]\((https?:\/\/[^)]+)\))|(\*\*([^*]+)\*\*)|(https?:\/\/[^\s<>)"]+)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = tokenRegex.exec(content)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Markdown link: [text](url)
      const linkText = match[2];
      const linkUrl = match[3];
      parts.push(
        <a
          key={`link-${keyIndex++}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline font-medium hover:opacity-80 transition-opacity ${
            isUser ? 'text-green-100' : 'text-green-600 hover:text-green-700'
          }`}
        >
          {linkText}
        </a>
      );
    } else if (match[4]) {
      // Bold text: **text**
      parts.push(<strong key={`bold-${keyIndex++}`}>{match[5]}</strong>);
    } else if (match[6]) {
      // Plain URL
      const url = match[6];
      parts.push(
        <a
          key={`url-${keyIndex++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline font-medium hover:opacity-80 transition-opacity ${
            isUser ? 'text-green-100' : 'text-green-600 hover:text-green-700'
          }`}
        >
          {url}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last match
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Check if this message has only an image (no meaningful text content)
  const isImageOnly = message.imageUrl && (!message.content || message.content === '[Image attached]');

  return (
    <>
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start gap-3`}>
        {!isUser && (
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 via-emerald-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        )}
        <div
          className={`max-w-2xl ${
            isUser
              ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl rounded-br-md shadow-lg'
              : 'bg-white/80 backdrop-blur-sm text-gray-900 rounded-2xl rounded-tl-md shadow-md border border-green-100'
          } px-6 py-4`}
        >
          {message.emergencyFlag && (
            <div className="flex items-center mb-2 text-red-200">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs font-semibold">Emergency Keywords Detected</span>
            </div>
          )}

          {/* Image display */}
          {message.imageUrl && (
            <div className="mb-3">
              <button
                onClick={() => setLightboxOpen(true)}
                className="block relative group rounded-lg overflow-hidden"
              >
                <img
                  src={message.imageUrl}
                  alt="Attached image"
                  className="max-w-full max-h-64 object-cover rounded-lg transition-transform group-hover:scale-[1.02]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Text content - only show if there's actual text (not just placeholder) */}
          {!isImageOnly && (
            <div className="whitespace-pre-wrap leading-relaxed">
              {parseMessageContent(message.content, isUser)}
            </div>
          )}

          {/* Sources section for AI responses */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <SourcesSection sources={message.sources} usedWebSearch={message.usedWebSearch} />
          )}

          <p className={`text-xs mt-2 ${isUser ? 'text-primary-100' : 'text-gray-500'}`}>
            {message.timestamp?.toLocaleTimeString?.([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {isUser && (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>

      {/* Lightbox modal */}
      {lightboxOpen && message.imageUrl && (
        <ImageLightbox imageUrl={message.imageUrl} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
};

export default ChatMessage;
