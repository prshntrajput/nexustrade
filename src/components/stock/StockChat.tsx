'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// ─── Suggested Questions ──────────────────────────────────────────────────────

const SUGGESTED_QUESTIONS = [
  'What are the key risks for this stock?',
  'How is it performing today?',
  'What does the technical picture look like?',
  'Any recent news I should know about?',
];

// ─── Individual Message Bubble ────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div
      className={cn(
        'flex gap-3 w-full',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-7 h-7 flex items-center justify-center border',
          isUser
            ? 'bg-primary/15 border-primary/30 text-primary'
            : 'bg-gray-800 border-gray-700 text-gray-400',
        )}
      >
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      {/* Content */}
      <div
        className={cn(
          'max-w-[80%] px-3 py-2.5 text-sm leading-relaxed border',
          isUser
            ? 'bg-primary/10 border-primary/20 text-foreground ml-auto'
            : 'bg-card border-border text-foreground/90',
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-gray-800 border border-gray-700 text-gray-400">
        <Bot size={13} />
      </div>
      <div className="bg-card border border-border px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface StockChatProps {
  symbol: string;
}

export function StockChat({ symbol }: StockChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I'm your AI analyst for ${symbol}. I have access to live price data and recent news. Ask me anything about this stock.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to the latest message whenever the list changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setError(null);
      setInput('');

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Build the full history to send — exclude the welcome message (system-generated)
      const history = [...messages, userMessage]
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      // Always include at least the current user message
      const payload = history.length > 0 ? history : [{ role: 'user' as const, content: trimmed }];

      try {
        const res = await fetch('/api/gateway/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ symbol, messages: payload }),
        });

        const json = (await res.json()) as
          | { success: true; data: { message: string } }
          | { success: false; error: { message: string } };

        if (!json.success) {
          setError(json.error.message ?? 'Something went wrong.');
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: json.data.message,
          },
        ]);
      } catch {
        setError('Network error — please try again.');
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [messages, symbol, isLoading],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const showSuggestions = messages.length === 1; // Only show after welcome message

  return (
    <div className="flex flex-col h-[560px] bg-card border border-border">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
        <div className="w-7 h-7 bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Bot size={14} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            AI Analyst — {symbol}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Powered by Gemini · Live data context
          </p>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        {error && (
          <p className="text-center text-xs text-destructive py-1">{error}</p>
        )}

        {/* Suggested questions — only shown before first user message */}
        {showSuggestions && (
          <div className="pt-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
              Suggested questions
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => void sendMessage(q)}
                  className={cn(
                    'px-3 py-1.5 text-xs border transition-all duration-150',
                    'bg-secondary border-border text-muted-foreground',
                    'hover:border-primary/40 hover:text-foreground',
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 px-4 py-3 border-t border-border"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${symbol}…`}
          maxLength={500}
          disabled={isLoading}
          className={cn(
            'flex-1 bg-secondary border border-border px-3 py-2 text-sm',
            'text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:border-primary/50 focus:ring-0',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors',
          )}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={cn(
            'flex items-center justify-center w-9 h-9 border transition-all duration-150',
            'bg-primary/15 border-primary/30 text-primary',
            'hover:bg-primary/25 hover:border-primary/50',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
        </button>
      </form>
    </div>
  );
}
