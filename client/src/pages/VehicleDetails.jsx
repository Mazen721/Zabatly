import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { API } from '../config/api';
import { getVehicleAreaLabel, getVehicleExactAddress } from '../data/egyptLocations';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

function StarRating({ rating, count }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-signal-500' : 'text-sand-300'}`} viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {count !== undefined && <span className="text-[0.75rem] text-sand-500">({count})</span>}
    </div>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

const toDateKey = (date) => {
  const d = new Date(date);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

const isWithinRange = (dateKey, range) => {
  const date = new Date(`${dateKey}T12:00:00`);
  const start = new Date(range.startDate);
  const end = new Date(range.endDate);
  end.setHours(23, 59, 59, 999);
  return date >= start && date <= end;
};

const getRentalEndDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (
    date.getHours() === 0 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0
  ) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
};

const isReviewableBooking = (booking) => {
  const end = getRentalEndDate(booking.endDate);
  return ['completed', 'expired'].includes(booking.status) || Boolean(end && end < new Date());
};

function AvailabilityStatus({ loading, startDate, endDate, availability, t }) {
  if (!startDate || !endDate) {
    return (
      <div className="rounded-subtle border border-sand-200 bg-sand-100 px-3 py-2 text-[0.78rem] text-sand-500 transition-all duration-200 ease-out-quart">
        {t('selectDates')}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-subtle border border-sand-200 bg-sand-100 px-3 py-2 text-[0.78rem] font-medium text-sand-600 transition-all duration-200 ease-out-quart">
        {t('checkingAvailability')}
      </div>
    );
  }

  if (availability?.available) {
    return (
      <div className="rounded-subtle border border-green-200 bg-green-50 px-3 py-2 text-[0.78rem] font-semibold text-green-700 transition-all duration-200 ease-out-quart">
        {t('available')}
      </div>
    );
  }

  if (availability?.available === false) {
    return (
      <div className="rounded-subtle border border-red-200 bg-red-50 px-3 py-2 text-[0.78rem] font-semibold text-red-700 transition-all duration-200 ease-out-quart">
        {availability.message || t('chooseDatesAvailable')}
      </div>
    );
  }

  return null;
}

function ReservedDateCalendar({ reservedRanges, startDate, endDate, onPickDate, t }) {
  const days = Array.from({ length: 35 }, (_, index) => addDays(new Date(), index));

  return (
    <div className="rounded-soft border border-sand-200 bg-sand-100 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500">{t('reservedDates')}</span>
        <span className="text-[0.68rem] text-sand-500">{t('next35days')}</span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = toDateKey(day);
          const reserved = reservedRanges.some((range) => isWithinRange(key, range));
          const selected = key === startDate || key === endDate;
          const inSelectedRange = startDate && endDate && key >= startDate && key <= endDate;

          return (
            <button
              key={key}
              type="button"
              disabled={reserved}
              onClick={() => onPickDate(key)}
              className={`aspect-square rounded-subtle text-[0.68rem] font-semibold transition-all duration-150 ease-out-quart ${
                reserved
                  ? 'cursor-not-allowed border border-red-200 bg-red-50 text-red-600 opacity-80'
                  : selected
                    ? 'bg-primary-800 text-white'
                    : inSelectedRange
                      ? 'bg-primary-50 text-primary-800'
                      : 'bg-sand-50 text-sand-700 hover:bg-sand-200/70'
              }`}
              title={reserved ? t('reserved') : ''}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[0.68rem] text-sand-500">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-50 ring-1 ring-red-200" /> {t('reserved')}</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-sand-50 ring-1 ring-sand-200" /> {t('common:vehicle.available')}</span>
      </div>
    </div>
  );
}

export default function VehicleDetails() {
  const { t } = useTranslation('vehicle');
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [needsDriver, setNeedsDriver] = useState(false);
  const [route, setRoute] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [reservedRanges, setReservedRanges] = useState([]);
  const [saved, setSaved] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [completedBookingId, setCompletedBookingId] = useState(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  const ratingLabels = [t('poor'), t('fair'), t('good'), t('veryGood'), t('excellent')];

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    (async () => {
      try {
        const [vRes, rRes] = await Promise.all([
          axios.get(`${API}/api/vehicles/${id}`),
          axios.get(`${API}/api/reviews/vehicle/${id}`),
        ]);
        setVehicle(vRes.data);
        setReviews(rRes.data);
      } catch {
        setVehicle(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!userInfo?.token) return;

    (async () => {
      try {
        const { data } = await axios.get(`${API}/api/users/saved-vehicles`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setSaved((data || []).some((item) => item._id === id));
      } catch {
        setSaved(false);
      }
    })();
  }, [id, userInfo?.token]);

  const toggleSaved = async () => {
    if (!userInfo?.token) return navigate('/login');

    try {
      const { data } = await axios.put(`${API}/api/users/saved-vehicles/${id}`, null, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setSaved(Boolean(data.saved));
    } catch {
      setBookingError(t('savedError'));
    }
  };

  // Check if user can review (has a completed booking for this vehicle)
  useEffect(() => {
    if (!userInfo?.token || !id) return;
    (async () => {
      try {
        const { data: bookings } = await axios.get(`${API}/api/bookings`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        const reviewable = bookings.find(
          (b) =>
            (b.vehicle?._id === id || b.vehicle === id) &&
            (b.renter?._id === userInfo._id || b.renter === userInfo._id) &&
            isReviewableBooking(b)
        );
        if (reviewable) {
          setCompletedBookingId(reviewable._id);
          setCanReview(true);
        }
      } catch { /* ignore */ }
    })();
  }, [id, userInfo?.token, userInfo?._id]);

  // Check if user already reviewed this vehicle
  useEffect(() => {
    if (!userInfo?._id || reviews.length === 0) return;
    const alreadyReviewed = reviews.some(
      (r) => r.author?._id === userInfo._id
    );
    if (alreadyReviewed) {
      setHasReviewed(true);
      setCanReview(false);
    }
  }, [reviews, userInfo?._id]);

  const submitReview = async () => {
    if (!reviewRating || !completedBookingId) return;
    setReviewSubmitting(true);
    try {
      await axios.post(
        `${API}/api/reviews`,
        {
          targetVehicle: id,
          bookingReference: completedBookingId,
          rating: reviewRating,
          comment: reviewComment,
        },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );
      // Refresh reviews
      const { data: freshReviews } = await axios.get(`${API}/api/reviews/vehicle/${id}`);
      setReviews(freshReviews);
      // Refresh vehicle to get updated rating
      const { data: freshVehicle } = await axios.get(`${API}/api/vehicles/${id}`);
      setVehicle(freshVehicle);
      setCanReview(false);
      setHasReviewed(true);
      setReviewRating(0);
      setReviewComment('');
      setReviewSuccess(t('reviewSuccess'));
      setTimeout(() => setReviewSuccess(''), 4000);
    } catch (err) {
      setReviewSuccess('');
    } finally {
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    if (!vehicle?._id) return;

    let ignore = false;
    const checkAvailability = async () => {
      setAvailabilityLoading(Boolean(startDate && endDate));
      try {
        const { data } = await axios.get(`${API}/api/bookings/availability`, {
          params: {
            vehicleId: vehicle._id,
            startDate,
            endDate,
          },
        });
        if (!ignore) {
          setAvailability(data);
          setReservedRanges(data.reservedRanges || []);
        }
      } catch {
        if (!ignore) {
          setAvailability({
            available: false,
            message: t('checkingAvailability'),
          });
        }
      } finally {
        if (!ignore) setAvailabilityLoading(false);
      }
    };

    const timer = window.setTimeout(checkAvailability, startDate && endDate ? 180 : 0);
    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [vehicle?._id, startDate, endDate]);

  const pickCalendarDate = (dateKey) => {
    setBookingError('');
    if (!startDate || (startDate && endDate) || dateKey < startDate) {
      setStartDate(dateKey);
      setEndDate('');
      return;
    }
    setEndDate(dateKey);
  };

  const handleBooking = async () => {
    if (!userInfo) return navigate('/login');
    setBookingError('');

    if (vehicle.owner?._id === userInfo._id || vehicle.owner === userInfo._id) {
      setBookingError(t('cantBookOwn'));
      return;
    }

    if (userInfo.kyc_status !== 'verified') {
      return navigate('/verify-identity');
    }
    if (!needsDriver && (!userInfo.driving_license || !userInfo.driving_license.is_verified)) {
      return navigate('/verify-identity');
    }
    if (!startDate || !endDate) { setBookingError(t('selectTravelDates')); return; }
    if (new Date(startDate) > new Date(endDate)) { setBookingError(t('returnAfterPickup')); return; }
    if (availability?.available !== true) { setBookingError(t('chooseDatesAvailable')); return; }
    if (needsDriver && !route) { setBookingError(t('provideRoute')); return; }

    const days = Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    const totalPrice = vehicle.price_per_day * days + (needsDriver ? vehicle.driver_cost * days : 0);

    const bookingDraft = {
      vehicle,
      payload: {
        vehicle: vehicle._id,
        owner: vehicle.owner._id,
        renter: userInfo._id,
        startDate, endDate, totalPrice,
        routeDescription: needsDriver ? route : 'Self-drive',
        needsDriver,
      },
    };

    sessionStorage.setItem('zabatlyBookingDraft', JSON.stringify(bookingDraft));
    navigate('/payment', { state: { bookingDraft } });
  };

  const days = startDate && endDate ? Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1 : 0;
  const basePrice = vehicle ? vehicle.price_per_day * days : 0;
  const driverFee = needsDriver && vehicle ? vehicle.driver_cost * days : 0;

  /* ── Loading ──────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-sand-50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-6">
          <div className="h-4 w-24 bg-sand-200 rounded animate-pulse mb-6" />
          <div className="flex gap-8">
            <div className="flex-1 space-y-4">
              <div className="aspect-[16/10] bg-sand-200 rounded-soft animate-pulse" />
              <div className="h-8 w-2/3 bg-sand-200 rounded animate-pulse" />
              <div className="h-4 w-1/3 bg-sand-200 rounded animate-pulse" />
            </div>
            <div className="hidden lg:block w-80 shrink-0">
              <div className="h-96 bg-sand-200 rounded-soft animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[0.95rem] font-semibold text-sand-700 mb-2">{t('notFound')}</p>
          <Link to="/explore" className="text-primary-700 font-semibold hover:text-primary-800 text-[0.8rem]">{t('backToFleet')}</Link>
        </div>
      </div>
    );
  }

  const heroSrc = vehicle.images?.length > 0 ? vehicle.images[activeImg] : null;
  const mapCenter = [vehicle.location?.lat || vehicle.lat || 31.2001, vehicle.location?.lng || vehicle.lng || 29.9187];
  const isOwnVehicle = userInfo && (vehicle.owner?._id === userInfo._id || vehicle.owner === userInfo._id);

  const specs = [
    { label: t('transmission'), value: vehicle.transmission === 'automatic' ? t('automatic') : t('manual') },
    { label: t('seats'), value: t('passengers', { count: vehicle.capacity }) },
    { label: t('fuel'), value: vehicle.fuel ? vehicle.fuel.charAt(0).toUpperCase() + vehicle.fuel.slice(1) : t('petrol') },
    { label: t('ac'), value: vehicle.ac ? t('yes') : t('no') },
  ];

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-6 pb-16">

        {/* Back */}
        <Link to="/explore" className="inline-flex items-center gap-1 text-[0.8rem] text-sand-500 font-medium hover:text-primary-700 transition-colors mb-5">
          <svg className="w-4 h-4 rtl:scale-x-[-1]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 3L5 8l5 5" /></svg>
          {t('backToFleet')}
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* ─── Left Column ─── */}
          <div className="flex-1 min-w-0 space-y-8">

            {/* Gallery */}
            <div>
              <div className="relative aspect-[16/9] rounded-soft overflow-hidden bg-sand-100 group/gallery">
                {heroSrc ? (
                  <img src={heroSrc} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sand-400">{t('photoUnavailable')}</div>
                )}
                {vehicle.images?.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImg((i) => (i === 0 ? vehicle.images.length - 1 : i - 1))}
                      aria-label={t('previousImage')}
                      className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-sand-50/90 backdrop-blur-sm flex items-center justify-center text-sand-700 opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-200 hover:bg-sand-50 z-10"
                    >
                      <svg className="w-4 h-4 rtl:scale-x-[-1]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 3L5 8l5 5" /></svg>
                    </button>
                    <button
                      onClick={() => setActiveImg((i) => (i === vehicle.images.length - 1 ? 0 : i + 1))}
                      aria-label={t('nextImage')}
                      className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-sand-50/90 backdrop-blur-sm flex items-center justify-center text-sand-700 opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-200 hover:bg-sand-50 z-10"
                    >
                      <svg className="w-4 h-4 rtl:scale-x-[-1]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 3l5 5-5 5" /></svg>
                    </button>
                    <div className="absolute bottom-3 right-3 rtl:right-auto rtl:left-3 bg-sand-950/60 text-sand-50 text-[0.7rem] font-medium px-2 py-0.5 rounded z-10">
                      {activeImg + 1} / {vehicle.images.length}
                    </div>
                  </>
                )}
              </div>
              {vehicle.images?.length > 1 && (
                <div className="flex gap-2 mt-2.5 overflow-x-auto scrollbar-hide">
                  {vehicle.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`shrink-0 h-14 w-20 rounded overflow-hidden border-2 transition-all duration-150 ${i === activeImg ? 'border-primary-800 opacity-100' : 'border-transparent opacity-60 hover:opacity-90'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Heading */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-1">
                <h1 className="text-[1.75rem] font-bold text-sand-950 leading-tight">{vehicle.make} {vehicle.model}</h1>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSaved}
                    className={`flex h-9 w-9 items-center justify-center rounded-subtle border transition-colors duration-150 ${
                      saved
                        ? 'border-primary-800 bg-primary-800 text-white'
                        : 'border-sand-200 bg-sand-100 text-sand-700 hover:text-primary-800'
                    }`}
                    aria-label={saved ? t('removeSaved') : t('saveCar')}
                    title={saved ? t('removeSaved') : t('saveCar')}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 13.5s-5.5-3.5-5.5-7A3.25 3.25 0 0 1 8 4a3.25 3.25 0 0 1 5.5 2.5c0 3.5-5.5 7-5.5 7z" />
                    </svg>
                  </button>
                  <span className="bg-sand-100 text-sand-600 text-[0.7rem] font-semibold px-2.5 py-1 rounded capitalize">{vehicle.type}</span>
                </div>
              </div>
              <p className="text-[0.85rem] text-sand-500">
                {vehicle.year} &middot; {t('listedBy')} <span className="text-sand-700 font-medium">{vehicle.owner?.name || t('zabatlyPartner')}</span>
              </p>
              {vehicle.rating > 0 && (
                <div className="mt-2">
                  <StarRating rating={vehicle.rating} count={vehicle.numReviews} />
                </div>
              )}
            </div>

            {/* Specs */}
            <div className="flex flex-wrap gap-x-6 gap-y-3 py-5 border-t border-b border-sand-200">
              {specs.map((s) => (
                <div key={s.label}>
                  <span className="text-[0.7rem] text-sand-400 font-medium uppercase tracking-wide block">{s.label}</span>
                  <span className="text-[0.85rem] text-sand-800 font-semibold">{s.value}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            {vehicle.description && (
              <div>
                <h2 className="text-[1.1rem] font-semibold text-sand-950 mb-3">{t('aboutVehicle')}</h2>
                <p className="text-[0.85rem] text-sand-600 leading-relaxed whitespace-pre-line max-w-prose">{vehicle.description}</p>
              </div>
            )}

            {/* Owner */}
            <Link
              to={vehicle.owner?._id ? `/user/${vehicle.owner._id}` : '#'}
              className="flex items-center gap-4 py-5 border-t border-sand-200 transition-colors duration-150 hover:bg-sand-100/50"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-sand-200 shrink-0">
                {vehicle.owner?.profilePicture ? (
                  <img src={vehicle.owner.profilePicture} alt={vehicle.owner?.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sand-500 font-bold text-lg">{vehicle.owner?.name?.charAt(0) || 'O'}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[0.9rem] font-semibold text-sand-950">{vehicle.owner?.name}</span>
                  {vehicle.owner?.is_verified && (
                    <span className="text-[0.65rem] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">{t('verified')}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {vehicle.owner?.rating ? <StarRating rating={vehicle.owner.rating} count={vehicle.owner.numReviews} /> : <span className="text-[0.75rem] text-sand-400">{t('newOnZabatly')}</span>}
                </div>
              </div>
              <svg className="h-4 w-4 text-sand-400 rtl:scale-x-[-1]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3l5 5-5 5" />
              </svg>
            </Link>

            {/* Map */}
            <div>
              <h2 className="text-[1.1rem] font-semibold text-sand-950 mb-1">{t('pickupLocation')}</h2>
              <p className="text-[0.85rem] font-medium text-sand-700">{getVehicleAreaLabel(vehicle)}</p>
              {getVehicleExactAddress(vehicle) ? (
                <p className="text-[0.8rem] text-sand-500 mb-3">{getVehicleExactAddress(vehicle)}</p>
              ) : (
                <p className="text-[0.8rem] text-sand-500 mb-3">{vehicle.address || t('locationNotSet')}</p>
              )}
              <div className="h-64 w-full rounded-soft overflow-hidden border border-sand-200 relative z-0">
                <MapContainer center={mapCenter} zoom={15} scrollWheelZoom={false} className="h-full w-full">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                  <Marker position={mapCenter} />
                </MapContainer>
              </div>
            </div>

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[1.1rem] font-semibold text-sand-950">{t('reviews')}</h2>
                {vehicle.rating > 0 && <StarRating rating={vehicle.rating} count={vehicle.numReviews} />}
              </div>

              {/* Review success message */}
              {reviewSuccess && (
                <div className="mb-4 rounded-subtle border border-green-200 bg-green-50 px-3 py-2 text-[0.8rem] font-semibold text-green-700">
                  {reviewSuccess}
                </div>
              )}

              {/* Write a review form */}
              {canReview && !hasReviewed && (
                <div className="mb-6 rounded-soft border border-sand-200 bg-sand-100/50 p-4 space-y-3">
                  <p className="text-[0.85rem] font-semibold text-sand-900">{t('writeReview')}</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewRating(s)}
                        onMouseEnter={() => setReviewHover(s)}
                        onMouseLeave={() => setReviewHover(0)}
                        className="transition-transform duration-100 hover:scale-110"
                      >
                        <svg
                          className={`w-6 h-6 transition-colors duration-100 ${
                            s <= (reviewHover || reviewRating) ? 'text-signal-500' : 'text-sand-300'
                          }`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                    {reviewRating > 0 && (
                      <span className="ml-2 rtl:ml-0 rtl:mr-2 text-[0.78rem] font-medium text-sand-500 self-center">
                        {ratingLabels[reviewRating - 1]}
                      </span>
                    )}
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={t('shareExperience')}
                    className="w-full bg-sand-50 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-3 py-2 text-[0.8rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 resize-none h-20"
                  />
                  <button
                    onClick={submitReview}
                    disabled={!reviewRating || reviewSubmitting}
                    className={`px-4 py-2 rounded-subtle text-[0.8rem] font-semibold transition-colors ${
                      reviewRating && !reviewSubmitting
                        ? 'bg-primary-800 text-white hover:bg-primary-900'
                        : 'bg-sand-200 text-sand-500 cursor-not-allowed'
                    }`}
                  >
                    {reviewSubmitting ? t('submittingReview') : t('submitReview')}
                  </button>
                </div>
              )}

              {hasReviewed && !reviewSuccess && (
                <div className="mb-4 rounded-subtle bg-sand-100 px-3 py-2 text-[0.78rem] text-sand-500">
                  {t('alreadyReviewed')}
                </div>
              )}

              {reviews.length === 0 ? (
                <p className="text-[0.85rem] text-sand-400 py-6">{t('noReviews', { make: vehicle.make })}</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r._id} className="py-4 border-b border-sand-100 last:border-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-sand-200 overflow-hidden shrink-0">
                          {r.author?.profilePicture ? (
                            <img src={r.author.profilePicture} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sand-500 text-[0.7rem] font-bold">{r.author?.name?.charAt(0) || 'U'}</div>
                          )}
                        </div>
                        <div>
                          <span className="text-[0.8rem] font-semibold text-sand-800">{r.author?.name || 'Anonymous'}</span>
                          <div className="flex items-center gap-2">
                            <StarRating rating={r.rating} />
                            <span className="text-[0.7rem] text-sand-400">{new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[0.8rem] text-sand-600 leading-relaxed pl-11 rtl:pl-0 rtl:pr-11">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── Right Column: Booking Card ─── */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="sticky top-20 bg-sand-50 border border-sand-200 rounded-soft p-5 space-y-4">

              {/* Price */}
              <div>
                <span className="text-[1.5rem] font-bold text-primary-800">{vehicle.price_per_day}</span>
                <span className="text-[0.8rem] text-sand-500 ml-1 rtl:ml-0 rtl:mr-1">{t('egpPerDay')}</span>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="vd-start" className="block text-[0.7rem] font-medium text-sand-500 uppercase tracking-wide mb-1">{t('pickup')}</label>
                  <input id="vd-start" type="date" min={toDateKey(new Date())} value={startDate} onChange={(e) => { setStartDate(e.target.value); setBookingError(''); }} className="w-full bg-sand-100 border border-sand-200 text-sand-950 rounded-subtle px-3 py-2 text-[0.8rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-all duration-150" />
                </div>
                <div>
                  <label htmlFor="vd-end" className="block text-[0.7rem] font-medium text-sand-500 uppercase tracking-wide mb-1">{t('return')}</label>
                  <input id="vd-end" type="date" min={startDate || toDateKey(new Date())} value={endDate} onChange={(e) => { setEndDate(e.target.value); setBookingError(''); }} className="w-full bg-sand-100 border border-sand-200 text-sand-950 rounded-subtle px-3 py-2 text-[0.8rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-all duration-150" />
                </div>
              </div>

              <AvailabilityStatus
                loading={availabilityLoading}
                startDate={startDate}
                endDate={endDate}
                availability={availability}
                t={t}
              />

              <ReservedDateCalendar
                reservedRanges={reservedRanges}
                startDate={startDate}
                endDate={endDate}
                onPickDate={pickCalendarDate}
                t={t}
              />

              {/* Driver option */}
              {vehicle.has_driver && (
                <div className="bg-sand-100 rounded-subtle p-3.5">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={needsDriver} onChange={(e) => setNeedsDriver(e.target.checked)} className="w-4 h-4 rounded border-sand-300 text-primary-800 focus:ring-primary-600 accent-primary-800" />
                    <span className="text-[0.85rem] font-semibold text-sand-800">{t('addDriver')}</span>
                  </label>
                  <p className="text-[0.7rem] text-sand-500 mt-1 ml-6.5 rtl:ml-0 rtl:mr-6.5">{t('driverCostPerDay', { cost: vehicle.driver_cost })}</p>

                  {needsDriver && (
                    <div className="mt-3">
                      <label htmlFor="vd-route" className="block text-[0.7rem] font-medium text-sand-500 uppercase tracking-wide mb-1">{t('tripRoute')}</label>
                      <textarea
                        id="vd-route"
                        placeholder={t('whereGoing')}
                        value={route}
                        onChange={(e) => setRoute(e.target.value)}
                        className="w-full bg-sand-50 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-3 py-2 text-[0.8rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 resize-none h-20"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Price breakdown */}
              {days > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-sand-200">
                  <div className="flex justify-between text-[0.8rem]">
                    <span className="text-sand-500">{vehicle.price_per_day} EGP x {days} {days === 1 ? t('day') : t('days')}</span>
                    <span className="text-sand-800 font-medium">{basePrice} EGP</span>
                  </div>
                  {needsDriver && (
                    <div className="flex justify-between text-[0.8rem]">
                      <span className="text-sand-500">{t('driverFee')}</span>
                      <span className="text-sand-800 font-medium">{driverFee} EGP</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[0.85rem] font-bold pt-1.5 border-t border-sand-200">
                    <span className="text-sand-950">{t('total')}</span>
                    <span className="text-primary-800">{basePrice + driverFee} EGP</span>
                  </div>
                </div>
              )}

              {/* Error */}
              {bookingError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-[0.8rem] rounded-subtle px-3 py-2" role="alert">
                  {bookingError}
                </div>
              )}

              {/* CTA */}
              {isOwnVehicle ? (
                <button
                  disabled
                  className="w-full cursor-not-allowed rounded-subtle bg-sand-200 py-3 text-[0.85rem] font-semibold text-sand-500"
                >
                  {t('ownListing')}
                </button>
              ) : userInfo?.kyc_status !== 'verified' ? (
                <button
                  onClick={() => navigate('/verify-identity')}
                  className="w-full bg-signal-500 text-primary-950 py-3 rounded-subtle text-[0.85rem] font-semibold hover:bg-signal-600 transition-colors"
                >
                  {t('verifyIdentity')}
                </button>
              ) : !needsDriver && (!userInfo.driving_license || !userInfo.driving_license.is_verified) ? (
                <button
                  onClick={() => navigate('/verify-identity')}
                  className="w-full bg-signal-500 text-primary-950 py-3 rounded-subtle text-[0.85rem] font-semibold hover:bg-signal-600 transition-colors"
                >
                  {t('verifyLicense')}
                </button>
              ) : (
                <button
                  onClick={handleBooking}
                  disabled={availabilityLoading || (startDate && endDate && availability?.available !== true)}
                  className={`w-full py-3 rounded-subtle text-[0.85rem] font-semibold transition-colors ${
                    !availabilityLoading && (!startDate || !endDate || availability?.available === true)
                      ? 'bg-primary-800 text-white hover:bg-primary-900'
                      : 'bg-sand-200 text-sand-500 cursor-not-allowed'
                  }`}
                >
                  {availabilityLoading ? t('checkingDates') : t('confirmBooking')}
                </button>
              )}

              <p className="text-center text-[0.7rem] text-sand-400">{t('nextStepPayment')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
