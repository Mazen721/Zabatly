import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

/* ─── Data ────────────────────────────────────────────────────────── */

const STEPS = [
  { num: '01', title: 'Tell us what you need', desc: 'Share your trip details, preferences, and budget. Takes less than a minute.' },
  { num: '02', title: 'We find your perfect match', desc: 'Our AI analyzes hundreds of options and picks the best vehicles and drivers for you.' },
  { num: '03', title: 'Book and drive', desc: 'Confirm your booking, pick up your car, and enjoy the journey. We handle the rest.' },
];


const AI_RESULTS = [
  { name: 'Hyundai Elantra 2024', reason: 'Best value for coastal trips', price: 1200, match: 96 },
  { name: 'Toyota Corolla 2024', reason: 'Highest rated by similar renters', price: 1100, match: 93 },
  { name: 'Kia Cerato 2024', reason: 'Available this weekend', price: 1050, match: 89 },
];

const FAQ_DATA = [
  { q: 'How does booking work?', a: 'Browse vehicles, pick your dates, and confirm. You can pay online or on pickup. The whole process takes under two minutes.' },
  { q: 'What documents do I need?', a: 'A valid national ID or passport, and a driver\'s license. We verify your identity through our secure OCR system during registration.' },
  { q: 'Can I choose my own driver?', a: 'Yes. Browse driver profiles with ratings and reviews, or let our AI recommend the best match based on your trip type and preferences.' },
  { q: 'What\'s the cancellation policy?', a: 'Free cancellation up to 48 hours before your pickup time. After that, a small fee applies. No hidden charges.' },
  { q: 'How does pricing work?', a: 'Prices are per day and shown upfront with no hidden fees. The total includes insurance and basic coverage. Extra services are clearly listed.' },
  { q: 'Is my data safe?', a: 'Your identity documents are processed securely and never shared. We use encrypted storage and follow data protection best practices.' },
];

/* ─── Hooks ───────────────────────────────────────────────────────── */

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

/* ─── Icons (inline SVG) ──────────────────────────────────────────── */

function ChevronDown({ className = '' }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 7.5L10 12.5L15 7.5" />
    </svg>
  );
}

function ArrowRight({ className = '' }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10H16M16 10L11 5M16 10L11 15" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M7 1l1.76 3.57 3.94.57-2.85 2.78.67 3.93L7 10.27 3.48 11.85l.67-3.93L1.3 5.14l3.94-.57z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1.5L2.25 4.5v4.5c0 3.75 2.87 7.25 6.75 8.25 3.88-1 6.75-4.5 6.75-8.25V4.5L9 1.5z" />
      <path d="M6.5 9L8.25 10.75 11.5 7.5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="7.5" />
      <path d="M9 4.5V9l3 1.5" />
    </svg>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 15.37C-4.5 7.5 4.5 0 9 4.84 13.5 0 22.5 7.5 9 15.37z" />
    </svg>
  );
}

const ARABIC_FONT = "'Cairo', 'system-ui', sans-serif";
const API = 'http://localhost:5000';

function getProfilePictureUrl(path) {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API}${path}`;
}

function ProfileAvatar({ user }) {
  const src = getProfilePictureUrl(user?.profilePicture);

  return (
    <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-sand-200 bg-sand-100 text-primary-800">
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="5" r="3" />
          <path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" />
        </svg>
      )}
    </span>
  );
}

function CircularArabicBadge({ className = '' }) {
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <svg viewBox="0 0 200 200" className="w-full h-full animate-[spin_20s_linear_infinite]">
        <defs>
          <path id="circlePath" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" fill="none" />
        </defs>
        <text fill="#1b2b44" fontSize="14.5" fontWeight="700" letterSpacing="2" style={{ fontFamily: ARABIC_FONT }}>
          <textPath href="#circlePath" startOffset="0%" textLength="502" lengthAdjust="spacing">
            سيارتك شروطك · اطلب دلوقتي · سيارتك شروطك · اطلب دلوقتي ·
          </textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center leading-tight" style={{ fontFamily: ARABIC_FONT }}>
          <span className="block text-primary-800 font-black text-xl">زبطلي</span>
          <span className="block text-primary-800 font-extrabold text-sm">و ريح</span>
          <span className="block text-primary-800 font-extrabold text-sm">بالي</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────── */

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="border-b border-sand-200 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span className="text-title text-sand-950 group-hover:text-primary-600 transition-colors duration-200">{item.q}</span>
        <ChevronDown className={`text-sand-400 shrink-0 ml-4 transition-transform duration-300 ease-out-quart ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out-quart"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="text-body text-sand-600 pb-5 max-w-[65ch]">{item.a}</p>
        </div>
      </div>
    </div>
  );
}

function VehicleCard({ vehicle }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const imgSrc = vehicle.images && vehicle.images.length > 0
    ? `http://localhost:5000${vehicle.images[0]}`
    : null;

  return (
    <Link to={`/vehicles/${vehicle._id}`} className="group flex-shrink-0 w-[280px] snap-start block">
      <div className="relative overflow-hidden rounded-soft bg-sand-100 aspect-[4/3] mb-3">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 bg-sand-200 animate-pulse" />
        )}
        {imgSrc && !imgError ? (
          <img
            src={imgSrc}
            alt={`${vehicle.make} ${vehicle.model}`}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover object-center transition-opacity duration-200 ease-out-quart ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : (
          <div className="absolute inset-0 bg-sand-200 flex items-center justify-center text-sand-400">
            <span className="text-sm">Photo unavailable</span>
          </div>
        )}
        <span className="absolute top-3 left-3 bg-sand-50/90 text-sand-700 text-xs font-semibold px-2.5 py-1 rounded-subtle backdrop-blur-sm">
          {vehicle.type || 'Car'}
        </span>
        {!vehicle.isAvailable && (
          <div className="absolute inset-0 bg-sand-50/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-sand-900 text-white text-xs font-bold px-3 py-1.5 rounded-subtle">Rented</span>
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-sand-950 text-[0.95rem] leading-tight">{vehicle.make} {vehicle.model}</h3>
          <div className="flex items-center gap-2 mt-1 text-sand-500 text-xs">
            <span>{vehicle.capacity} seats</span>
            <span>·</span>
            <span>{vehicle.transmission || 'Automatic'}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-primary-700 font-bold text-lg">{vehicle.price_per_day?.toLocaleString()}</span>
          <span className="text-sand-400 text-xs block">EGP / day</span>
        </div>
      </div>
    </Link>
  );
}

/* ─── Main Landing Component ──────────────────────────────────────── */

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null);
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const scrollRef = useRef(null);

  const [stepsRef, stepsVisible] = useInView();
  const [aiRef, aiVisible] = useInView();
  const [vehiclesRef, vehiclesVisible] = useInView();
  const [faqRef, faqVisible] = useInView();

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/vehicles');
        setVehicles(data);
      } catch (err) {
        console.error('Failed to fetch vehicles:', err);
      } finally {
        setVehiclesLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const scrollVehicles = useCallback((dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
  }, []);

  const dashboardRoles = ['agency', 'admin', 'driver'];
  const primaryCtaTarget = user
    ? dashboardRoles.includes(user.role)
      ? user.role === 'admin'
        ? '/admin'
        : '/dashboard'
      : '/explore'
    : '/register';
  const primaryCtaLabel = user
    ? dashboardRoles.includes(user.role)
      ? 'Go To Dashboard'
      : 'Rent a car'
    : 'Book now';

  return (
    <div className="bg-sand-50 text-sand-950 overflow-x-hidden">

      {/* ═══ NAVBAR ═══════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-sand-50/90 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-[1.35rem] font-extrabold text-primary-800 tracking-tight">Zabatly</span>
            <span className="text-[1.35rem] font-bold text-signal-500" style={{ fontFamily: ARABIC_FONT }}>زبطلي</span>
          </Link>
          <div className="hidden md:flex items-center gap-7">
            <Link to="/explore" className="text-[0.82rem] font-medium text-sand-700 hover:text-primary-700 transition-colors">Browse Cars</Link>
            <a href="#how-it-works" className="text-[0.82rem] font-medium text-sand-700 hover:text-primary-700 transition-colors">How it works</a>
            <a href="#" className="text-[0.82rem] font-medium text-sand-700 hover:text-primary-700 transition-colors">about us</a>
            <a href="#faq" className="text-[0.82rem] font-medium text-sand-700 hover:text-primary-700 transition-colors">Help</a>
          </div>
          <div className="flex items-center">
            {user ? (
              <Link to="/profile" className="flex items-center gap-1.5 text-[0.82rem] font-medium text-sand-700 hover:text-primary-700 transition-colors" aria-label="Open profile settings">
                <ProfileAvatar user={user} />
                {user.name}
              </Link>
            ) : (
              <Link to="/login" className="flex items-center gap-1.5 bg-primary-800 text-white text-[0.82rem] font-semibold px-4 py-2 rounded-subtle hover:bg-primary-900 transition-colors duration-200">
                Log in
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="5" r="3" /><path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" /></svg>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ═══ HERO ════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[85vh] lg:min-h-[92vh] flex items-center overflow-hidden">
        {/* Right image — extends behind navbar, full height, aggressive polygon cut */}
        <div
          className="absolute top-0 right-0 w-[55%] h-full hidden lg:block"
          style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)' }}
        >
          <img
            src="/Zabatlyimage.png"
            alt="Young Egyptians enjoying a day out by their car in Cairo"
            className="w-full h-full object-cover"
            fetchPriority="high"
          />
          <span
            className="absolute bottom-6 left-0 right-0 text-center text-[7rem] lg:text-[9rem] xl:text-[11rem] font-black text-signal-500 leading-none pointer-events-none select-none"
            aria-hidden="true"
            style={{ fontFamily: ARABIC_FONT, opacity: 0.85 }}
          >
            زبطلى
          </span>
        </div>

        {/* Circular Arabic Badge — between text and image, upper area */}
        <div className="hidden lg:block absolute top-[11%] left-[38%] xl:left-[40%] z-30">
          <CircularArabicBadge className="w-36 h-36 xl:w-40 xl:h-40" />
        </div>

        {/* Left content */}
        <div className="relative z-20 max-w-[1400px] mx-auto px-6 lg:px-10 w-full pt-20 pb-10 lg:pt-0 lg:pb-0">
          <div className="lg:max-w-[42%]">
            <h1 className="text-[clamp(2.75rem,6vw+0.5rem,5rem)] font-extrabold text-primary-800 leading-[1.05] tracking-tight mb-4">
              <span className="text-signal-500">Zabatly</span> <br /> Consider<br />it done<span className="text-signal-500">.</span>
            </h1>

            <p className="text-[1.05rem] text-primary-950 font-medium max-w-[280px] mb-8 leading-[1.4]">
              {user
                ? <>Welcome back, <span className="font-bold text-primary-900">{user.name}</span>.<br />Ready for your next ride?</>
                : <>Rent a car on your terms.<br />Simple, fast, and hassle-free.</>}
            </p>

            <div className="flex flex-wrap items-center gap-6 mb-10">
              <Link
                to={primaryCtaTarget}
                className="bg-primary-800 text-white border-2 border-primary-800 font-semibold px-8 py-3 rounded-subtle hover:bg-transparent hover:text-primary-800 transition-colors duration-200 flex items-center justify-between w-[200px] shadow-md"
              >
                <span>{primaryCtaLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#featured-vehicles"
                className="text-signal-500 font-semibold hover:text-signal-600 transition-colors duration-200 border-b-2 border-signal-300 pb-0.5"
              >
                Browse cars
              </a>
            </div>

            <div className="flex items-center gap-0 text-primary-800 text-sm">
              <span className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-signal-500 text-primary-900">
                  <ShieldIcon />
                </span>
                <span className="font-medium leading-tight">Insured<br />and safe</span>
              </span>
              <span className="mx-4 h-8 w-px bg-sand-300" aria-hidden="true" />
              <span className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-signal-500 text-primary-900">
                  <ClockIcon />
                </span>
                <span className="font-medium leading-tight">24/7<br />Support</span>
              </span>
              <span className="hidden sm:block mx-4 h-8 w-px bg-sand-300" aria-hidden="true" />
              <span className="hidden sm:flex items-center gap-2.5">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-signal-500 text-primary-900">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="14" height="10" rx="2" /><path d="M6 8h6M6 11h4" /></svg>
                </span>
                <span className="font-medium leading-tight">Flexible<br />Rental</span>
              </span>
            </div>
          </div>
        </div>

        {/* Mobile hero image */}
        <div className="lg:hidden absolute bottom-0 right-0 w-full h-[40%] -z-10">
          <div className="w-full h-full" style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)' }}>
            <img
              src="/Zabatlyimage.png"
              alt="Young Egyptians enjoying a day out by their car in Cairo"
              className="w-full h-full object-cover"
              fetchPriority="high"
            />
          </div>
          <span
            className="absolute bottom-4 right-4 text-[3.5rem] font-black text-signal-500/60 select-none pointer-events-none leading-none"
            aria-hidden="true"
            style={{ fontFamily: ARABIC_FONT }}
          >
            زبطلى
          </span>
        </div>

        {/* Mobile circular badge */}
        <div className="lg:hidden absolute top-20 right-6 z-20">
          <CircularArabicBadge className="w-24 h-24" />
        </div>
      </section>

      {/* ═══ HOW IT WORKS ════════════════════════════════════════ */}
      <section id="how-it-works" ref={stepsRef} className="relative pb-20 pt-10 lg:pb-28 lg:pt-16 bg-sand-100/60">
        {/* ═══ ORANGE DIVIDER LINE (Sharp wedge, overlapping) ═══ */}
        <div
          className="absolute top-0 left-0 w-full h-5 sm:h-8 lg:h-10 bg-signal-500 z-10"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 20%, 0 100%)' }}
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-6">
          <div className={`text-center mb-14 reveal ${stepsVisible ? 'visible' : ''}`}>
            <h2 className="text-headline text-sand-950 mb-3">Three simple steps</h2>
            <p className="text-body text-sand-500 max-w-md mx-auto">From search to steering wheel in under two minutes.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className={`reveal reveal-delay-${i + 1} ${stepsVisible ? 'visible' : ''}`}
              >
                <span className="text-5xl font-extrabold text-primary-200 mb-4 block">{step.num}</span>
                <h3 className="text-title text-sand-950 mb-2">{step.title}</h3>
                <p className="text-body text-sand-500 max-w-[40ch]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AI SHOWCASE (THE PEAK) ══════════════════════════════ */}
      <section ref={aiRef} className="py-20 lg:py-28 bg-primary-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-800/30 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className={`mb-14 max-w-2xl reveal ${aiVisible ? 'visible' : ''}`}>
            <h2 className="text-headline text-white mb-3">
              Tell us what you need.
            </h2>
            <p className="text-lg text-primary-300">
              We match you with the right car based on your trip, your budget, and what renters like you loved most.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">

            {/* Left: User input simulation */}
            <div className={`reveal reveal-delay-1 ${aiVisible ? 'visible' : ''}`}>
              <div className="bg-primary-900/60 border border-primary-800/50 rounded-soft p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-signal-500/20 flex items-center justify-center text-signal-400 text-sm font-bold">Y</div>
                  <span className="text-label text-primary-400">You</span>
                </div>
                <p className="text-white/90 leading-relaxed">
                  I need a car for a weekend trip to Ain Sokhna. Two passengers, automatic transmission, something budget-friendly with good reviews.
                </p>
              </div>

              <div className="mt-4 bg-primary-900/60 border border-primary-800/50 rounded-soft p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">Z</div>
                  <span className="text-label text-primary-400">Zabatly</span>
                </div>
                <p className="text-white/90 leading-relaxed">
                  Found 3 great options for your Ain Sokhna weekend. All automatic, well-reviewed, and within your budget. Here are my top picks:
                </p>
              </div>
            </div>

            {/* Right: AI Results */}
            <div className={`space-y-3 reveal reveal-delay-2 ${aiVisible ? 'visible' : ''}`}>
              {AI_RESULTS.map((r, i) => (
                <div key={i} className="bg-primary-900/60 border border-primary-800/50 rounded-soft p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-subtle bg-primary-800/50 flex items-center justify-center shrink-0">
                    <span className="text-primary-300 font-bold text-sm">{r.match}%</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-sm">{r.name}</h4>
                    <p className="text-primary-400 text-sm">{r.reason}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-signal-400 font-bold">{r.price.toLocaleString()}</span>
                    <span className="text-primary-500 text-xs block">EGP/day</span>
                  </div>
                </div>
              ))}

              <Link
                to="/explore"
                className="inline-flex items-center gap-2 text-signal-400 font-semibold text-sm mt-4 hover:text-signal-300 transition-colors"
              >
                Try it yourself <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURED VEHICLES ═══════════════════════════════════ */}
      <section id="featured-vehicles" ref={vehiclesRef} className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className={`flex items-end justify-between mb-10 reveal ${vehiclesVisible ? 'visible' : ''}`}>
            <div>
              <h2 className="text-headline text-sand-950 mb-2">Featured vehicles</h2>
              <p className="text-body text-sand-500">Top picks rated by real renters.</p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Link to="/explore" className="text-primary-600 text-label font-semibold hover:text-primary-700 transition-colors mr-4">
                View all
              </Link>
              <button
                onClick={() => scrollVehicles(-1)}
                className="w-10 h-10 rounded-full border border-sand-300 flex items-center justify-center text-sand-600 hover:border-primary-600 hover:text-primary-600 transition-colors"
                aria-label="Scroll left"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
              <button
                onClick={() => scrollVehicles(1)}
                className="w-10 h-10 rounded-full border border-sand-300 flex items-center justify-center text-sand-600 hover:border-primary-600 hover:text-primary-600 transition-colors"
                aria-label="Scroll right"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {vehiclesLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : vehicles.length === 0 ? (
            <div className={`text-center py-12 reveal reveal-delay-1 ${vehiclesVisible ? 'visible' : ''}`}>
              <p className="text-sand-500">No vehicles available right now. Check back soon.</p>
            </div>
          ) : (
            <div
              ref={scrollRef}
              className={`flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 reveal reveal-delay-1 ${vehiclesVisible ? 'visible' : ''}`}
            >
              {vehicles.map((v) => (
                <VehicleCard key={v._id} vehicle={v} />
              ))}
            </div>
          )}

          <div className="mt-6 md:hidden text-center">
            <Link to="/explore" className="text-primary-600 text-label font-semibold hover:text-primary-700 transition-colors">
              View all vehicles <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═════════════════════════════════════════════════ */}
      <section id="faq" ref={faqRef} className="py-20 lg:py-28 bg-sand-100/60">
        <div className="max-w-3xl mx-auto px-6">
          <div className={`text-center mb-12 reveal ${faqVisible ? 'visible' : ''}`}>
            <h2 className="text-headline text-sand-950 mb-3">Common questions</h2>
            <p className="text-body text-sand-500">Everything you need to know before your first ride.</p>
          </div>

          <div className={`bg-sand-50 rounded-soft border border-sand-200 px-6 lg:px-8 reveal reveal-delay-1 ${faqVisible ? 'visible' : ''}`}>
            {FAQ_DATA.map((item, i) => (
              <FaqItem
                key={i}
                item={item}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ══════════════════════════════════════════════ */}
      <footer className="bg-primary-950 text-primary-300 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="text-2xl font-extrabold text-white">Zabatly</span>
                <span className="text-xl font-bold text-signal-500" style={{ fontFamily: ARABIC_FONT }}>زبطلي</span>
              </div>
              <p className="text-sm text-primary-400 max-w-[30ch] leading-relaxed">
                Smart vehicle rentals and transportation, built for Egypt.
              </p>
            </div>

            <div>
              <h4 className="text-white text-label font-semibold mb-4 tracking-wide uppercase text-xs">Product</h4>
              <ul className="space-y-2.5">
                <li><Link to="/explore" className="text-sm text-primary-400 hover:text-white transition-colors">Browse vehicles</Link></li>
                <li><Link to="/drivers" className="text-sm text-primary-400 hover:text-white transition-colors">Find a driver</Link></li>
                <li><Link to="/register" className="text-sm text-primary-400 hover:text-white transition-colors">List your vehicle</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-label font-semibold mb-4 tracking-wide uppercase text-xs">Company</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-sm text-primary-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#how-it-works" className="text-sm text-primary-400 hover:text-white transition-colors">How it works</a></li>
                <li><a href="#" className="text-sm text-primary-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-label font-semibold mb-4 tracking-wide uppercase text-xs">Legal</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-sm text-primary-400 hover:text-white transition-colors">Privacy policy</a></li>
                <li><a href="#" className="text-sm text-primary-400 hover:text-white transition-colors">Terms of service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-primary-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-primary-500">
              &copy; {new Date().getFullYear()} Zabatly. Computer Science Graduation Project 2026.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-primary-600">EG</span>
              <span className="text-xs text-primary-700">|</span>
              <span className="text-xs text-primary-500">English</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
