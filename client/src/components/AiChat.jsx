import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API } from '../config/api';

const TYPEWRITER_CHUNK = 2;
const TYPEWRITER_DELAY = 18;

function ChatWindow({ isFullPage = false, onClose = null }) {
  const { t } = useTranslation('ai');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: t('initialMessage'),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const typingIndex = messages.findIndex((msg) => msg.role === 'ai' && msg.isTyping);
    if (typingIndex === -1) return undefined;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const currentMessage = messages[typingIndex];
    const fullText = currentMessage.fullText || '';

    if (prefersReducedMotion || currentMessage.text.length >= fullText.length) {
      setMessages((prev) =>
        prev.map((msg, index) =>
          index === typingIndex
            ? { ...msg, text: fullText, isTyping: false }
            : msg
        )
      );
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg, index) => {
          if (index !== typingIndex) return msg;

          const nextText = fullText.slice(0, msg.text.length + TYPEWRITER_CHUNK);
          return {
            ...msg,
            text: nextText,
            isTyping: nextText.length < fullText.length,
          };
        })
      );
    }, TYPEWRITER_DELAY);

    return () => window.clearTimeout(timer);
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    const updated = [...messages, { role: 'user', text: userMsg }];
    setMessages(updated);
    setIsLoading(true);

    try {
      const chatHistory = updated
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.fullText || m.text}`)
        .join('\n');

      const { data } = await axios.post(`${API}/api/chat`, {
        message: userMsg,
        history: chatHistory,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: '',
          fullText: data.reply || '',
          isTyping: true,
          vehicles: data.vehicles || [],
          savings_tip: data.savings_tip || null,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: t('connectionError'),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`bg-sand-50 border border-sand-200 flex flex-col overflow-hidden ${
        isFullPage
          ? 'min-h-[calc(100vh-148px)] rounded-soft'
          : 'h-[480px] w-80 rounded-soft shadow-lg md:w-96'
      }`}
    >
      <div className="flex flex-shrink-0 items-center justify-between bg-primary-800 px-4 py-3">
        <div>
          <span className="text-[0.875rem] font-semibold text-white">
            {t('assistant')}
          </span>
          {isFullPage && (
            <p className="mt-0.5 text-[0.72rem] text-primary-200">
              {t('assistantIntro')}
            </p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-primary-300 transition-colors hover:text-white"
            aria-label={t('closeChat')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.map((msg, index) => (
          <div
            key={`${msg.role}-${index}`}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-subtle px-3 py-2 text-[0.8125rem] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary-800 text-white'
                  : 'border border-sand-200 bg-sand-100 text-sand-900'
              }`}
            >
              {msg.text}
              {msg.isTyping && (
                <span className="ml-0.5 inline-block h-3 w-px translate-y-0.5 animate-pulse bg-sand-500" />
              )}
            </div>

            {msg.savings_tip && !msg.isTyping && (
              <div className="mt-1.5 max-w-[85%] rounded-subtle border border-signal-200 bg-signal-50 px-2.5 py-1.5 text-[0.75rem] leading-snug text-signal-700">
                {msg.savings_tip}
              </div>
            )}

            {msg.vehicles?.length > 0 && !msg.isTyping && (
              <div className="mt-2 w-full max-w-[90%] space-y-1.5">
                {msg.vehicles.map((car) => (
                  <Link
                    to={`/vehicle/${car._id}`}
                    key={car._id}
                    className="flex items-center gap-3 rounded-subtle border border-sand-200 bg-sand-50 px-3 py-2 transition-colors hover:bg-sand-100"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.8125rem] font-medium text-sand-900">
                        {car.make} {car.model}
                      </p>
                      <p className="text-[0.7rem] capitalize text-sand-500">
                        {car.type} - {car.transmission || t('auto')}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <span className="tabular-nums text-[0.8125rem] font-semibold text-primary-800">
                        {car.price_per_day || car.pricePerDay} EGP
                      </span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sand-400">
                        <path d="M4.5 2 8.5 6l-4 4" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start">
            <div className="rounded-subtle border border-sand-200 bg-sand-100 px-3 py-2">
              <span className="animate-pulse text-[0.8125rem] text-sand-500">
                {t('thinking')}
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="flex flex-shrink-0 items-center gap-2 border-t border-sand-200 bg-sand-50 px-3 py-2.5"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('placeholder')}
          disabled={isLoading}
          className="flex-1 rounded-subtle border border-sand-200 bg-sand-100 px-3 py-2 text-[0.8125rem] text-sand-900 transition-colors placeholder:text-sand-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-subtle bg-primary-800 text-white transition-colors hover:bg-primary-900 disabled:opacity-40"
          aria-label={t('sendMessage')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 1.5l-6 11-2-4.5L0 6l12.5-4.5z" />
            <path d="M12.5 1.5 4.5 8" />
          </svg>
        </button>
      </form>
    </div>
  );
}

export { ChatWindow };

export default function AiChat() {
  const { t } = useTranslation('ai');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-3">
          <ChatWindow onClose={() => setIsOpen(false)} />
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-soft bg-primary-800 text-white shadow-md transition-colors hover:bg-primary-900"
          aria-label={t('openChat')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3h14v10H7l-4 4V3z" />
          </svg>
        </button>
      )}
    </div>
  );
}
