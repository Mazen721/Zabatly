import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API } from '../config/api';

function ChatWindow({ isFullPage = false, onClose = null }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: 'How many people are traveling, or what kind of car are you looking for?',
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
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
        .join('\n');

      const { data } = await axios.post(`${API}/api/chat`, {
        message: userMsg,
        history: chatHistory,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: data.reply,
          vehicles: data.vehicles || [],
          savings_tip: data.savings_tip || null,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: 'Having trouble connecting. Try again in a moment.',
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
            Zabatly AI Assistant
          </span>
          {isFullPage && (
            <p className="mt-0.5 text-[0.72rem] text-primary-200">
              Tell it the trip, budget, or car type you have in mind.
            </p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-primary-300 transition-colors hover:text-white"
            aria-label="Close chat"
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
            </div>

            {msg.savings_tip && (
              <div className="mt-1.5 max-w-[85%] rounded-subtle border border-signal-200 bg-signal-50 px-2.5 py-1.5 text-[0.75rem] leading-snug text-signal-700">
                {msg.savings_tip}
              </div>
            )}

            {msg.vehicles?.length > 0 && (
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
                        {car.type} - {car.transmission || 'Auto'}
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
                Thinking...
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
          placeholder="Ask about cars, pricing, anything..."
          disabled={isLoading}
          className="flex-1 rounded-subtle border border-sand-200 bg-sand-100 px-3 py-2 text-[0.8125rem] text-sand-900 transition-colors placeholder:text-sand-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-subtle bg-primary-800 text-white transition-colors hover:bg-primary-900 disabled:opacity-40"
          aria-label="Send message"
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
          aria-label="Open chat"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3h14v10H7l-4 4V3z" />
          </svg>
        </button>
      )}
    </div>
  );
}
