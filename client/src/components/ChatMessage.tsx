import ReactMarkdown from 'react-markdown';
import type { Message } from '../core/types.ts';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-sterling-600 text-white rounded-br-md'
            : 'bg-sterling-800/60 text-slate-200 rounded-bl-md border border-slate-700/50'
        }`}
      >
        {!isUser && (
          <div className="text-xs text-sterling-500 font-medium mb-1">Dr. Sterling</div>
        )}
        {isUser ? (
          <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
        ) : (
          <div className="text-sm leading-relaxed prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
