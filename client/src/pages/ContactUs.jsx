import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API } from '../config/api';

/* ─── Icons ───────────────────────────────────────────────────── */

function MailIcon({ className = '' }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 7L2 7" />
    </svg>
  );
}

function PhoneIcon({ className = '' }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function SendIcon({ className = '' }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4z" />
    </svg>
  );
}

function CheckCircleIcon({ className = '' }) {
  return (
    <svg className={className} width="44" height="44" viewBox="0 0 44 44" fill="none">
      <circle cx="22" cy="22" r="20" stroke="currentColor" strokeWidth="2" />
      <path d="M14 22l5.5 5.5L30 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowLeftIcon({ className = '' }) {
  return (
    <svg className={`${className} rtl:scale-x-[-1]`} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8H4M4 8L7 5M4 8L7 11" />
    </svg>
  );
}

/* ─── Main Component ────────────────────────────────────────── */

export default function ContactUs() {
  const { t } = useTranslation('contact');
  const { t: tc } = useTranslation('common');
  const formRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (stored) {
      const user = JSON.parse(stored);
      setForm((prev) => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      await axios.post(`${API}/api/contact`, form);
      setStatus('sent');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.error || t('form.errorGeneric'));
    }
  };

  return (
    <div className="min-h-screen bg-sand-50">
      {/* ═══ HERO ═══════════════════════════════════════════════ */}
      <section className="relative bg-primary-950 overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-800/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-signal-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-24 pb-16 lg:pt-28 lg:pb-20 relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-primary-400 text-sm font-medium hover:text-white transition-colors mb-6"
          >
            <ArrowLeftIcon /> {tc('nav.backTo', { target: 'Zabatly' })}
          </Link>
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-extrabold text-white">Zabatly</span>
              <span className="text-2xl font-bold text-signal-500 font-arabic">زبطلي</span>
            </div>
            <h1 className="text-display text-white mb-4">
              {t('hero.title')}
            </h1>
            <p className="text-lg text-primary-300 max-w-xl leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 w-full h-6 bg-sand-50"
          style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }}
        />
      </section>

      {/* ═══ CONTACT INFO (Email + Phone) ═══════════════════════ */}
      <section className="max-w-3xl mx-auto px-6 lg:px-10 -mt-4 relative z-20 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="mailto:support@zabatly.com"
            className="flex items-center gap-4 bg-white border border-sand-200 rounded-soft px-6 py-5 hover:shadow-md hover:border-primary-200 transition-all duration-200 group"
          >
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-50 text-primary-600 group-hover:bg-primary-100 transition-colors shrink-0">
              <MailIcon />
            </span>
            <div className="min-w-0">
              <span className="text-label text-sand-500 block mb-0.5">{t('info.email')}</span>
              <span className="text-sand-900 font-semibold text-sm">support@zabatly.com</span>
            </div>
          </a>

          <a
            href="tel:+201000000000"
            className="flex items-center gap-4 bg-white border border-sand-200 rounded-soft px-6 py-5 hover:shadow-md hover:border-primary-200 transition-all duration-200 group"
          >
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-50 text-primary-600 group-hover:bg-primary-100 transition-colors shrink-0">
              <PhoneIcon />
            </span>
            <div className="min-w-0">
              <span className="text-label text-sand-500 block mb-0.5">{t('info.phone')}</span>
              <span className="text-sand-900 font-semibold text-sm" dir="ltr">+20 100 000 0000</span>
            </div>
          </a>
        </div>
      </section>

      {/* ═══ FORM ══════════════════════════════════════════════ */}
      <section className="max-w-3xl mx-auto px-6 lg:px-10 pb-20 lg:pb-28">
        <div className="bg-white border border-sand-200 rounded-soft p-8 lg:p-10">
          <h2 className="text-headline text-sand-950 mb-2">{t('form.title')}</h2>
          <p className="text-body text-sand-500 mb-8 max-w-lg">{t('form.subtitle')}</p>

          {status === 'sent' ? (
            <div className="text-center py-16" style={{ animation: 'successPop 400ms cubic-bezier(0.25, 1, 0.5, 1)' }}>
              <CheckCircleIcon className="mx-auto text-green-500 mb-5" />
              <h3 className="text-title text-sand-950 mb-2">{t('form.successTitle')}</h3>
              <p className="text-body text-sand-500 max-w-md mx-auto mb-8">{t('form.successMessage')}</p>
              <button
                onClick={() => setStatus('idle')}
                className="text-primary-600 font-semibold text-sm hover:text-primary-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
              >
                {t('form.sendAnother')}
              </button>
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Name + Email */}
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contact-name" className="text-label text-sand-700 block mb-1.5">
                    {t('form.name')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder={t('form.namePlaceholder')}
                    className="w-full border border-sand-300 rounded-subtle px-4 py-2.5 text-sm text-sand-950 bg-sand-50 placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="text-label text-sand-700 block mb-1.5">
                    {t('form.email')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder={t('form.emailPlaceholder')}
                    className="w-full border border-sand-300 rounded-subtle px-4 py-2.5 text-sm text-sand-950 bg-sand-50 placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Phone + Subject */}
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contact-phone" className="text-label text-sand-700 block mb-1.5">
                    {t('form.phone')}
                  </label>
                  <input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder={t('form.phonePlaceholder')}
                    className="w-full border border-sand-300 rounded-subtle px-4 py-2.5 text-sm text-sand-950 bg-sand-50 placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="contact-subject" className="text-label text-sand-700 block mb-1.5">
                    {t('form.subject')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="contact-subject"
                    name="subject"
                    type="text"
                    required
                    value={form.subject}
                    onChange={handleChange}
                    placeholder={t('form.subjectPlaceholder')}
                    className="w-full border border-sand-300 rounded-subtle px-4 py-2.5 text-sm text-sand-950 bg-sand-50 placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="contact-message" className="text-label text-sand-700 block mb-1.5">
                  {t('form.message')} <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows="5"
                  value={form.message}
                  onChange={handleChange}
                  placeholder={t('form.messagePlaceholder')}
                  className="w-full border border-sand-300 rounded-subtle px-4 py-3 text-sm text-sand-950 bg-sand-50 placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all resize-none"
                />
              </div>

              {/* Error state */}
              {status === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-subtle px-4 py-3 text-sm text-red-700" role="alert">
                  {errorMsg}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="inline-flex items-center gap-2.5 bg-primary-800 text-white font-semibold px-7 py-3 rounded-subtle hover:bg-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'sending' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('form.sending')}
                  </>
                ) : (
                  <>
                    <SendIcon />
                    {t('form.send')}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
