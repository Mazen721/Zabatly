import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import DashboardShell from '../components/dashboard/DashboardShell';
import PaymentProofLink from '../components/PaymentProofLink';
import { API } from '../config/api';
import { exportAdminReport } from '../utils/pdfReports';

const StatusBadge = ({ status }) => {
  const { t } = useTranslation('admin');
  const map = {
    active: 'bg-green-50 text-green-700 border border-green-200',
    verified: 'bg-green-50 text-green-700 border border-green-200',
    rejected: 'bg-red-50 text-red-700 border border-red-200',
    pending: 'bg-signal-50 text-signal-700 border border-signal-200',
    completed: 'bg-primary-50 text-primary-700 border border-primary-200',
    cancelled: 'bg-sand-100 text-sand-600 border border-sand-200',
    unsubmitted: 'bg-sand-100 text-sand-600 border border-sand-200',
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-subtle text-[0.7rem] font-semibold capitalize ${
        map[status] || map.pending
      }`}
    >
      {t(`statuses.${status}`, status)}
    </span>
  );
};

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '-';

const money = (value) => `${Number(value || 0).toLocaleString()} EGP`;

export default function AdminDashboard() {
  const { t } = useTranslation('admin');
  const [section, setSection] = useState('overview');
  const [pending, setPending] = useState({ identity: [], licenses: [], vehicles: [] });
  const [platform, setPlatform] = useState({
    stats: null,
    users: [],
    vehicles: [],
    bookings: [],
    reviews: [],
  });
  const [contactMessages, setContactMessages] = useState([]);
  const [expandedMessageId, setExpandedMessageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [paymentActionId, setPaymentActionId] = useState(null);
  const [payoutActionId, setPayoutActionId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectType, setRejectType] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (!stored) return navigate('/login');
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'admin') return navigate('/');
    setUser(parsed);
  }, [navigate]);

  const fetchPending = async () => {
    if (!user) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const [{ data }, { data: overview }, { data: messages }] = await Promise.all([
        axios.get(`${API}/api/admin/pending`, config),
        axios.get(`${API}/api/admin/overview`, config),
        axios.get(`${API}/api/contact`, config),
      ]);
      setPending({
        identity: data?.identity || [],
        licenses: data?.licenses || [],
        vehicles: data?.vehicles || [],
      });
      setPlatform({
        stats: overview?.stats || null,
        users: overview?.users || [],
        vehicles: overview?.vehicles || [],
        bookings: overview?.bookings || [],
        reviews: overview?.reviews || [],
      });
      setContactMessages(messages || []);
    } catch {
      setError(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchPending();
  }, [user]);

  const handleReview = async (id, type, status, reason = '') => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${API}/api/admin/review`, { id, type, status, reason }, config);
      fetchPending();
      setRejectId(null);
      setRejectReason('');
    } catch {
      setError(t('reviewError'));
    }
  };

  const totalPending =
    (pending.identity?.length || 0) +
    (pending.licenses?.length || 0) +
    (pending.vehicles?.length || 0);
  const stats = platform.stats || {};
  const unreadCount = contactMessages.filter((m) => !m.isRead).length;

  const handleMarkAsRead = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.patch(`${API}/api/contact/${id}/read`, {}, config);
      setContactMessages((prev) =>
        prev.map((m) => (m._id === id ? { ...m, isRead: true } : m))
      );
    } catch {
      setError(t('reviewError'));
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`${API}/api/contact/${id}`, config);
      setContactMessages((prev) => prev.filter((m) => m._id !== id));
      if (expandedMessageId === id) setExpandedMessageId(null);
    } catch {
      setError(t('reviewError'));
    }
  };

  const handleExportPdf = async () => {
    await exportAdminReport({ user, pending, platform, contactMessages, t });
  };

  const handlePaymentStatus = async (paymentId, status) => {
    try {
      setPaymentActionId(paymentId);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.patch(`${API}/api/payments/${paymentId}/status`, { status }, config);
      setSuccess(status === 'confirmed' ? t('paymentConfirmed') : t('paymentRejected'));
      fetchPending();
    } catch (err) {
      setError(err.response?.data?.message || t('paymentReviewError'));
    } finally {
      setPaymentActionId(null);
    }
  };

  const handlePayoutSent = async (bookingId) => {
    try {
      setPayoutActionId(bookingId);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.patch(`${API}/api/bookings/${bookingId}/payout`, {}, config);
      setSuccess(t('payoutSent'));
      fetchPending();
    } catch (err) {
      setError(err.response?.data?.message || t('payoutSendError'));
    } finally {
      setPayoutActionId(null);
    }
  };

  const navItems = [
    {
      id: 'overview',
      label: t('overview'),
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
      id: 'verifications',
      label: t('verifications'),
      badge: totalPending || null,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 1.5l5.5 2v4.5c0 3.5-2.5 5.5-5.5 7-3-1.5-5.5-3.5-5.5-7V3.5L8 1.5z" />
          <path d="M6 8l1.5 1.5L10.5 6" />
        </svg>
      ),
    },
    {
      id: 'users',
      label: t('users'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="5" r="2.5" />
          <path d="M1 13c0-2.8 2.2-4 5-4s5 1.2 5 4" />
          <circle cx="12" cy="5.5" r="1.5" />
          <path d="M12.5 9c1.5.3 2.5 1.2 2.5 3" />
        </svg>
      ),
    },
    {
      id: 'bookings',
      label: t('bookings'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 2.5h7.5l3 3V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z" />
          <path d="M8 6v3M8 11h.01" />
        </svg>
      ),
    },
    {
      id: 'reviews',
      label: t('reviews'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2.5l1.6 3.2 3.5.5-2.5 2.5.6 3.5L8 10.5l-3.2 1.7.6-3.5L2.9 6.2l3.5-.5L8 2.5z" />
        </svg>
      ),
    },
    {
      id: 'fleet',
      label: t('fleet'),
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
      id: 'messages',
      label: t('messages'),
      badge: unreadCount || null,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1.5" y="3" width="13" height="10" rx="1.5" />
          <path d="M1.5 4.5L8 9l6.5-4.5" />
        </svg>
      ),
    },
  ];

  const bottomActions = [
    {
      id: 'profile',
      label: t('profile'),
      href: '/profile',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="5" r="3" />
          <path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" />
        </svg>
      ),
    },
  ];

  const contextStrip = totalPending > 0 ? (
    <div className="flex items-center gap-3">
      <span className="inline-block w-2 h-2 rounded-full bg-signal-500" />
      <span className="font-semibold text-sand-800">
        {t('needsReviewCount', { count: totalPending })}
      </span>
      <span className="text-sand-500">·</span>
      <button
        onClick={() => setSection('verifications')}
        className="text-[0.8125rem] font-medium text-primary-700 hover:text-primary-900 transition-colors"
      >
        {t('openQueue')}
      </button>
    </div>
  ) : null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-50">
        <p className="text-[0.875rem] text-sand-500">{t('loading')}</p>
      </div>
    );
  }

  const getDocImage = (item) => {
    const path =
      item.identity_document?.document_url ||
      item.driving_license?.document_url ||
      item.car_license?.document_url ||
      item.identity_document?.extracted_data?.image_url ||
      item.driving_license?.extracted_data?.image_url ||
      item.car_license?.extracted_data?.image_url;
    return path || null;
  };

  const renderVerificationItem = (item, type) => {
    if (!item) return null;
    const imgUrl = getDocImage(item);
    const isRejecting = rejectId === item._id && rejectType === type;

    return (
      <div
        key={item._id}
        className="border border-sand-200 rounded-soft overflow-hidden bg-sand-50"
      >
        <div className="relative h-40 bg-sand-100">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={t('document')}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[0.8125rem] text-sand-400">
              {t('noDocument')}
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-[0.875rem] font-medium text-sand-900 mb-0.5">
            {item.name || `${item.make || t('unknown')} ${item.model || t('vehicle')}`}
          </p>
          <p className="text-[0.75rem] text-sand-500 mb-3">
            {item.email || `${t('owner')}: ${item.owner?.name || t('unknown')}`}
          </p>

          {isRejecting ? (
            <div className="space-y-2">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t('reason')}
                className="w-full bg-sand-100 border border-sand-200 rounded-subtle px-3 py-2 text-[0.8125rem] text-sand-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (rejectReason.trim()) {
                      handleReview(item._id, type, 'rejected', rejectReason);
                    }
                  }}
                  disabled={!rejectReason.trim()}
                  className="flex-1 text-[0.75rem] font-semibold bg-red-600 text-white py-1.5 rounded-subtle hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {t('confirmReject')}
                </button>
                <button
                  onClick={() => {
                    setRejectId(null);
                    setRejectReason('');
                  }}
                  className="flex-1 text-[0.75rem] font-semibold text-sand-600 bg-sand-100 border border-sand-200 py-1.5 rounded-subtle hover:bg-sand-200 transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleReview(item._id, type, 'verified')}
                className="flex-1 text-[0.75rem] font-semibold bg-green-600 text-white py-1.5 rounded-subtle hover:bg-green-700 transition-colors"
              >
                {t('approve')}
              </button>
              <button
                onClick={() => {
                  setRejectId(item._id);
                  setRejectType(type);
                  setRejectReason('');
                }}
                className="flex-1 text-[0.75rem] font-semibold text-sand-600 bg-sand-100 border border-sand-200 py-1.5 rounded-subtle hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
              >
                {t('reject')}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <DashboardShell
      navItems={navItems}
      activeSection={section}
      onSectionChange={setSection}
      contextStrip={contextStrip}
      user={user}
      bottomActions={bottomActions}
    >
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[0.8125rem] px-4 py-2.5 rounded-subtle mb-5">
          {error}
          <button onClick={() => setError(null)} className="ml-3 font-semibold underline">
            {t('dismiss')}
          </button>
        </div>
      )}
      {success && (
        <div className="mb-5 flex items-center justify-between rounded-subtle border border-green-200 bg-green-50 px-4 py-2.5 text-[0.8125rem] text-green-800">
          <span className="font-semibold">{success}</span>
          <button onClick={() => setSuccess(null)} className="font-semibold underline">{t('dismiss')}</button>
        </div>
      )}

      <div className="mb-5 flex justify-end">
        <button
          type="button"
          onClick={handleExportPdf}
          className="inline-flex items-center gap-2 rounded-subtle bg-primary-800 px-4 py-2 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-primary-900"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v8" />
            <path d="M5 7l3 3 3-3" />
            <path d="M3 13.5h10" />
          </svg>
          {t('exportPdf')}
        </button>
      </div>

      {/* Overview */}
      {section === 'overview' && (
        <div className="space-y-6">
          <h1 className="text-[1.25rem] font-semibold text-sand-950">
            {t('adminOverview')}
          </h1>

          <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200">
            <MetricTile label={t('identity')} value={pending.identity?.length || 0} accent={pending.identity?.length > 0} />
            <MetricTile label={t('licenses')} value={pending.licenses?.length || 0} accent={pending.licenses?.length > 0} />
            <MetricTile label={t('vehicles')} value={pending.vehicles?.length || 0} accent={pending.vehicles?.length > 0} />
            <MetricTile label={t('totalQueue')} value={totalPending} />
          </div>

          <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200">
            <MetricTile label={t('users')} value={stats.users?.total || 0} />
            <MetricTile label={t('availableCars')} value={`${stats.vehicles?.available || 0}/${stats.vehicles?.total || 0}`} accent={(stats.vehicles?.available || 0) > 0} />
            <MetricTile label={t('activeBookings')} value={stats.bookings?.byStatus?.active || 0} accent={(stats.bookings?.byStatus?.active || 0) > 0} />
            <MetricTile label={t('revenue')} value={money(stats.bookings?.revenue)} />
            <MetricTile label={t('netProfit')} value={money(stats.bookings?.netProfit)} accent />
          </div>

          {/* Quick verification preview */}
          {totalPending > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[0.95rem] font-semibold text-sand-900">
                  {t('needsReview')}
                </h2>
                <button
                  onClick={() => setSection('verifications')}
                  className="text-[0.75rem] font-medium text-primary-600 hover:text-primary-800 transition-colors"
                >
                  {t('fullQueue')}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  ...pending.identity.slice(0, 1).map((i) => ({ item: i, type: 'identity' })),
                  ...pending.licenses.slice(0, 1).map((i) => ({ item: i, type: 'license' })),
                  ...pending.vehicles.slice(0, 1).map((i) => ({ item: i, type: 'vehicle' })),
                ].map(({ item, type }) => renderVerificationItem(item, type))}
              </div>
            </div>
          ) : (
            <div className="border border-sand-200 rounded-soft py-10 text-center">
              <p className="text-[0.95rem] font-semibold text-sand-800">
                {t('allClear')}
              </p>
              <p className="text-[0.8125rem] text-sand-500 mt-1">
                {t('noPendingReview')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Verifications */}
      {section === 'verifications' && (
        <div className="space-y-8">
          <h1 className="text-[1.25rem] font-semibold text-sand-950">
            {t('verificationQueue')}
          </h1>

          {loading ? (
            <div className="py-12 text-center text-[0.875rem] text-sand-500 animate-pulse">
              {t('loadingVerification')}
            </div>
          ) : (
            <>
              <VerificationSection
                title={t('identityDocuments')}
                count={pending.identity?.length || 0}
                items={pending.identity}
                type="identity"
                renderItem={renderVerificationItem}
              />
              <VerificationSection
                title={t('drivingLicenses')}
                count={pending.licenses?.length || 0}
                items={pending.licenses}
                type="license"
                renderItem={renderVerificationItem}
              />
              <VerificationSection
                title={t('vehicleLicenses')}
                count={pending.vehicles?.length || 0}
                items={pending.vehicles}
                type="vehicle"
                renderItem={renderVerificationItem}
              />
            </>
          )}
        </div>
      )}

      {/* Users */}
      {section === 'users' && (
        <div className="space-y-5">
          <h1 className="text-[1.25rem] font-semibold text-sand-950 mb-5">
            {t('userManagement')}
          </h1>
          <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200">
            <MetricTile label={t('allUsers')} value={stats.users?.total || 0} />
            <MetricTile label={t('renters')} value={(stats.users?.byRole?.user || 0) + (stats.users?.byRole?.renter || 0)} />
            <MetricTile label={t('owners')} value={stats.users?.byRole?.agency || 0} />
            <MetricTile label={t('drivers')} value={stats.users?.byRole?.driver || 0} />
          </div>
          <div className="border border-sand-200 rounded-soft overflow-hidden">
            <div className="hidden md:grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.5fr)_90px_110px_110px] gap-4 bg-sand-100 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500">
              <span>{t('user')}</span>
              <span>{t('email')}</span>
              <span>{t('role')}</span>
              <span>{t('kyc')}</span>
              <span>{t('joined')}</span>
            </div>
            <div className="divide-y divide-sand-100">
              {platform.users.map((item) => (
                <div key={item._id} className="grid grid-cols-1 gap-2 px-4 py-3 text-[0.85rem] md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.5fr)_90px_110px_110px] md:items-center md:gap-4">
                  <span className="font-semibold text-sand-900">{item.name}</span>
                  <span className="truncate text-sand-600">{item.email}</span>
                  <span className="capitalize text-sand-700">{t(`roles.${item.role}`, item.role)}</span>
                  <StatusBadge status={item.kyc_status || 'unsubmitted'} />
                  <span className="text-sand-500">{formatDate(item.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bookings */}
      {section === 'bookings' && (
        <div className="space-y-5">
          <h1 className="text-[1.25rem] font-semibold text-sand-950 mb-5">
            {t('bookings')}
          </h1>
          <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200">
            <MetricTile label={t('total')} value={stats.bookings?.total || 0} />
            <MetricTile label={t('pending')} value={stats.bookings?.byStatus?.pending || 0} accent={(stats.bookings?.byStatus?.pending || 0) > 0} />
            <MetricTile label={t('active')} value={stats.bookings?.byStatus?.active || 0} accent={(stats.bookings?.byStatus?.active || 0) > 0} />
            <MetricTile label={t('completed')} value={stats.bookings?.byStatus?.completed || 0} />
          </div>
          <section className="overflow-hidden rounded-soft border border-sand-200" aria-labelledby="payment-review-title">
            <div className="flex items-center justify-between gap-4 border-b border-sand-200 bg-sand-100 px-4 py-3">
              <div>
                <h2 id="payment-review-title" className="text-[0.95rem] font-semibold text-sand-900">{t('paymentReview')}</h2>
                <p className="mt-0.5 text-[0.75rem] text-sand-500">{t('paymentReviewDescription')}</p>
              </div>
              <span className="rounded-subtle border border-signal-200 bg-signal-50 px-2 py-0.5 text-[0.7rem] font-semibold text-signal-700">
                {platform.bookings.filter((booking) => booking.payment?.status === 'pending').length}
              </span>
            </div>
            {platform.bookings.filter((booking) => booking.payment?.status === 'pending').length === 0 ? (
              <p className="px-4 py-5 text-[0.8125rem] text-sand-500">{t('noPendingPayments')}</p>
            ) : (
              <div className="divide-y divide-sand-100">
                {platform.bookings.filter((booking) => booking.payment?.status === 'pending').map((booking) => (
                  <div key={booking._id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[0.85rem] font-semibold text-sand-900">{booking.vehicle ? `${booking.vehicle.make} ${booking.vehicle.model}` : t('driverRequest')}</p>
                      <p className="mt-0.5 text-[0.75rem] text-sand-500">{booking.renter?.name || t('unknown')} · {money(booking.payment?.amount || booking.totalPrice)}</p>
                      <PaymentProofLink path={booking.payment?.proofUrl} />
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button type="button" disabled={paymentActionId === booking.payment?._id} onClick={() => handlePaymentStatus(booking.payment._id, 'confirmed')} className="rounded-subtle bg-primary-800 px-3 py-2 text-[0.75rem] font-semibold text-white transition-colors hover:bg-primary-900 disabled:opacity-50">{paymentActionId === booking.payment?._id ? t('processing') : t('confirmPayment')}</button>
                      <button type="button" disabled={paymentActionId === booking.payment?._id} onClick={() => handlePaymentStatus(booking.payment._id, 'failed')} className="rounded-subtle border border-red-200 bg-red-50 px-3 py-2 text-[0.75rem] font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50">{t('rejectPayment')}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="overflow-hidden rounded-soft border border-sand-200" aria-labelledby="payout-review-title">
            <div className="border-b border-sand-200 bg-sand-100 px-4 py-3">
              <h2 id="payout-review-title" className="text-[0.95rem] font-semibold text-sand-900">{t('payoutReview')}</h2>
              <p className="mt-0.5 text-[0.75rem] text-sand-500">{t('payoutReviewDescription')}</p>
            </div>
            {platform.bookings.filter((booking) => booking.payoutStatus === 'pending').length === 0 ? (
              <p className="px-4 py-5 text-[0.8125rem] text-sand-500">{t('noPendingPayouts')}</p>
            ) : (
              <div className="divide-y divide-sand-100">
                {platform.bookings.filter((booking) => booking.payoutStatus === 'pending').map((booking) => {
                  const payout = booking.owner?.payoutInfo;
                  const payoutReady = payout?.method && payout?.accountNumber && payout?.accountName;
                  return <div key={booking._id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 text-[0.8125rem] text-sand-700">
                      <p className="font-semibold text-sand-900">{booking.owner?.name || t('unknown')} · {money(booking.payoutAmount)}</p>
                      {payoutReady ? <p className="mt-1 text-sand-600">{t('method')}: {t(`payoutMethods.${payout.method}`)} · {t('account')}: {payout.accountNumber} · {t('name')}: {payout.accountName}</p> : <p className="mt-1 font-medium text-red-700">{t('payoutDetailsMissing')}</p>}
                    </div>
                    {payoutReady && <button type="button" disabled={payoutActionId === booking._id} onClick={() => handlePayoutSent(booking._id)} className="shrink-0 rounded-subtle bg-signal-500 px-3 py-2 text-[0.75rem] font-semibold text-primary-950 transition-colors hover:bg-signal-600 disabled:opacity-50">{payoutActionId === booking._id ? t('processing') : t('markPayoutSent')}</button>}
                  </div>;
                })}
              </div>
            )}
          </section>
          <div className="border border-sand-200 rounded-soft overflow-hidden">
            <div className="hidden lg:grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_90px_110px] gap-4 bg-sand-100 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500">
              <span>{t('booking')}</span>
              <span>{t('renter')}</span>
              <span>{t('provider')}</span>
              <span>{t('status')}</span>
              <span className="text-right">{t('total')}</span>
            </div>
            <div className="divide-y divide-sand-100">
              {platform.bookings.map((item) => (
                <div key={item._id} className="grid grid-cols-1 gap-2 px-4 py-3 text-[0.85rem] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_90px_110px] lg:items-center lg:gap-4">
                  <span className="font-semibold text-sand-900">
                    {item.vehicle ? `${item.vehicle.make} ${item.vehicle.model}` : t('driverRequest')}
                    <span className="block text-[0.74rem] font-normal text-sand-500">{formatDate(item.createdAt)}</span>
                  </span>
                  <span className="text-sand-700">{item.renter?.name || t('unknown')}</span>
                  <span className="text-sand-700">{item.owner?.name || item.driver?.name || t('unknown')}</span>
                  <StatusBadge status={item.status} />
                  <span className="space-y-1 font-semibold text-sand-900 tabular-nums lg:text-right">
                    <span className="block">{money(item.totalPrice)}</span>
                    <PaymentProofLink path={item.payment?.proofUrl} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fleet */}
      {section === 'fleet' && (
        <div className="space-y-5">
          <h1 className="text-[1.25rem] font-semibold text-sand-950 mb-5">
            {t('fleetOverview')}
          </h1>
          <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200">
            <MetricTile label={t('vehicles')} value={stats.vehicles?.total || 0} />
            <MetricTile label={t('available')} value={stats.vehicles?.available || 0} accent={(stats.vehicles?.available || 0) > 0} />
            <MetricTile label={t('rented')} value={stats.vehicles?.rented || 0} />
            <MetricTile label={t('pendingKyc')} value={stats.vehicles?.pendingKyc || 0} accent={(stats.vehicles?.pendingKyc || 0) > 0} />
          </div>
          <div className="border border-sand-200 rounded-soft overflow-hidden">
            <div className="hidden lg:grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_90px_100px_110px] gap-4 bg-sand-100 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500">
              <span>{t('vehicle')}</span>
              <span>{t('owner')}</span>
              <span>{t('status')}</span>
              <span>{t('kyc')}</span>
              <span className="text-right">{t('dailyPrice')}</span>
            </div>
            <div className="divide-y divide-sand-100">
              {platform.vehicles.map((item) => (
                <div key={item._id} className="grid grid-cols-1 gap-2 px-4 py-3 text-[0.85rem] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_90px_100px_110px] lg:items-center lg:gap-4">
                  <span className="font-semibold text-sand-900">
                    {item.make} {item.model}
                    <span className="block text-[0.74rem] font-normal capitalize text-sand-500">{item.year} / {item.type}</span>
                  </span>
                  <span className="text-sand-700">{item.owner?.name || t('unknown')}</span>
                  <span className={`inline-block px-2 py-0.5 rounded-subtle text-[0.7rem] font-semibold ${
                    item.isAvailable === false
                      ? 'bg-sand-100 text-sand-600 border border-sand-200'
                      : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    {item.isAvailable === false ? t('rented') : t('available')}
                  </span>
                  <StatusBadge status={item.kyc_status || 'unsubmitted'} />
                  <span className="font-semibold text-sand-900 tabular-nums lg:text-right">{money(item.price_per_day)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviews */}
      {section === 'reviews' && (
        <div className="space-y-5">
          <h1 className="text-[1.25rem] font-semibold text-sand-950 mb-5">
            {t('reviews')}
          </h1>
          <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200">
            <MetricTile label={t('reviews')} value={stats.reviews?.total || 0} />
            <MetricTile label={t('averageRating')} value={(stats.reviews?.averageRating || 0).toFixed(1)} />
          </div>
          <div className="border border-sand-200 rounded-soft overflow-hidden">
            <div className="hidden md:grid grid-cols-[minmax(0,1fr)_80px_minmax(0,1.2fr)_110px] gap-4 bg-sand-100 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500">
              <span>{t('author')}</span>
              <span>{t('rating')}</span>
              <span>{t('target')}</span>
              <span>{t('date')}</span>
            </div>
            <div className="divide-y divide-sand-100">
              {platform.reviews.length === 0 ? (
                <div className="py-10 text-center text-[0.8125rem] text-sand-500">{t('noReviews')}</div>
              ) : (
                platform.reviews.map((item) => (
                  <div key={item._id} className="grid grid-cols-1 gap-2 px-4 py-3 text-[0.85rem] md:grid-cols-[minmax(0,1fr)_80px_minmax(0,1.2fr)_110px] md:items-center md:gap-4">
                    <span className="font-semibold text-sand-900">{item.author?.name || t('unknown')}</span>
                    <span className="font-semibold text-signal-700 tabular-nums">{item.rating}/5</span>
                    <span className="text-sand-700">
                      {item.targetVehicle
                        ? `${item.targetVehicle.make} ${item.targetVehicle.model}`
                        : item.targetUser?.name || t('unknown')}
                      <span className="block text-[0.74rem] text-sand-500">{item.comment}</span>
                    </span>
                    <span className="text-sand-500">{formatDate(item.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {section === 'messages' && (
        <div className="space-y-5">
          <h1 className="text-[1.25rem] font-semibold text-sand-950 mb-5">
            {t('contactMessages')}
          </h1>
          <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200">
            <MetricTile label={t('totalMessages')} value={contactMessages.length} />
            <MetricTile label={t('unreadMessages')} value={unreadCount} accent={unreadCount > 0} />
            <MetricTile label={t('readMessages')} value={contactMessages.length - unreadCount} />
          </div>
          <div className="border border-sand-200 rounded-soft overflow-hidden">
            {contactMessages.length === 0 ? (
              <div className="py-12 text-center">
                <svg className="mx-auto mb-3 text-sand-300" width="40" height="40" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1.5" y="3" width="13" height="10" rx="1.5" />
                  <path d="M1.5 4.5L8 9l6.5-4.5" />
                </svg>
                <p className="text-[0.875rem] text-sand-500">{t('noMessages')}</p>
              </div>
            ) : (
              <div className="divide-y divide-sand-100">
                {contactMessages.map((msg) => {
                  const isExpanded = expandedMessageId === msg._id;
                  return (
                    <div
                      key={msg._id}
                      className={`transition-colors ${
                        !msg.isRead ? 'bg-primary-50/40' : 'bg-sand-50'
                      }`}
                    >
                      {/* Clickable row header */}
                      <button
                        onClick={() => {
                          setExpandedMessageId(isExpanded ? null : msg._id);
                          if (!msg.isRead) handleMarkAsRead(msg._id);
                        }}
                        className="w-full text-left px-4 py-3 flex items-center gap-4 hover:bg-sand-100/60 transition-colors"
                      >
                        {/* Unread dot */}
                        <span className="shrink-0 w-2.5 h-2.5 flex items-center justify-center">
                          {!msg.isRead && (
                            <span className="block w-2 h-2 rounded-full bg-primary-500" />
                          )}
                        </span>
                        {/* Name & Subject */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-[0.85rem] truncate ${
                            !msg.isRead
                              ? 'font-bold text-sand-950'
                              : 'font-medium text-sand-800'
                          }`}>
                            {msg.name}
                            <span className="mx-2 text-sand-300">·</span>
                            <span className={`${
                              !msg.isRead ? 'font-semibold text-sand-800' : 'font-normal text-sand-600'
                            }`}>
                              {msg.subject}
                            </span>
                          </p>
                          <p className="text-[0.74rem] text-sand-500 truncate mt-0.5">
                            {msg.message}
                          </p>
                        </div>
                        {/* Date */}
                        <span className="shrink-0 text-[0.74rem] text-sand-500 tabular-nums">
                          {formatDate(msg.createdAt)}
                        </span>
                        {/* Chevron */}
                        <svg
                          className={`shrink-0 w-4 h-4 text-sand-400 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        >
                          <path d="M4 6l4 4 4-4" />
                        </svg>
                      </button>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 ml-6 mr-4 border-t border-sand-100">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 mt-3">
                            <div>
                              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 mb-0.5">{t('from')}</p>
                              <p className="text-[0.85rem] font-medium text-sand-900">{msg.name}</p>
                            </div>
                            <div>
                              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 mb-0.5">{t('email')}</p>
                              <a href={`mailto:${msg.email}`} className="text-[0.85rem] text-primary-600 hover:underline">{msg.email}</a>
                            </div>
                            <div>
                              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 mb-0.5">{t('phone')}</p>
                              <p className="text-[0.85rem] text-sand-900">
                                {msg.phone ? (
                                  <a href={`tel:${msg.phone}`} className="text-primary-600 hover:underline">{msg.phone}</a>
                                ) : (
                                  <span className="text-sand-400 italic">{t('noPhone')}</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="mb-4">
                            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 mb-1">{t('message')}</p>
                            <div className="bg-white border border-sand-200 rounded-subtle p-3 text-[0.85rem] text-sand-800 leading-relaxed whitespace-pre-wrap">
                              {msg.message}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!msg.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(msg._id)}
                                className="text-[0.75rem] font-semibold text-primary-600 bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-subtle hover:bg-primary-100 transition-colors"
                              >
                                {t('markAsRead')}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteMessage(msg._id)}
                              className="text-[0.75rem] font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-subtle hover:bg-red-100 transition-colors"
                            >
                              {t('deleteMessage')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function VerificationSection({ title, count, items, type, renderItem }) {
  const { t } = useTranslation('admin');
  return (
    <div>
      <h2 className="text-[0.95rem] font-semibold text-sand-900 mb-3">
        {title}{' '}
        <span className="text-sand-500 font-normal">({count})</span>
      </h2>
      {count === 0 ? (
        <div className="border border-sand-200 rounded-soft py-6 text-center text-[0.8125rem] text-sand-500">
          {t('noPendingSection', { title })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => renderItem(item, type))}
        </div>
      )}
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
          accent ? 'text-signal-600' : 'text-sand-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
