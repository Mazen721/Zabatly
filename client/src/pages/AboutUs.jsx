import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/* ─── Hooks ───────────────────────────────────────────────────── */

function useInView(opts = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: 0.15, ...opts }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ─── Icons ───────────────────────────────────────────────────── */

function ArrowLeftIcon({ className = '' }) {
  return (
    <svg className={`${className} rtl:scale-x-[-1]`} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8H4M4 8L7 5M4 8L7 11" />
    </svg>
  );
}

function ArrowRight({ className = '' }) {
  return (
    <svg className={`${className} rtl:scale-x-[-1]`} width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10H16M16 10L11 5M16 10L11 15" />
    </svg>
  );
}

/* ─── Value SVG Icons ─────────────────────────────────────────── */

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 1.5L2.75 5.5v5.5c0 4.6 3.51 8.87 8.25 10.1 4.74-1.23 8.25-5.5 8.25-10.1V5.5L11 1.5z" />
      <path d="M7.75 11L10 13.25 14.25 9" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.5 1.5L3.5 13h6l-1 7.5 9-11.5h-6l1-7.5z" />
    </svg>
  );
}

function CpuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="14" height="14" rx="2" />
      <rect x="8" y="8" width="6" height="6" rx="1" />
      <path d="M8 1.5v2.5M14 1.5v2.5M8 18v2.5M14 18v2.5M1.5 8H4M1.5 14H4M18 8h2.5M18 14h2.5" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 5.5l6.33-3.17 6.34 3.17 6.33-3.17V16.5l-6.33 3.17-6.34-3.17-6.33 3.17V5.5z" />
      <path d="M7.83 2.33v14.17M14.17 5.5v14.17" />
    </svg>
  );
}

/* ─── Why Zabatly Icons ───────────────────────────────────────── */

function SparklesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 1l2.09 5.26L18 8l-5.91 1.74L10 15l-2.09-5.26L2 8l5.91-1.74L10 1z" />
      <path d="M16 14l.74 1.86L19 16.6l-2.26.74L16 19.2l-.74-1.86L13 16.6l2.26-.74L16 14z" />
    </svg>
  );
}

function VerifiedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 1.67l2.24 1.07 2.47-.17 1.52 1.95 2.29.93-.43 2.45 1.24 2.1-1.24 2.1.43 2.45-2.29.93-1.52 1.95-2.47-.17L10 18.33l-2.24-1.07-2.47.17-1.52-1.95-2.29-.93.43-2.45L.67 10l1.24-2.1-.43-2.45 2.29-.93 1.52-1.95 2.47.17L10 1.67z" />
      <path d="M7 10l2 2 4-4" />
    </svg>
  );
}

function SteeringIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="8" />
      <circle cx="10" cy="10" r="1.5" />
      <path d="M10 2v6.5M2.5 12.5h5M12.5 12.5h5" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 1.83l7.17 7.17a1.5 1.5 0 010 2.12l-5.88 5.88a1.5 1.5 0 01-2.12 0L2.83 9.83A1.5 1.5 0 012.4 8.8L3 2.5 9.2 1.9a1.5 1.5 0 011.8.93z" />
      <circle cx="6.5" cy="6.5" r="1" />
    </svg>
  );
}

/* ─── Main Component ────────────────────────────────────────── */

export default function AboutUs() {
  const { t } = useTranslation('about');
  const { t: tc } = useTranslation('common');

  const [storyRef, storyVisible] = useInView();
  const [whyRef, whyVisible] = useInView();
  const [valuesRef, valuesVisible] = useInView();
  const [ctaRef, ctaVisible] = useInView();

  const VALUES = [
    { icon: <ShieldIcon />, title: t('values.trustTitle'), desc: t('values.trustDesc') },
    { icon: <BoltIcon />, title: t('values.speedTitle'), desc: t('values.speedDesc') },
    { icon: <CpuIcon />, title: t('values.aiTitle'), desc: t('values.aiDesc') },
    { icon: <MapIcon />, title: t('values.localTitle'), desc: t('values.localDesc') },
  ];

  const WHY_ITEMS = [
    { icon: <SparklesIcon />, title: t('why.item1Title'), desc: t('why.item1Desc') },
    { icon: <VerifiedIcon />, title: t('why.item2Title'), desc: t('why.item2Desc') },
    { icon: <SteeringIcon />, title: t('why.item3Title'), desc: t('why.item3Desc') },
    { icon: <TagIcon />, title: t('why.item4Title'), desc: t('why.item4Desc') },
  ];

  return (
    <div className="min-h-screen bg-sand-50">
      {/* ═══ HERO ═══════════════════════════════════════════════ */}
      <section className="relative bg-primary-950 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-800/20 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-[20%] w-[350px] h-[350px] bg-signal-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-24 pb-20 lg:pt-28 lg:pb-28 relative z-10">
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
            <h1 className="text-display text-white mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-lg text-primary-300 leading-relaxed max-w-2xl">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 w-full h-6 bg-sand-50"
          style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }}
        />
      </section>

      {/* ═══ OUR STORY ═════════════════════════════════════════ */}
      <section ref={storyRef} className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center reveal ${storyVisible ? 'visible' : ''}`}>
          <div>
            <span className="text-label text-signal-500 uppercase tracking-wider font-semibold mb-3 block">{t('story.label')}</span>
            <h2 className="text-headline text-sand-950 mb-6">{t('story.title')}</h2>
            <div className="space-y-4 text-body text-sand-600 leading-relaxed">
              <p>{t('story.p1')}</p>
              <p>{t('story.p2')}</p>
              <p>{t('story.p3')}</p>
            </div>
          </div>
          <div className="relative">
            <div className="bg-primary-950 rounded-soft p-8 lg:p-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl font-extrabold text-white">Zabatly</span>
                <span className="text-xl font-bold text-signal-500 font-arabic">زبطلي</span>
              </div>
              <blockquote className="text-primary-200 text-lg leading-relaxed italic mb-6">
                "{t('story.quote')}"
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-signal-500/20 flex items-center justify-center text-signal-400 font-bold text-sm">Z</div>
                <div>
                  <p className="text-white font-semibold text-sm">{t('story.quoteAuthor')}</p>
                  <p className="text-primary-400 text-xs">{t('story.quoteRole')}</p>
                </div>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 rtl:-right-auto rtl:-left-3 w-20 h-20 bg-signal-500/20 rounded-full blur-xl pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ═══ WHY ZABATLY ═══════════════════════════════════════ */}
      <section ref={whyRef} className="bg-primary-950 py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-800/30 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
          <div className={`mb-14 max-w-2xl reveal ${whyVisible ? 'visible' : ''}`}>
            <span className="text-label text-signal-500 uppercase tracking-wider font-semibold mb-3 block">{t('why.label')}</span>
            <h2 className="text-headline text-white mb-3">{t('why.title')}</h2>
            <p className="text-body text-primary-300">{t('why.subtitle')}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
            {WHY_ITEMS.map((item, i) => (
              <div
                key={i}
                className={`bg-primary-900/60 border border-primary-800/50 rounded-soft p-7 hover:bg-primary-900/80 transition-all duration-300 reveal reveal-delay-${i < 3 ? i + 1 : 3} ${whyVisible ? 'visible' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-signal-500/15 text-signal-400 shrink-0 mt-0.5">
                    {item.icon}
                  </span>
                  <div>
                    <h3 className="text-white font-semibold text-[1.05rem] mb-1.5">{item.title}</h3>
                    <p className="text-primary-300 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ OUR VALUES ════════════════════════════════════════ */}
      <section ref={valuesRef} className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className={`text-center mb-14 reveal ${valuesVisible ? 'visible' : ''}`}>
            <span className="text-label text-signal-500 uppercase tracking-wider font-semibold mb-3 block">{t('values.label')}</span>
            <h2 className="text-headline text-sand-950 mb-3">{t('values.title')}</h2>
            <p className="text-body text-sand-500 max-w-lg mx-auto">{t('values.subtitle')}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((item, i) => (
              <div
                key={i}
                className={`bg-white border border-sand-200 rounded-soft p-7 hover:shadow-lg hover:border-primary-200 transition-all duration-300 group reveal reveal-delay-${i < 3 ? i + 1 : 3} ${valuesVisible ? 'visible' : ''}`}
              >
                <span className="flex items-center justify-center w-11 h-11 rounded-full bg-primary-50 text-primary-600 mb-4 group-hover:bg-primary-100 transition-colors">
                  {item.icon}
                </span>
                <h3 className="text-title text-sand-950 mb-2 group-hover:text-primary-700 transition-colors">{item.title}</h3>
                <p className="text-sm text-sand-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══════════════════════════════════════════════ */}
      <section ref={ctaRef} className="bg-sand-100/60 py-20 lg:py-24">
        <div className={`max-w-3xl mx-auto px-6 lg:px-10 text-center reveal ${ctaVisible ? 'visible' : ''}`}>
          <h2 className="text-headline text-sand-950 mb-4">{t('cta.title')}</h2>
          <p className="text-lg text-sand-500 mb-8 max-w-xl mx-auto">{t('cta.subtitle')}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 bg-primary-800 text-white font-semibold px-7 py-3 rounded-subtle hover:bg-primary-900 transition-colors duration-200"
            >
              {t('cta.browseCars')} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-transparent text-sand-950 border-2 border-sand-300 font-semibold px-7 py-3 rounded-subtle hover:border-primary-400 hover:text-primary-800 transition-colors duration-200"
            >
              {t('cta.contactUs')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
