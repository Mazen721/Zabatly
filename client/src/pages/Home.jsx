import { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const TYPES = [
  { value: 'all', label: 'All types' },
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
];

const TRANSMISSIONS = [
  { value: 'all', label: 'Any' },
  { value: 'automatic', label: 'Automatic' },
  { value: 'manual', label: 'Manual' },
];

const PRICE_MIN = 0;
const PRICE_MAX = 10000;

function isRecommended(v) {
  if (!v.isAvailable) return false;
  return (
    (v.rating >= 4 ? 2 : 0) +
    (v.numReviews >= 3 ? 1 : 0) +
    (v.transmission === 'automatic' ? 1 : 0) +
    (v.ac ? 1 : 0)
  ) >= 3;
}

function matchPrice(price, range) {
  return price >= range[0] && price <= range[1];
}

/* ── Image Carousel ───────────────────────────────────────────── */

function ImageCarousel({ images, alt }) {
  const [idx, setIdx] = useState(0);
  const [err, setErr] = useState(false);
  const multi = images && images.length > 1;

  const prev = (e) => { e.preventDefault(); e.stopPropagation(); setIdx((i) => (i === 0 ? images.length - 1 : i - 1)); setErr(false); };
  const next = (e) => { e.preventDefault(); e.stopPropagation(); setIdx((i) => (i === images.length - 1 ? 0 : i + 1)); setErr(false); };

  const src = !err && images?.length > 0 ? `http://localhost:5000${images[idx]}` : null;

  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-sand-100 group/img">
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover object-center transition-opacity duration-200 ease-out-quart" onError={() => setErr(true)} loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-sand-400 text-sm">Photo unavailable</div>
      )}
      {multi && (
        <>
          <button onClick={prev} aria-label="Previous image" className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-sand-50/90 flex items-center justify-center text-sand-700 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 z-10">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 3L5 8l5 5" /></svg>
          </button>
          <button onClick={next} aria-label="Next image" className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-sand-50/90 flex items-center justify-center text-sand-700 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 z-10">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 3l5 5-5 5" /></svg>
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, i) => (
              <span key={i} className={`h-1 rounded-full transition-all duration-200 ${i === idx ? 'bg-sand-50 w-3' : 'bg-sand-50/50 w-1'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Skeleton Card ────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="rounded-soft overflow-hidden border border-sand-100">
      <div className="aspect-[4/3] bg-sand-200 animate-pulse" />
      <div className="p-4 space-y-2.5">
        <div className="h-4 bg-sand-200 rounded animate-pulse w-3/4" />
        <div className="h-3.5 bg-sand-200 rounded animate-pulse w-1/2" />
        <div className="flex gap-2 mt-2">
          <div className="h-5 bg-sand-200 rounded animate-pulse w-14" />
          <div className="h-5 bg-sand-200 rounded animate-pulse w-14" />
        </div>
        <div className="h-9 bg-sand-200 rounded-subtle animate-pulse w-full mt-3" />
      </div>
    </div>
  );
}

/* ── Vehicle Card ─────────────────────────────────────────────── */

function VehicleCard({ vehicle, recommended }) {
  return (
    <Link
      to={`/vehicles/${vehicle._id}`}
      className="group block rounded-soft overflow-hidden border border-sand-200 bg-sand-50 hover:border-sand-300 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-sand-200/40"
    >
      <div className="relative">
        <ImageCarousel images={vehicle.images} alt={`${vehicle.make} ${vehicle.model}`} />
        <span className="absolute top-2.5 left-2.5 bg-sand-50/90 backdrop-blur-sm px-2 py-0.5 rounded text-[0.6875rem] font-semibold text-sand-700 capitalize z-10">
          {vehicle.type}
        </span>
        {recommended && (
          <span className="absolute top-2.5 right-2.5 bg-signal-500 text-primary-950 px-2 py-0.5 rounded text-[0.6875rem] font-bold z-10">
            Recommended
          </span>
        )}
        {!vehicle.isAvailable && (
          <div className="absolute inset-0 bg-sand-50/70 backdrop-blur-[2px] z-20 flex items-center justify-center">
            <span className="bg-primary-800 text-white px-4 py-1.5 rounded-subtle text-xs font-bold">Rented</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="min-w-0">
            <h3 className="text-[0.95rem] font-semibold text-sand-950 truncate leading-tight">{vehicle.make} {vehicle.model}</h3>
            <p className="text-[0.75rem] text-sand-500 mt-0.5 truncate">{vehicle.address || 'Alexandria'}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[0.95rem] font-bold text-primary-800">{vehicle.price_per_day}</span>
            <span className="text-[0.7rem] text-sand-500 ml-0.5">EGP/day</span>
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap mb-3">
          <span className="text-[0.7rem] text-sand-600 bg-sand-100 px-1.5 py-0.5 rounded">{vehicle.transmission === 'automatic' ? 'Auto' : 'Manual'}</span>
          <span className="text-[0.7rem] text-sand-600 bg-sand-100 px-1.5 py-0.5 rounded">{vehicle.capacity} seats</span>
          {vehicle.has_driver && (
            <span className="text-[0.7rem] text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded font-medium">+ Driver</span>
          )}
        </div>

        {vehicle.isAvailable ? (
          <div className="w-full text-center bg-primary-800 text-white py-2 rounded-subtle text-[0.8rem] font-semibold group-hover:bg-primary-900 transition-colors duration-150">
            View details
          </div>
        ) : (
          <div className="w-full text-center bg-sand-200 text-sand-500 py-2 rounded-subtle text-[0.8rem] font-medium">
            Unavailable
          </div>
        )}
      </div>
    </Link>
  );
}

/* ── Filter Section Component ─────────────────────────────────── */

function FilterSection({ title, children }) {
  return (
    <div className="mb-5">
      <h3 className="text-[0.75rem] font-semibold text-sand-500 uppercase tracking-wide mb-2">{title}</h3>
      {children}
    </div>
  );
}

function RadioGroup({ options, value, onChange }) {
  return (
    <div className="space-y-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`w-full text-left px-3 py-1.5 rounded-subtle text-[0.8rem] transition-colors duration-100 ${
            opt.value === value
              ? 'bg-primary-800 text-white font-semibold'
              : 'text-sand-700 hover:bg-sand-100'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function PriceSlider({ value, onChange }) {
  const [min, max] = value;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={PRICE_MIN}
          max={max}
          value={min}
          onChange={(e) => onChange([Math.min(Number(e.target.value), max), max])}
          className="w-full bg-sand-100 border border-sand-200 text-sand-950 rounded-subtle px-2 py-1.5 text-[0.8rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
          placeholder="Min"
        />
        <span className="text-sand-400 text-[0.75rem] shrink-0">to</span>
        <input
          type="number"
          min={min}
          max={PRICE_MAX}
          value={max}
          onChange={(e) => onChange([min, Math.max(Number(e.target.value), min)])}
          className="w-full bg-sand-100 border border-sand-200 text-sand-950 rounded-subtle px-2 py-1.5 text-[0.8rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
          placeholder="Max"
        />
      </div>
      <input
        type="range"
        min={PRICE_MIN}
        max={PRICE_MAX}
        step={50}
        value={max}
        onChange={(e) => onChange([min, Number(e.target.value)])}
        className="w-full h-1.5 bg-sand-200 rounded-full appearance-none cursor-pointer accent-primary-800"
      />
      <div className="flex justify-between text-[0.7rem] text-sand-400">
        <span>{min} EGP</span>
        <span>{max} EGP</span>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────── */

export default function Home() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [transmissionFilter, setTransmissionFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([PRICE_MIN, PRICE_MAX]);
  const [locationFilter, setLocationFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/vehicles');
        setVehicles(data);
      } catch {
        setError('Could not load vehicles. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const locations = useMemo(() => {
    const set = new Set();
    vehicles.forEach((v) => {
      const loc = v.address || v.location?.city;
      if (loc) set.add(loc);
    });
    return [{ value: 'all', label: 'Any location' }, ...Array.from(set).map((l) => ({ value: l, label: l }))];
  }, [vehicles]);

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      if (search) {
        const q = search.toLowerCase();
        if (!`${v.make} ${v.model}`.toLowerCase().includes(q)) return false;
      }
      if (typeFilter !== 'all' && v.type !== typeFilter) return false;
      if (transmissionFilter !== 'all' && v.transmission !== transmissionFilter) return false;
      if (!matchPrice(v.price_per_day, priceRange)) return false;
      if (locationFilter !== 'all') {
        if ((v.address || v.location?.city || '') !== locationFilter) return false;
      }
      return true;
    });
  }, [vehicles, search, typeFilter, transmissionFilter, priceRange, locationFilter]);

  const priceChanged = priceRange[0] !== PRICE_MIN || priceRange[1] !== PRICE_MAX;
  const activeCount = [typeFilter, transmissionFilter, locationFilter].filter((f) => f !== 'all').length + (priceChanged ? 1 : 0);

  const clearAll = useCallback(() => {
    setSearch('');
    setTypeFilter('all');
    setTransmissionFilter('all');
    setPriceRange([PRICE_MIN, PRICE_MAX]);
    setLocationFilter('all');
  }, []);

  const filterContent = (
    <>
      {/* Search inside sidebar */}
      <div className="mb-5">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400 pointer-events-none" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="8.5" cy="8.5" r="5.5" /><path d="M13 13l4 4" />
          </svg>
          <input
            type="text"
            placeholder="Search make or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle pl-9 pr-3 py-2 text-[0.8rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors"
          />
        </div>
      </div>

      <FilterSection title="Vehicle Type">
        <RadioGroup options={TYPES} value={typeFilter} onChange={setTypeFilter} />
      </FilterSection>

      <FilterSection title="Price Range">
        <PriceSlider value={priceRange} onChange={setPriceRange} />
      </FilterSection>

      <FilterSection title="Transmission">
        <RadioGroup options={TRANSMISSIONS} value={transmissionFilter} onChange={setTransmissionFilter} />
      </FilterSection>

      <FilterSection title="Location">
        <RadioGroup options={locations} value={locationFilter} onChange={setLocationFilter} />
      </FilterSection>

      {activeCount > 0 && (
        <button onClick={clearAll} className="w-full text-center text-[0.8rem] text-primary-700 font-medium hover:text-primary-800 transition-colors py-2 mt-1">
          Clear all filters
        </button>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-6 pb-16">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[1.5rem] font-bold text-sand-950 leading-tight">Explore Fleet</h1>
            {!loading && !error && (
              <p className="text-[0.8rem] text-sand-500 mt-1">{filtered.length} {filtered.length === 1 ? 'vehicle' : 'vehicles'} available</p>
            )}
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center gap-1.5 bg-sand-100 border border-sand-200 text-sand-700 text-[0.8rem] font-medium px-3 py-2 rounded-subtle"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h12M4 8h8M6 12h4" /></svg>
            Filters{activeCount > 0 && <span className="bg-primary-800 text-white text-[0.6rem] font-bold rounded-full w-4 h-4 flex items-center justify-center">{activeCount}</span>}
          </button>
        </div>

        <div className="flex gap-8">

          {/* ─── Left sidebar (desktop) ─── */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-20">
              {filterContent}
            </div>
          </aside>

          {/* ─── Mobile sidebar overlay ─── */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-primary-950/30" onClick={() => setSidebarOpen(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-72 bg-sand-50 border-r border-sand-200 p-5 overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[0.9rem] font-semibold text-sand-950">Filters</span>
                  <button onClick={() => setSidebarOpen(false)} className="text-sand-500 hover:text-sand-700">
                    <svg className="w-5 h-5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                  </button>
                </div>
                {filterContent}
              </div>
            </div>
          )}

          {/* ─── Vehicle grid (right) ─── */}
          <div className="flex-1 min-w-0">

            {error && (
              <div className="text-center py-20">
                <p className="text-sand-500 mb-4">{error}</p>
                <button onClick={() => window.location.reload()} className="text-primary-700 font-semibold hover:text-primary-800 transition-colors text-[0.8rem]">Retry</button>
              </div>
            )}

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-[0.95rem] font-semibold text-sand-700 mb-2">No vehicles match your filters.</p>
                <p className="text-[0.85rem] text-sand-400 mb-4">Try widening your search or removing some filters.</p>
                <button onClick={clearAll} className="text-primary-700 font-semibold hover:text-primary-800 transition-colors text-[0.8rem]">Clear filters</button>
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((v) => (
                  <VehicleCard key={v._id} vehicle={v} recommended={isRecommended(v)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
