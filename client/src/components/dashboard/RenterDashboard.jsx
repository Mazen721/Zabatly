import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import DashboardShell from './DashboardShell';
import PaymentProofLink from '../PaymentProofLink';
import { API } from '../../config/api';
import { getVehicleAreaLabel } from '../../data/egyptLocations';

const getImg = (v) =>
  v?.images?.length > 0
    ? v.images[0]
    : 'https://placehold.co/100x75/f2efea/a49888?text=No+Photo';

const statusColors = {
  upcoming: 'bg-signal-50 text-signal-700 border border-signal-200',
  active: 'bg-green-50 text-green-700 border border-green-200',
  pending: 'bg-signal-50 text-signal-700 border border-signal-200',
  confirmed: 'bg-primary-50 text-primary-700 border border-primary-200',
  completed: 'bg-primary-50 text-primary-700 border border-primary-200',
  cancelled: 'bg-sand-100 text-sand-600 border border-sand-200',
  expired: 'bg-sand-100 text-sand-600 border border-sand-200',
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-block px-2 py-0.5 rounded-subtle text-[0.7rem] font-semibold capitalize ${
      statusColors[status] || statusColors.cancelled
    }`}
  >
    {status}
  </span>
);

const paymentLabels = {
  card: 'Card',
  vodafone_cash: 'Vodafone Cash',
  instapay: 'InstaPay',
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

const isWithinBookingDates = (booking, date) => {
  const start = booking.startDate ? new Date(booking.startDate) : null;
  const end = getRentalEndDate(booking.endDate);
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return start <= date && end >= date;
};

const isPastBooking = (booking, date) => {
  const end = getRentalEndDate(booking.endDate);
  return Boolean(end && end < date);
};

const displayStatus = (booking, date = new Date()) => {
  if (['completed', 'cancelled', 'expired'].includes(booking.status)) return booking.status;
  if (booking.status === 'active') return 'active';
  if (booking.status === 'confirmed' && isWithinBookingDates(booking, date)) return 'active';
  if (isPastBooking(booking, date)) return 'expired';
  if (booking.status === 'pending') return 'pending';
  if (booking.status === 'confirmed') return 'confirmed';
  return 'upcoming';
};

const isReviewableBooking = (booking, date = new Date()) =>
  Boolean(booking.vehicle && ['completed', 'expired'].includes(displayStatus(booking, date)));

const SkeletonRow = () => (
  <div className="flex items-center gap-4 py-3 animate-pulse">
    <div className="w-12 h-9 rounded-subtle bg-sand-200" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 w-32 bg-sand-200 rounded" />
      <div className="h-2.5 w-20 bg-sand-100 rounded" />
    </div>
    <div className="h-3 w-16 bg-sand-200 rounded" />
    <div className="h-5 w-14 bg-sand-100 rounded" />
  </div>
);

const EmptyState = ({ message, cta, href }) => (
  <div className="py-12 text-center">
    <p className="text-[0.875rem] text-sand-500 mb-4">{message}</p>
    {cta && (
      <Link
        to={href}
        className="inline-flex items-center gap-1.5 bg-primary-800 text-white text-[0.8125rem] font-semibold px-5 py-2.5 rounded-subtle hover:bg-primary-900 transition-colors duration-150"
      >
        {cta}
      </Link>
    )}
  </div>
);

export default function RenterDashboard({ user, returnTarget = null, initialSection = 'overview' }) {
  const [section, setSection] = useState(initialSection || 'overview');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [savedVehicles, setSavedVehicles] = useState([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const config = {
          headers: { Authorization: `Bearer ${user.token}` },
        };
        const { data } = await axios.get(`${API}/api/bookings`, config);
        setBookings(data || []);
      } catch (err) {
        setError('Could not load your bookings. Try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user.token]);

  useEffect(() => {
    const fetchSavedVehicles = async () => {
      try {
        const { data } = await axios.get(`${API}/api/users/saved-vehicles`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setSavedVehicles(data || []);
      } catch {
        setSavedVehicles([]);
      }
    };
    fetchSavedVehicles();
  }, [user.token]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeBooking = bookings.find((b) => displayStatus(b, now) === 'active');
  const completedCount = bookings.filter((b) => ['completed', 'expired'].includes(displayStatus(b, now))).length;
  const totalSpent = bookings
    .filter((b) => ['completed', 'expired', 'active', 'confirmed'].includes(displayStatus(b, now)))
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const returnCar = async (id) => {
    try {
      await axios.put(
        `${API}/api/bookings/${id}`,
        { renterFinished: true },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, renterFinished: true } : b))
      );
    } catch {
      setError('Could not request return. Try again.');
    }
  };

  const removeSavedVehicle = async (vehicleId) => {
    try {
      await axios.put(`${API}/api/users/saved-vehicles/${vehicleId}`, null, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setSavedVehicles((prev) => prev.filter((vehicle) => vehicle._id !== vehicleId));
    } catch {
      setError('Could not remove saved car. Try again.');
    }
  };

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="5" height="5" rx="1" />
          <rect x="9" y="2" width="5" height="5" rx="1" />
          <rect x="2" y="9" width="5" height="5" rx="1" />
          <rect x="9" y="9" width="5" height="5" rx="1" />
        </svg>
      ),
    },
    {
      id: 'bookings',
      label: 'My Bookings',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
          <path d="M5 1v3M11 1v3M2 6.5h12" />
        </svg>
      ),
    },
    {
      id: 'saved',
      label: 'Saved',
      badge: savedVehicles.length || null,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 13.5s-5.5-3.5-5.5-7A3.25 3.25 0 0 1 8 4a3.25 3.25 0 0 1 5.5 2.5c0 3.5-5.5 7-5.5 7z" />
        </svg>
      ),
    },

    { id: 'div1', type: 'divider', label: '' },
    {
      id: 'browse',
      label: 'Browse Fleet',
      href: '/explore',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5 14 14" />
        </svg>
      ),
    },
  ];

  const bottomActions = [
    {
      id: 'profile',
      label: 'Profile',
      href: '/profile',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="5" r="3" />
          <path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" />
        </svg>
      ),
    },
  ];

  // Context strip
  const contextStrip = activeBooking ? (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <span className="font-semibold text-sand-800">
        {activeBooking.vehicle
          ? `${activeBooking.vehicle.make} ${activeBooking.vehicle.model}`
          : 'Active Ride'}
      </span>
      <span className="text-sand-500">·</span>
      <span className="text-sand-600">
        {activeBooking.startDate
          ? new Date(activeBooking.startDate).toLocaleDateString('en-GB', {
              month: 'short',
              day: 'numeric',
            })
          : ''}
        {activeBooking.endDate
          ? ` – ${new Date(activeBooking.endDate).toLocaleDateString('en-GB', {
              month: 'short',
              day: 'numeric',
            })}`
          : ''}
      </span>
      <span className="text-sand-500">·</span>
      <StatusBadge status="active" />
      {activeBooking.renterFinished && (
        <span className="text-[0.75rem] text-signal-600 font-medium">
          Return requested
        </span>
      )}
    </div>
  ) : null;

  return (
    <DashboardShell
      navItems={navItems}
      activeSection={section}
      onSectionChange={setSection}
      contextStrip={contextStrip}
      user={user}
      bottomActions={bottomActions}
      returnTarget={returnTarget}
    >
      {/* Overview */}
      {section === 'overview' && (
        <div className="space-y-6">
          <h1 className="text-[1.25rem] font-semibold text-sand-950">
            Welcome back, {user.name?.split(' ')[0] || 'there'}
          </h1>

          {/* Metrics */}
          <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200">
            <MetricTile label="Total Trips" value={completedCount} />
            <MetricTile
              label="Active"
              value={activeBooking ? 1 : 0}
              accent={activeBooking ? true : false}
            />
            <MetricTile label="Total Spent" value={`${totalSpent.toLocaleString()} EGP`} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-[0.8125rem] px-4 py-2.5 rounded-subtle">
              {error}
            </div>
          )}

          {/* Two columns: Booking History + Quick Actions */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[0.95rem] font-semibold text-sand-900">
                  Recent Bookings
                </h2>
                {bookings.length > 0 && (
                  <button
                    onClick={() => setSection('bookings')}
                    className="text-[0.75rem] font-medium text-primary-600 hover:text-primary-800 transition-colors"
                  >
                    View all
                  </button>
                )}
              </div>

              <div className="bg-sand-50 border border-sand-200 rounded-soft overflow-hidden">
                {/* Table header */}
                <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_80px_100px] gap-4 px-4 py-2 bg-sand-100 text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 border-b border-sand-200">
                  <span>Vehicle</span>
                  <span>Dates</span>
                  <span>Status</span>
                  <span className="text-right">Amount</span>
                </div>

                {loading ? (
                  <div className="px-4 divide-y divide-sand-100">
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </div>
                ) : bookings.length === 0 ? (
                  <EmptyState
                    message="No bookings yet. Browse the fleet to find your first ride."
                    cta="Browse Fleet"
                    href="/explore"
                  />
                ) : (
                  <div className="divide-y divide-sand-100">
                    {bookings.slice(0, 6).map((b) => {
                      const isDriverOnly = !b.vehicle && b.driver;
                      const title = isDriverOnly
                        ? 'Driver Service'
                        : `${b.vehicle?.make || 'Deleted'} ${b.vehicle?.model || 'Vehicle'}`;
                      return (
                        <div
                          key={b._id}
                          className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_80px_100px] gap-2 md:gap-4 items-center px-4 py-3 hover:bg-sand-100/60 transition-colors duration-100"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={isDriverOnly ? 'https://placehold.co/48x36/f2efea/a49888?text=D' : getImg(b.vehicle)}
                              alt=""
                              className="w-12 h-9 rounded object-cover bg-sand-100 flex-shrink-0"
                            />
                            <span className="text-[0.875rem] font-medium text-sand-900 truncate">
                              {title}
                            </span>
                          </div>
                          <span className="text-[0.8125rem] text-sand-600">
                            {b.startDate
                              ? new Date(b.startDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
                              : '—'}
                            {b.endDate
                              ? ` – ${new Date(b.endDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`
                              : ''}
                          </span>
                          <StatusBadge status={displayStatus(b, now)} />
                          <span className="text-[0.875rem] font-semibold text-sand-900 md:text-right tabular-nums">
                            {b.totalPrice?.toLocaleString() || '—'} EGP
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h2 className="text-[0.95rem] font-semibold text-sand-900 mb-3">
                Quick Actions
              </h2>
              <Link
                to="/explore"
                className="flex items-center justify-between bg-primary-800 text-white px-4 py-3 rounded-subtle hover:bg-primary-900 transition-colors duration-150"
              >
                <span className="text-[0.8125rem] font-semibold">New Booking</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 2.5 9.5 7 5 11.5" />
                </svg>
              </Link>
              <Link
                to="/explore"
                className="flex items-center justify-between bg-sand-100 text-sand-800 border border-sand-200 px-4 py-3 rounded-subtle hover:bg-sand-200/60 transition-colors duration-150"
              >
                <span className="text-[0.8125rem] font-medium">Browse Fleet</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 2.5 9.5 7 5 11.5" />
                </svg>
              </Link>


              {/* Active booking card */}
              {activeBooking && (
                <div className="mt-4 border border-sand-200 rounded-soft p-4 bg-sand-50">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-sand-500 mb-2">
                    Active Trip
                  </p>
                  <p className="text-[0.875rem] font-semibold text-sand-900 mb-1">
                    {activeBooking.vehicle
                      ? `${activeBooking.vehicle.make} ${activeBooking.vehicle.model}`
                      : 'Driver Service'}
                  </p>
                  <p className="text-[0.8125rem] text-sand-600 mb-3">
                    Return:{' '}
                    {activeBooking.endDate
                      ? new Date(activeBooking.endDate).toLocaleDateString('en-GB', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </p>
                  {!activeBooking.renterFinished ? (
                    <button
                      onClick={() => returnCar(activeBooking._id)}
                      className="w-full bg-primary-800 text-white text-[0.8125rem] font-semibold py-2.5 rounded-subtle hover:bg-primary-900 transition-colors duration-150"
                    >
                      {activeBooking.vehicle ? 'Return Vehicle' : 'Release Driver'}
                    </button>
                  ) : (
                    <div className="text-center text-[0.8125rem] text-sand-500 font-medium py-2 bg-sand-100 rounded-subtle">
                      Awaiting confirmation
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bookings (full list) */}
      {section === 'bookings' && (
        <div>
          <h1 className="text-[1.25rem] font-semibold text-sand-950 mb-5">
            My Bookings
          </h1>
          <div className="bg-sand-50 border border-sand-200 rounded-soft overflow-hidden">
            <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,1.35fr)_90px_115px_100px_120px] gap-4 px-4 py-2 bg-sand-100 text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 border-b border-sand-200">
              <span>Vehicle</span>
              <span>Dates</span>
              <span>Status</span>
              <span>Payment</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Action</span>
            </div>

            {loading ? (
              <div className="px-4 divide-y divide-sand-100">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <EmptyState
                message="No bookings yet. Browse the fleet to find your first ride."
                cta="Browse Fleet"
                href="/explore"
              />
            ) : (
              <div className="divide-y divide-sand-100">
                {bookings.map((b) => {
                  const isDriverOnly = !b.vehicle && b.driver;
                  const title = isDriverOnly
                    ? 'Driver Service'
                    : `${b.vehicle?.make || 'Deleted'} ${b.vehicle?.model || 'Vehicle'}`;
                  return (
                    <div
                      key={b._id}
                      className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1.35fr)_90px_115px_100px_120px] gap-2 md:gap-4 items-center px-4 py-3 hover:bg-sand-100/60 transition-colors duration-100"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={isDriverOnly ? 'https://placehold.co/48x36/f2efea/a49888?text=D' : getImg(b.vehicle)}
                          alt=""
                          className="w-12 h-9 rounded object-cover bg-sand-100 flex-shrink-0"
                        />
                        <span className="text-[0.875rem] font-medium text-sand-900 truncate">
                          {title}
                        </span>
                      </div>
                      <span className="text-[0.8125rem] text-sand-600">
                        {b.startDate
                          ? new Date(b.startDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
                          : '—'}
                        {b.endDate
                          ? ` – ${new Date(b.endDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`
                          : ''}
                      </span>
                      <StatusBadge status={displayStatus(b, now)} />
                      <div className="space-y-1">
                        <span className="block text-[0.8125rem] font-medium text-sand-700">
                          {paymentLabels[b.payment?.method] || 'Not set'}
                        </span>
                        <PaymentProofLink path={b.payment?.proofUrl} />
                      </div>
                      <span className="text-[0.875rem] font-semibold text-sand-900 md:text-right tabular-nums">
                        {b.totalPrice?.toLocaleString() || '—'} EGP
                      </span>
                      <div className="md:text-right">
                        {displayStatus(b, now) === 'active' && !b.renterFinished && (
                          <button
                            onClick={() => returnCar(b._id)}
                            className="text-[0.75rem] font-semibold text-primary-700 hover:text-primary-900 transition-colors"
                          >
                            Return
                          </button>
                        )}
                        {displayStatus(b, now) === 'active' && b.renterFinished && (
                          <span className="text-[0.75rem] text-sand-500">
                            Awaiting return
                          </span>
                        )}
                        {isReviewableBooking(b, now) && (
                          <Link
                            to={`/vehicles/${b.vehicle._id}`}
                            className="text-[0.75rem] font-semibold text-primary-700 hover:text-primary-900 transition-colors"
                          >
                            Review
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Saved */}
      {section === 'saved' && (
        <div>
          <h1 className="text-[1.25rem] font-semibold text-sand-950 mb-5">
            Saved Vehicles
          </h1>
          {savedVehicles.length === 0 ? (
            <EmptyState
              message="You haven't saved any vehicles yet. Tap the heart on any listing to save it here."
              cta="Browse Fleet"
              href="/explore"
            />
          ) : (
            <div className="bg-sand-50 border border-sand-200 rounded-soft overflow-hidden">
              <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_110px_100px] gap-4 px-4 py-2 bg-sand-100 text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 border-b border-sand-200">
                <span>Vehicle</span>
                <span>Location</span>
                <span>Daily Rate</span>
                <span className="text-right">Action</span>
              </div>
              <div className="divide-y divide-sand-100">
                {savedVehicles.map((vehicle) => (
                  <div
                    key={vehicle._id}
                    className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_110px_100px] gap-2 md:gap-4 items-center px-4 py-3 hover:bg-sand-100/60 transition-colors duration-100"
                  >
                    <Link to={`/vehicles/${vehicle._id}`} className="flex items-center gap-3 min-w-0">
                      <img
                        src={getImg(vehicle)}
                        alt=""
                        className="w-12 h-9 rounded object-cover bg-sand-100 flex-shrink-0"
                      />
                      <span className="text-[0.875rem] font-medium text-sand-900 truncate">
                        {vehicle.make} {vehicle.model}
                      </span>
                    </Link>
                    <span className="text-[0.8125rem] text-sand-600 truncate">
                      {getVehicleAreaLabel(vehicle)}
                    </span>
                    <span className="text-[0.875rem] font-semibold text-primary-800 tabular-nums">
                      {vehicle.price_per_day?.toLocaleString() || 'Not set'} EGP
                    </span>
                    <div className="md:text-right">
                      <button
                        type="button"
                        onClick={() => removeSavedVehicle(vehicle._id)}
                        className="text-[0.75rem] font-semibold text-red-600 hover:text-red-800 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </DashboardShell>
  );
}

function MetricTile({ label, value, accent }) {
  return (
    <div className="flex-1 bg-sand-50 px-4 py-3.5 min-w-0">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 mb-0.5">
        {label}
      </p>
      <p
        className={`text-[1.35rem] font-bold tracking-tight tabular-nums ${
          accent ? 'text-green-700' : 'text-sand-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
