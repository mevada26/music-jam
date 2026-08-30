import React, { useState, useEffect, useRef } from 'react';
import { Send, Music2, Smile, Crown, Sparkles, MessageSquare } from 'lucide-react';
import { ChatMessage, Participant, SongSuggestion } from '../../types';
import { SuggestionCard } from './SuggestionCard';

interface ChatViewProps {
  messages: ChatMessage[];
  currentParticipant: Participant | null;
  onSendMessage: (content: string) => void;
  onOpenSuggestModal: () => void;
  onUpvoteSuggestion: (suggestionId: string) => void;
  onResolveSuggestion: (suggestionId: string, action: 'add_to_queue' | 'play_next' | 'reject') => void;
}

const QUICK_EMOJIS = ['🔥', '❤️', '🎵', '🚀', '💃', '🙌', '🎉', '🎧'];

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  currentParticipant,
  onSendMessage,
  onOpenSuggestModal,
  onUpvoteSuggestion,
  onResolveSuggestion,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleSendEmoji = (emoji: string) => {
    onSendMessage(emoji);
  };

  return (
    <div className="flex flex-col h-full bg-rave-card rounded-3xl border border-rave-border shadow-xl overflow-hidden">
      {/* Chat Header */}
      <div className="px-5 py-3.5 border-b border-rave-border bg-rave-surface/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rave-purple/20 text-rave-purple">
            <MessageSquare size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              Live Room Chat
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Suggest tracks & chat with friends in real-time</p>
          </div>
        </div>

        {/* Suggest Song Action Button */}
        <button
          onClick={onOpenSuggestModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rave-purple to-rave-pink hover:opacity-90 text-white text-xs font-semibold shadow-md glow-purple transition transform active:scale-95"
        >
          <Music2 size={14} />
          <span>Suggest Song</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <MessageSquare size={36} className="text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-400">No messages yet</p>
            <p className="text-xs text-slate-500 mt-1">Be the first to say hi or suggest a track!</p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.type === 'system') {
              return (
                <div key={msg.id} className="flex items-center justify-center my-1.5">
                  <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/50 text-[11px] text-slate-400 text-center font-medium">
                    {msg.content}
                  </span>
                </div>
              );
            }

            if (msg.type === 'suggestion' && msg.suggestion) {
              return (
                <SuggestionCard
                  key={msg.id}
                  suggestion={msg.suggestion}
                  currentParticipant={currentParticipant}
                  onUpvote={onUpvoteSuggestion}
                  onResolve={onResolveSuggestion}
                />
              );
            }

            const isMe = currentParticipant?.id === msg.senderId;
            const isHost = msg.senderRole === 'host';

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-rave-surface border border-rave-border flex items-center justify-center text-sm flex-shrink-0">
                  {msg.senderAvatar || '🎵'}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[78%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-xs font-semibold text-slate-300">{msg.senderName}</span>
                    {isHost && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                        <Crown size={10} /> Host
                      </span>
                    )}
                  </div>

                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                      isMe
                        ? 'bg-gradient-to-tr from-rave-purple to-rave-violet text-white rounded-tr-sm shadow-md'
                        : 'bg-rave-surface border border-rave-border text-slate-100 rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emojis Bar */}
      <div className="px-4 py-1.5 bg-rave-surface/40 border-t border-rave-border/60 flex items-center gap-1.5 overflow-x-auto">
        <span className="text-[10px] uppercase font-bold text-slate-500 mr-1 flex items-center gap-1">
          <Smile size={12} /> React:
        </span>
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleSendEmoji(emoji)}
            className="p-1 rounded-lg hover:bg-slate-800 transition text-sm active:scale-125"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-rave-border bg-rave-card flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Say something or share thoughts..."
          className="flex-1 bg-rave-surface border border-rave-border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rave-purple focus:ring-1 focus:ring-rave-purple transition"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-rave-purple text-white hover:bg-rave-violet disabled:opacity-40 disabled:hover:bg-rave-purple transition shadow-md"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
