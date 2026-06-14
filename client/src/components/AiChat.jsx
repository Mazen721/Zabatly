import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API } from '../config/api';

const TYPEWRITER_CHUNK = 2;
const TYPEWRITER_DELAY = 18;

/* ------------------------------------------------------------------ */
/*  Compact Vehicle Row (floating widget)                              */
/* ------------------------------------------------------------------ */

function VehicleRowCompact({ car, index, t }) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return (
    <Link
      to={`/vehicle/${car._id}`}
      className="flex items-center gap-2.5 rounded-subtle border border-sand-200 bg-sand-50 px-2.5 py-2 transition-colors duration-150 hover:bg-sand-100"
      style={
        prefersReducedMotion
          ? undefined
          : { animationDelay: `${index * 80}ms` }
      }
    >
      <div className="h-9 w-12 flex-shrink-0 overflow-hidden rounded-[4px] bg-sand-100">
        {car.images?.[0] && (
          <img
            src={car.images[0]}
            alt={`${car.make} ${car.model}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.8125rem] font-medium text-sand-900">
          {car.make} {car.model}
        </p>
        <p className="text-[0.7rem] capitalize text-sand-500">
          {car.type} · {car.transmission || t('auto')}
        </p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1.5">
        <span className="tabular-nums text-[0.8125rem] font-semibold text-primary-800">
          {car.price_per_day || car.pricePerDay} EGP
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-sand-400"
        >
          <path d="M4.5 2 8.5 6l-4 4" />
        </svg>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Rich Vehicle Card (full page)                                      */
/* ------------------------------------------------------------------ */

function VehicleCardRich({ car, index, t }) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return (
    <Link
      to={`/vehicle/${car._id}`}
      className="group flex items-start gap-3.5 rounded-subtle border border-sand-200 bg-sand-50 p-2.5 transition-colors duration-150 hover:bg-sand-100"
      style={
        prefersReducedMotion
          ? undefined
          : { animationDelay: `${index * 100}ms` }
      }
    >
      <div className="h-[72px] w-[108px] flex-shrink-0 overflow-hidden rounded-[4px] bg-sand-100">
        {car.images?.[0] && (
          <img
            src={car.images[0]}
            alt={`${car.make} ${car.model}`}
            className="h-full w-full object-cover transition-transform duration-500 ease-out-quart group-hover:scale-105"
            loading="lazy"
          />
        )}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="truncate text-[0.875rem] font-semibold text-sand-900">
          {car.make} {car.model}
        </p>
        <p className="mt-0.5 text-[0.75rem] capitalize text-sand-500">
          {car.type} · {car.capacity ? `${car.capacity} ${t('seats')}` : ''}{' '}
          {car.capacity && car.transmission ? '· ' : ''}
          {car.transmission || t('auto')}
        </p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="tabular-nums text-[0.875rem] font-bold text-primary-800">
            {car.price_per_day || car.pricePerDay} EGP
            <span className="ml-0.5 text-[0.7rem] font-normal text-sand-500">
              {t('perDay')}
            </span>
          </span>
          <span className="text-[0.75rem] font-semibold text-primary-700 transition-colors duration-150 group-hover:text-primary-900">
            {t('viewDetails')}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Thinking Indicator                                                 */
/* ------------------------------------------------------------------ */

function ThinkingIndicator({ text }) {
  return (
    <div className="flex items-start">
      <div className="rounded-subtle border border-sand-200 bg-sand-100 px-3 py-2">
        <span className="flex items-center gap-1.5 text-[0.8125rem] text-sand-500">
          {text}
          <span className="flex gap-[3px]">
            <span className="inline-block h-[4px] w-[4px] animate-pulse rounded-full bg-sand-400" style={{ animationDelay: '0ms' }} />
            <span className="inline-block h-[4px] w-[4px] animate-pulse rounded-full bg-sand-400" style={{ animationDelay: '200ms' }} />
            <span className="inline-block h-[4px] w-[4px] animate-pulse rounded-full bg-sand-400" style={{ animationDelay: '400ms' }} />
          </span>
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat Window                                                        */
/* ------------------------------------------------------------------ */

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

  /* ---------- Scroll to bottom ---------- */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ---------- Autofocus ---------- */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* ---------- Typewriter effect ---------- */
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

  /* ---------- Send message ---------- */
  const sendMessage = useCallback(
    async (messageText) => {
      const text = typeof messageText === 'string' ? messageText : input;
      if (!text.trim()) return;

      if (typeof messageText !== 'string') {
        // Came from form submit
        messageText?.preventDefault?.();
      }

      const userMsg = text.trim();
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
            isError: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, messages, t]
  );

  const handleFormSubmit = useCallback(
    (e) => {
      e.preventDefault();
      sendMessage(input);
    },
    [sendMessage, input]
  );



  /* ---------- Render ---------- */
  const VehicleComponent = isFullPage ? VehicleCardRich : VehicleRowCompact;

  return (
    <div
      className={`flex flex-col overflow-hidden border border-sand-200 bg-sand-50 ${
        isFullPage
          ? 'min-h-[calc(100vh-148px)] rounded-soft'
          : 'h-[480px] w-80 rounded-soft shadow-lg md:w-96'
      }`}
    >
      {/* ---- Header ---- */}
      <div className="flex flex-shrink-0 items-center justify-between bg-primary-800 px-4 py-3">
        <div>
          <span className="text-[0.875rem] font-semibold text-white">
            {isFullPage ? t('assistant') : t('assistantShort')}
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
            className="flex h-6 w-6 items-center justify-center rounded text-primary-300 transition-colors duration-150 hover:text-white"
            aria-label={t('closeChat')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" />
            </svg>
          </button>
        )}
      </div>

      {/* ---- Messages ---- */}
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.map((msg, index) => (
          <div
            key={`${msg.role}-${index}`}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Message bubble */}
            <div
              className={`max-w-[85%] rounded-subtle ${
                isFullPage ? 'px-3.5 py-2.5' : 'px-3 py-2'
              } text-[0.8125rem] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary-800 text-white'
                  : msg.isError
                    ? 'border border-red-200 bg-red-50 text-red-700'
                    : 'border border-sand-200 bg-sand-100 text-sand-900'
              }`}
            >
              {msg.text}
              {msg.isTyping && (
                <span className="ml-0.5 inline-block h-[14px] w-[1.5px] translate-y-[2px] animate-cursor-blink bg-sand-500" />
              )}
            </div>

            {/* Savings tip */}
            {msg.savings_tip && !msg.isTyping && (
              <div className="mt-1.5 max-w-[85%] rounded-subtle border border-signal-200 bg-signal-50 px-2.5 py-1.5 text-[0.75rem] leading-snug text-signal-700">
                {msg.savings_tip}
              </div>
            )}

            {/* Vehicle previews */}
            {msg.vehicles?.length > 0 && !msg.isTyping && (
              <div
                className={`mt-2 w-full space-y-1.5 ${
                  isFullPage ? 'max-w-[92%]' : 'max-w-[90%]'
                }`}
              >
                {msg.vehicles.map((car, carIndex) => (
                  <div
                    key={car._id}
                    className="animate-chat-fade-up"
                    style={{
                      animationDelay: `${carIndex * (isFullPage ? 100 : 80)}ms`,
                    }}
                  >
                    <VehicleComponent car={car} index={carIndex} t={t} />
                  </div>
                ))}
              </div>
            )}

            {/* Error retry */}
            {msg.isError && (
              <button
                type="button"
                onClick={() => {
                  // Find the last user message and resend it
                  const lastUserMsg = [...messages]
                    .reverse()
                    .find((m) => m.role === 'user');
                  if (lastUserMsg) {
                    // Remove the error message and resend
                    setMessages((prev) => prev.filter((_, i) => i !== index));
                    sendMessage(lastUserMsg.text);
                  }
                }}
                className="mt-1 text-[0.75rem] font-semibold text-red-600 transition-colors duration-150 hover:text-red-800"
              >
                {t('retry')}
              </button>
            )}
          </div>
        ))}

        {/* Thinking indicator */}
        {isLoading && <ThinkingIndicator text={t('thinking')} />}


        <div ref={endRef} />
      </div>

      {/* ---- Input bar ---- */}
      <form
        onSubmit={handleFormSubmit}
        className="flex flex-shrink-0 items-center gap-2 border-t border-sand-200 bg-sand-50 px-3 py-2.5"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('placeholder')}
          disabled={isLoading}
          className="flex-1 rounded-subtle border border-sand-200 bg-sand-100 px-3 py-2 text-[0.8125rem] text-sand-900 transition-colors duration-150 placeholder:text-sand-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-subtle bg-primary-800 text-white transition-colors duration-150 hover:bg-primary-900 disabled:opacity-40"
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

/* ------------------------------------------------------------------ */
/*  Floating Chat (FAB)                                                */
/* ------------------------------------------------------------------ */

export default function AiChat() {
  const { t } = useTranslation('ai');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-3 animate-chat-fade-up">
          <ChatWindow onClose={() => setIsOpen(false)} />
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-soft bg-primary-800 text-white shadow-md transition-colors duration-150 hover:bg-primary-900"
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
