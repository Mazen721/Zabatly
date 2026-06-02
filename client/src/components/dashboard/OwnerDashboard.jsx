import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import DashboardShell from './DashboardShell';
import PaymentProofLink from '../PaymentProofLink';
import { API } from '../../config/api';

const getImg = (v) =>
  v?.images?.length > 0
    ? v.images[0]
    : 'https://placehold.co/100x75/f2efea/a49888?text=No+Photo';

const statusColors = {
  upcoming: 'bg-signal-50 text-signal-700 border border-signal-200',
  active: 'bg-green-50 text-green-700 border border-green-200',
  pending: 'bg-signal-50 text-signal-700 border border-signal-200',
  completed: 'bg-primary-50 text-primary-700 border border-primary-200',
  cancelled: 'bg-sand-100 text-sand-600 border border-sand-200',
  expired: 'bg-sand-100 text-sand-600 border border-sand-200',
};

const StatusBadge = ({ status }) => {
  const { t } = useTranslation('dashboard');
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-subtle text-[0.7rem] font-semibold capitalize ${
        statusColors[status] || statusColors.cancelled
      }`}
    >
      {t(`status.${status}`, status)}
    </span>
  );
};

const paymentLabels = {
  card: 'Card',
  vodafone_cash: 'Vodafone Cash',
  instapay: 'InstaPay',
};

const formatRentalDate = (value, locale, fallback) =>
  value
    ? new Date(value).toLocaleString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : fallback;

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

const getRemainingText = (endDate, now, t) => {
  const end = getRentalEndDate(endDate);
  if (!end) return t('time.rentalEndMissing');

  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return t('time.rentalEnded');

  const totalMinutes = Math.ceil(diff / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  return t('time.remaining', { days, hours, minutes });
};

const isPaidBooking = (booking) =>
  booking.paymentStatus === 'paid' || booking.payment?.status === 'confirmed';

const ownerRentalAmount = (booking) => {
  const rentalPrice = Number(booking.rentalPrice || 0);
  if (rentalPrice > 0) return rentalPrice;

  const totalPrice = Number(booking.totalPrice || booking.payment?.amount || 0);
  const serviceFee = Number(booking.serviceFee || 0);
  if (serviceFee > 0) return Math.max(totalPrice - serviceFee, 0);

  return totalPrice > 0 ? Math.round(totalPrice / 1.1) : 0;
};

const isOwnerEarningBooking = (booking) =>
  ['completed', 'active', 'confirmed'].includes(booking.status) || isPaidBooking(booking);

const getBookingEnd = (booking) => getRentalEndDate(booking.endDate);

const isWithinBookingDates = (booking, date) => {
  const start = booking.startDate ? new Date(booking.startDate) : null;
  const end = getBookingEnd(booking);
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return start <= date && end >= date;
};

const isCurrentOwnerRental = (booking, date) =>
  booking.status === 'active' || (booking.status === 'confirmed' && isWithinBookingDates(booking, date));

const isUpcomingOwnerBooking = (booking, date) => {
  const start = booking.startDate ? new Date(booking.startDate) : null;
  return ['pending', 'confirmed'].includes(booking.status) && start && start > date && !isCurrentOwnerRental(booking, date);
};

const isExpiredOwnerBooking = (booking, date) => {
  const end = getBookingEnd(booking);
  return ['expired', 'cancelled', 'completed'].includes(booking.status)
    || (end && end < date && booking.status !== 'active');
};

const SkeletonBlock = () => (
  <div className="animate-pulse space-y-3 py-4">
    <div className="h-3 w-40 bg-sand-200 rounded" />
    <div className="h-2.5 w-28 bg-sand-100 rounded" />
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

export default function OwnerDashboard({ user, returnTarget = null }) {
  const { t, i18n } = useTranslation('dashboard');
  const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-GB';
  const [section, setSection] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const [bRes, vRes] = await Promise.all([
          axios.get(`${API}/api/bookings`, config),
          axios.get(`${API}/api/vehicles`),
        ]);
        const allBookings = bRes.data || [];
        const ownVehicles = (vRes.data || []).filter(
          (v) => v.owner?._id === user._id || v.owner === user._id
        );
        setBookings(allBookings);
        setVehicles(ownVehicles);
      } catch {
        setError(t('owner.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.token, user._id]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const getOwnerId = (b) => b.owner?._id || b.owner || '';
  const myBookings = bookings.filter(
    (b) => getOwnerId(b).toString() === user._id.toString()
  );
  const pendingRequests = myBookings.filter((b) => b.status === 'pending' && !isPaidBooking(b));
  const activeRentals = myBookings.filter((b) => isCurrentOwnerRental(b, now));
  const confirmedBookings = myBookings.filter((b) => b.status === 'confirmed');
  const completedBookings = myBookings.filter((b) => b.status === 'completed');
  const paidBookings = myBookings.filter(isOwnerEarningBooking);
  const upcomingBookings = myBookings.filter((b) => isUpcomingOwnerBooking(b, now));
  const expiredBookings = myBookings.filter((b) => isExpiredOwnerBooking(b, now));
  const revenue = paidBookings.reduce(
    (sum, b) => sum + ownerRentalAmount(b),
    0
  );
  const rentedVehicleIds = new Set(
    activeRentals
      .map((b) => b.vehicle?._id || b.vehicle)
      .filter(Boolean)
      .map((id) => id.toString())
  );
  const rentedCount = rentedVehicleIds.size;
  const availableCount = Math.max(vehicles.length - rentedCount, 0);

  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `${API}/api/bookings/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status } : b))
      );
    } catch {
      setError(t('owner.updateError'));
    }
  };

  const deleteVehicle = async (vehicleId) => {
    try {
      await axios.delete(`${API}/api/vehicles/${vehicleId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setVehicles((prev) => prev.filter((v) => v._id !== vehicleId));
    } catch {
      setError(t('owner.removeError'));
    }
  };

  const navItems = [
    {
      id: 'overview',
      label: t('common.overview'),
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
      id: 'vehicles',
      label: t('owner.myVehicles'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 10.5h11M3.5 6l1.5-3h6l1.5 3" />
          <rect x="2" y="6" width="12" height="4.5" rx="1" />
          <circle cx="4.5" cy="12" r="1" />
          <circle cx="11.5" cy="12" r="1" />
        </svg>
      ),
    },
    {
      id: 'bookings',
      label: t('owner.bookings'),
      badge: pendingRequests.length + activeRentals.length + upcomingBookings.length || null,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2.5" y="3" width="11" height="10.5" rx="1.5" />
          <path d="M5 1.8v2.4M11 1.8v2.4M2.5 6h11" />
        </svg>
      ),
    },
    {
      id: 'earnings',
      label: t('owner.earnings'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12l3-4 3 2 4-6" />
          <path d="M12 4h2v2" />
        </svg>
      ),
    },
    { id: 'div1', type: 'divider', label: '' },
    {
      id: 'add-vehicle',
      label: t('owner.addVehicle'),
      href: '/add-vehicle',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 5.5v5M5.5 8h5" />
        </svg>
      ),
    },
  ];

  const bottomActions = [
    {
      id: 'profile',
      label: t('common.profile'),
      href: '/profile',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="5" r="3" />
          <path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" />
        </svg>
      ),
    },
  ];

  const contextStrip = pendingRequests.length > 0 ? (
    <div className="flex items-center gap-3">
      <span className="inline-block w-2 h-2 rounded-full bg-signal-500" />
      <span className="font-semibold text-sand-800">
        {t('owner.pendingCount', { count: pendingRequests.length })}
      </span>
      <span className="text-sand-500">/</span>
      <button
        onClick={() => setSection('bookings')}
        className="text-[0.8125rem] font-medium text-primary-700 hover:text-primary-900 transition-colors"
      >
        {t('owner.viewBookings')}
      </button>
    </div>
  ) : activeRentals.length > 0 ? (
    <div className="flex items-center gap-3">
      <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <span className="font-semibold text-sand-800">
        {t('owner.activeRentalCount', { count: activeRentals.length })}
      </span>
    </div>
  ) : confirmedBookings.length > 0 ? (
    <div className="flex items-center gap-3">
      <span className="inline-block w-2 h-2 rounded-full bg-primary-600" />
      <span className="font-semibold text-sand-800">
        {t('owner.confirmedCount', { count: confirmedBookings.length })}
      </span>
      <span className="text-sand-500">/</span>
      <button
        onClick={() => setSection('bookings')}
        className="text-[0.8125rem] font-medium text-primary-700 hover:text-primary-900 transition-colors"
      >
        {t('owner.viewBookings')}
      </button>
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
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[0.8125rem] px-4 py-2.5 rounded-subtle mb-5">
          {error}
          <button onClick={() => setError(null)} className="ml-3 font-semibold underline">
            {t('common.dismiss')}
          </button>
        </div>
      )}

      {/* Overview */}
      {section === 'overview' && (
        <div className="space-y-6">
          <h1 className="text-[1.25rem] font-semibold text-sand-950">
            {t('owner.fleetOverview')}
          </h1>

          <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200">
            <MetricTile label={t('owner.listed')} value={vehicles.length} />
            <MetricTile label={t('owner.available')} value={availableCount} accent />
            <MetricTile
              label={t('owner.rented')}
              value={rentedCount}
            />
            <MetricTile label={t('owner.revenue')} value={`${revenue.toLocaleString()} ${t('common.egp')}`} />
          </div>

          {/* Pending requests preview */}
          {pendingRequests.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[0.95rem] font-semibold text-sand-900">
                  {t('owner.pendingRequests')}
                </h2>
                <button
                  onClick={() => setSection('bookings')}
                  className="text-[0.75rem] font-medium text-primary-600 hover:text-primary-800 transition-colors"
                >
                  {t('common.viewAll')}
                </button>
              </div>
              <div className="space-y-2">
                {pendingRequests.slice(0, 3).map((b) => (
                  <RequestRow
                    key={b._id}
                    booking={b}
                    onAccept={() => updateStatus(b._id, 'active')}
                    onDecline={() => updateStatus(b._id, 'cancelled')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Active rentals */}
          <div>
            <h2 className="text-[0.95rem] font-semibold text-sand-900 mb-3">
              {t('owner.activeRentals')}
            </h2>
            {loading ? (
              <SkeletonBlock />
            ) : activeRentals.length === 0 ? (
              <div className="border border-sand-200 rounded-soft py-6 text-center text-[0.8125rem] text-sand-500">
                {t('owner.noActiveRentals')}
              </div>
            ) : (
              <div className="border border-sand-200 rounded-soft overflow-hidden divide-y divide-sand-100">
                {activeRentals.map((b) => (
                  <BookingRow
                    key={b._id}
                    booking={b}
                    now={now}
                    onComplete={() => updateStatus(b._id, 'completed')}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vehicles */}
      {section === 'vehicles' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-[1.25rem] font-semibold text-sand-950">
              {t('owner.myVehicles')}
            </h1>
            <Link
              to="/add-vehicle"
              className="text-[0.8125rem] font-semibold bg-primary-800 text-white px-4 py-2 rounded-subtle hover:bg-primary-900 transition-colors duration-150"
            >
              + {t('owner.addVehicle')}
            </Link>
          </div>

          {vehicles.length === 0 ? (
            <EmptyState
              message={t('owner.emptyVehicles')}
              cta={t('owner.addFirstVehicle')}
              href="/add-vehicle"
            />
          ) : (
            <div className="border border-sand-200 rounded-soft overflow-hidden">
              <div className="hidden md:grid grid-cols-[minmax(0,2fr)_100px_130px_80px_80px] gap-4 px-4 py-2 bg-sand-100 text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 border-b border-sand-200">
                <span>{t('common.vehicle')}</span>
                <span>{t('common.status')}</span>
                <span>{t('renter.dailyRate')}</span>
                <span>{t('owner.bookings')}</span>
                <span className="text-right">{t('common.actions')}</span>
              </div>
              <div className="divide-y divide-sand-100">
                {vehicles.map((v) => {
                  const vBookings = myBookings.filter(
                    (b) =>
                      b.vehicle?._id === v._id || b.vehicle === v._id
                  );
                  return (
                    <div
                      key={v._id}
                      className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_100px_130px_80px_80px] gap-2 md:gap-4 items-center px-4 py-3 hover:bg-sand-100/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={getImg(v)}
                          alt=""
                          className="w-12 h-9 rounded object-cover bg-sand-100 flex-shrink-0"
                        />
                        <span className="text-[0.875rem] font-medium text-sand-900 truncate">
                          {v.make} {v.model}
                        </span>
                      </div>
                      <div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-subtle text-[0.7rem] font-semibold ${
                            v.isAvailable !== false
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-sand-100 text-sand-600 border border-sand-200'
                          }`}
                        >
                          {v.isAvailable !== false ? t('status.available') : t('status.rented')}
                        </span>
                      </div>
                      <span className="text-[0.8125rem] text-sand-700 tabular-nums">
                        {v.pricePerDay?.toLocaleString() || t('common.notSet')} {t('common.egp')}/{t('common.day')}
                      </span>
                      <span className="text-[0.8125rem] text-sand-600 tabular-nums">
                        {vBookings.length}
                      </span>
                      <div className="md:text-right">
                        <button
                          onClick={() => deleteVehicle(v._id)}
                          className="text-[0.75rem] font-medium text-red-600 hover:text-red-800 transition-colors"
                        >
                          {t('common.remove')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bookings */}
      {section === 'bookings' && (
        <div>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-[1.25rem] font-semibold text-sand-950">
                {t('owner.bookings')}
              </h1>
              <p className="mt-1 text-[0.8125rem] text-sand-500">
                {t('owner.bookingsDescription')}
              </p>
            </div>
          </div>

          {loading ? (
            <SkeletonBlock />
          ) : myBookings.length === 0 ? (
            <div className="border border-sand-200 rounded-soft py-10 text-center text-[0.8125rem] text-sand-500">
              {t('owner.emptyOwnerBookings')}
            </div>
          ) : (
            <div className="space-y-6">
              <section>
                <h2 className="mb-3 text-[0.95rem] font-semibold text-sand-900">{t('owner.pendingRequests')}</h2>
                {pendingRequests.length === 0 ? (
                  <div className="border border-sand-200 rounded-soft py-6 text-center text-[0.8125rem] text-sand-500">
                    {t('owner.noPendingRequests')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingRequests.map((b) => (
                      <RequestRow
                        key={b._id}
                        booking={b}
                        onAccept={() => updateStatus(b._id, 'active')}
                        onDecline={() => updateStatus(b._id, 'cancelled')}
                      />
                    ))}
                  </div>
                )}
              </section>
              <BookingGroup
                title={t('owner.activeBookings')}
                empty={t('owner.noActiveBookings')}
                bookings={activeRentals}
                now={now}
                onAccept={updateStatus}
                onDecline={updateStatus}
                onComplete={updateStatus}
              />
              <BookingGroup
                title={t('owner.upcomingBookings')}
                empty={t('owner.noUpcomingBookings')}
                bookings={upcomingBookings}
                now={now}
                onAccept={updateStatus}
                onDecline={updateStatus}
                onComplete={updateStatus}
              />
              <BookingGroup
                title={t('owner.expiredBookings')}
                empty={t('owner.noExpiredBookings')}
                bookings={expiredBookings}
                now={now}
                onAccept={updateStatus}
                onDecline={updateStatus}
                onComplete={updateStatus}
              />
            </div>
          )}
        </div>
      )}

      {/* Earnings */}
      {section === 'earnings' && (
        <div>
          <h1 className="text-[1.25rem] font-semibold text-sand-950 mb-5">
            {t('owner.earnings')}
          </h1>
          <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200 mb-6">
            <MetricTile label={t('owner.totalRevenue')} value={`${revenue.toLocaleString()} ${t('common.egp')}`} />
            <MetricTile label={t('owner.completedTrips')} value={completedBookings.length} />
            <MetricTile label={t('owner.activeRentals')} value={activeRentals.length} accent />
          </div>

          <h2 className="text-[0.95rem] font-semibold text-sand-900 mb-3">
            {t('owner.transactionHistory')}
          </h2>
          <div className="border border-sand-200 rounded-soft overflow-hidden">
            <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_100px] gap-4 px-4 py-2 bg-sand-100 text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 border-b border-sand-200">
              <span>{t('common.vehicle')}</span>
              <span>{t('owner.renter')}</span>
              <span>{t('owner.date')}</span>
              <span className="text-right">{t('common.amount')}</span>
            </div>
            {paidBookings.length === 0 ? (
              <div className="py-10 text-center text-[0.8125rem] text-sand-500">
                {t('owner.noTransactions')}
              </div>
            ) : (
              <div className="divide-y divide-sand-100">
                {paidBookings.map((b) => (
                  <div
                    key={b._id}
                    className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_100px] gap-2 md:gap-4 items-center px-4 py-3"
                  >
                    <span className="text-[0.875rem] text-sand-800 truncate">
                      {b.vehicle?.make} {b.vehicle?.model}
                    </span>
                    <span className="text-[0.8125rem] text-sand-600">
                      <Link to={`/user/${b.renter?._id}`} className="text-primary-700 hover:text-primary-900 transition-colors">{b.renter?.name || t('common.user')}</Link>
                    </span>
                    <span className="text-[0.8125rem] text-sand-600">
                      {b.endDate
                        ? new Date(b.endDate).toLocaleDateString('en-GB', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : t('common.notSet')}
                    </span>
                    <span className="text-[0.875rem] font-semibold text-sand-900 md:text-right tabular-nums">
                      {ownerRentalAmount(b).toLocaleString()} {t('common.egp')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function RequestRow({ booking: b, onAccept, onDecline }) {
  return (
    <div className="flex items-center gap-4 border border-sand-200 rounded-soft px-4 py-3 bg-sand-50 hover:bg-sand-100/60 transition-colors">
      <img
        src={getImg(b.vehicle)}
        alt=""
        className="w-12 h-9 rounded object-cover bg-sand-100 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[0.875rem] font-medium text-sand-900">
          <Link to={`/user/${b.renter?._id}`} className="text-primary-700 hover:text-primary-900 transition-colors">{b.renter?.name || 'Guest'}</Link>{' '}
          <span className="text-sand-500 font-normal">
            wants {b.vehicle?.make} {b.vehicle?.model}
          </span>
        </p>
        <p className="text-[0.8125rem] font-semibold text-sand-800 tabular-nums">
          {ownerRentalAmount(b).toLocaleString()} EGP
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-[0.72rem] font-medium text-sand-500">
            {paymentLabels[b.payment?.method] || 'Payment pending'}
          </span>
          <PaymentProofLink path={b.payment?.proofUrl} />
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={onAccept}
          className="text-[0.75rem] font-semibold bg-primary-800 text-white px-3.5 py-1.5 rounded-subtle hover:bg-primary-900 transition-colors"
        >
          Accept
        </button>
        <button
          onClick={onDecline}
          className="text-[0.75rem] font-semibold text-sand-600 bg-sand-100 border border-sand-200 px-3.5 py-1.5 rounded-subtle hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

function BookingGroup({ title, empty, bookings, now, onAccept, onDecline, onComplete }) {
  const sortedBookings = [...bookings].sort(
    (a, b) => new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0)
  );

  return (
    <section>
      <h2 className="mb-3 text-[0.95rem] font-semibold text-sand-900">{title}</h2>
      {sortedBookings.length === 0 ? (
        <div className="border border-sand-200 rounded-soft py-6 text-center text-[0.8125rem] text-sand-500">
          {empty}
        </div>
      ) : (
        <div className="border border-sand-200 rounded-soft overflow-hidden divide-y divide-sand-100">
          {sortedBookings.map((b) => (
            <BookingRow
              key={b._id}
              booking={b}
              now={now}
              onAccept={() => onAccept(b._id, 'active')}
              onDecline={() => onDecline(b._id, 'cancelled')}
              onComplete={() => onComplete(b._id, 'completed')}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function BookingRow({ booking: b, now, onAccept, onDecline, onComplete }) {
  const { t, i18n } = useTranslation('dashboard');
  const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-GB';
  const paid = isPaidBooking(b);
  const canDecline = b.status === 'pending' && !paid;
  const canAccept = b.status === 'pending' && !paid;
  const remaining = getRemainingText(b.endDate, now, t);

  return (
    <div className="px-4 py-3 hover:bg-sand-100/60 transition-colors duration-100">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <img
            src={getImg(b.vehicle)}
            alt=""
            className="w-12 h-9 rounded object-cover bg-sand-100 flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[0.875rem] font-medium text-sand-900 truncate">
                {b.vehicle?.make} {b.vehicle?.model}
              </p>
              <StatusBadge status={b.status} />
              {paid && (
                <span className="inline-block px-2 py-0.5 rounded-subtle text-[0.7rem] font-semibold bg-green-50 text-green-700 border border-green-200">
                  {t('status.paid')}
                </span>
              )}
            </div>
            <p className="mt-1 text-[0.75rem] text-sand-500">
              {t('owner.rentedBy')} <Link to={`/user/${b.renter?._id}`} className="text-primary-700 hover:text-primary-900 transition-colors font-medium">{b.renter?.name || t('common.user')}</Link>
            </p>
            <div className="mt-3 grid gap-2 text-[0.75rem] sm:grid-cols-2">
              <div className="rounded-subtle bg-sand-100 px-3 py-2">
                <span className="block font-semibold uppercase tracking-[0.04em] text-sand-500">{t('owner.startDate')}</span>
                <span className="mt-0.5 block font-semibold tabular-nums text-sand-800">{formatRentalDate(b.startDate, locale, t('common.notSet'))}</span>
              </div>
              <div className="rounded-subtle bg-sand-100 px-3 py-2">
                <span className="block font-semibold uppercase tracking-[0.04em] text-sand-500">{t('owner.endDate')}</span>
                <span className="mt-0.5 block font-semibold tabular-nums text-sand-800">{formatRentalDate(getRentalEndDate(b.endDate) || b.endDate, locale, t('common.notSet'))}</span>
              </div>
            </div>
            <div className="mt-2 rounded-subtle border border-primary-100 bg-primary-50 px-3 py-2 text-[0.78rem] font-semibold tabular-nums text-primary-800">
              {t('owner.rentalEndsIn', { time: remaining })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <span className="text-[0.8125rem] font-semibold tabular-nums text-sand-900">
            {ownerRentalAmount(b).toLocaleString(locale)} {t('common.egp')}
          </span>
          <PaymentProofLink path={b.payment?.proofUrl} />
          {canAccept && (
            <button
              onClick={onAccept}
              className="text-[0.75rem] font-semibold bg-primary-800 text-white px-3.5 py-1.5 rounded-subtle hover:bg-primary-900 transition-colors"
            >
              {t('common.accept')}
            </button>
          )}
          {canDecline && (
            <button
              onClick={onDecline}
              className="text-[0.75rem] font-semibold text-sand-600 bg-sand-100 border border-sand-200 px-3.5 py-1.5 rounded-subtle hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
            >
              {t('common.decline')}
            </button>
          )}
          {b.status === 'active' && b.renterFinished && (
            <button
              onClick={onComplete}
              className="text-[0.75rem] font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-subtle hover:bg-green-100 transition-colors"
            >
              {t('owner.confirmReturn')}
            </button>
          )}
          {paid && b.status === 'confirmed' && (
            <span className="text-[0.75rem] font-semibold text-sand-600">
              {t('owner.autoConfirmed')}
            </span>
          )}
        </div>
      </div>
    </div>
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
