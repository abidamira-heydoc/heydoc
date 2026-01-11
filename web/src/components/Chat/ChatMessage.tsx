import React from 'react';
import type { Message } from '../../../../shared/types';

interface ChatMessageProps {
  message: Message;
}

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

  return (
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
        <div className="whitespace-pre-wrap leading-relaxed">
          {parseMessageContent(message.content, isUser)}
        </div>
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
  );
};

export default ChatMessage;
