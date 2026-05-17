import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardShell from '../components/dashboard/DashboardShell';
import PaymentProofLink from '../components/PaymentProofLink';

const API = 'http://localhost:5000';

const StatusBadge = ({ status }) => {
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
      {status}
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
  const [section, setSection] = useState('overview');
  const [pending, setPending] = useState({ identity: [], licenses: [], vehicles: [] });
  const [platform, setPlatform] = useState({
    stats: null,
    users: [],
    vehicles: [],
    bookings: [],
    reviews: [],
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
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
      const [{ data }, { data: overview }] = await Promise.all([
        axios.get(`${API}/api/admin/pending`, config),
        axios.get(`${API}/api/admin/overview`, config),
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
    } catch {
      setError('Could not load admin data.');
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
      setError('Review action failed.');
    }
  };

  const totalPending =
    (pending.identity?.length || 0) +
    (pending.licenses?.length || 0) +
    (pending.vehicles?.length || 0);
  const stats = platform.stats || {};

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
      id: 'verifications',
      label: 'Verifications',
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
      label: 'Users',
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
      label: 'Bookings',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 2.5h7.5l3 3V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z" />
          <path d="M8 6v3M8 11h.01" />
        </svg>
      ),
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2.5l1.6 3.2 3.5.5-2.5 2.5.6 3.5L8 10.5l-3.2 1.7.6-3.5L2.9 6.2l3.5-.5L8 2.5z" />
        </svg>
      ),
    },
    {
      id: 'fleet',
      label: 'Fleet',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 10.5h11M3.5 6l1.5-3h6l1.5 3" />
          <rect x="2" y="6" width="12" height="4.5" rx="1" />
          <circle cx="4.5" cy="12" r="1" />
          <circle cx="11.5" cy="12" r="1" />
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

  const contextStrip = totalPending > 0 ? (
    <div className="flex items-center gap-3">
      <span className="inline-block w-2 h-2 rounded-full bg-signal-500" />
      <span className="font-semibold text-sand-800">
        {totalPending} item{totalPending > 1 ? 's' : ''} need review
      </span>
      <span className="text-sand-500">·</span>
      <button
        onClick={() => setSection('verifications')}
        className="text-[0.8125rem] font-medium text-primary-700 hover:text-primary-900 transition-colors"
      >
        Open queue
      </button>
    </div>
  ) : null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-50">
        <p className="text-[0.875rem] text-sand-500">Loading...</p>
      </div>
    );
  }

  const getDocImage = (item) => {
    const path =
      item.identity_document?.extracted_data?.image_url ||
      item.driving_license?.extracted_data?.image_url ||
      item.car_license?.extracted_data?.image_url;
    return path ? `${API}${path}` : null;
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
              alt="Document"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[0.8125rem] text-sand-400">
              No document image
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-[0.875rem] font-medium text-sand-900 mb-0.5">
            {item.name || `${item.make || 'Unknown'} ${item.model || 'Vehicle'}`}
          </p>
          <p className="text-[0.75rem] text-sand-500 mb-3">
            {item.email || `Owner: ${item.owner?.name || 'Unknown'}`}
          </p>

          {isRejecting ? (
            <div className="space-y-2">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection"
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
                  Confirm Reject
                </button>
                <button
                  onClick={() => {
                    setRejectId(null);
                    setRejectReason('');
                  }}
                  className="flex-1 text-[0.75rem] font-semibold text-sand-600 bg-sand-100 border border-sand-200 py-1.5 rounded-subtle hover:bg-sand-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleReview(item._id, type, 'verified')}
                className="flex-1 text-[0.75rem] font-semibold bg-green-600 text-white py-1.5 rounded-subtle hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  setRejectId(item._id);
                  setRejectType(type);
                  setRejectReason('');
                }}
                className="flex-1 text-[0.75rem] font-semibold text-sand-600 bg-sand-100 border border-sand-200 py-1.5 rounded-subtle hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
              >
                Reject
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
            Dismiss
          </button>
        </div>
      )}

      {/* Overview */}
      {section === 'overview' && (
        <div className="space-y-6">
          <h1 className="text-[1.25rem] font-semibold text-sand-950">
            Admin Overview
          </h1>

          <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200">
            <MetricTile label="Identity" value={pending.identity?.length || 0} accent={pending.identity?.length > 0} />
            <MetricTile label="Licenses" value={pending.licenses?.length || 0} accent={pending.licenses?.length > 0} />
            <MetricTile label="Vehicles" value={pending.vehicles?.length || 0} accent={pending.vehicles?.length > 0} />
            <MetricTile label="Total Queue" value={totalPending} />
          </div>

          <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200">
            <MetricTile label="Users" value={stats.users?.total || 0} />
            <MetricTile label="Available Cars" value={`${stats.vehicles?.available || 0}/${stats.vehicles?.total || 0}`} accent={(stats.vehicles?.available || 0) > 0} />
            <MetricTile label="Active Bookings" value={stats.bookings?.byStatus?.active || 0} accent={(stats.bookings?.byStatus?.active || 0) > 0} />
            <MetricTile label="Revenue" value={money(stats.bookings?.revenue)} />
          </div>

          {/* Quick verification preview */}
          {totalPending > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[0.95rem] font-semibold text-sand-900">
                  Needs Review
                </h2>
                <button
                  onClick={() => setSection('verifications')}
                  className="text-[0.75rem] font-medium text-primary-600 hover:text-primary-800 transition-colors"
                >
                  Full queue
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
                All clear
              </p>
              <p className="text-[0.8125rem] text-sand-500 mt-1">
                No items pending review.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Verifications */}
      {section === 'verifications' && (
        <div className="space-y-8">
          <h1 className="text-[1.25rem] font-semibold text-sand-950">
            Verification Queue
          </h1>

          {loading ? (
            <div className="py-12 text-center text-[0.875rem] text-sand-500 animate-pulse">
              Loading verification data...
            </div>
          ) : (
            <>
              <VerificationSection
                title="Identity Documents"
                count={pending.identity?.length || 0}
                items={pending.identity}
                type="identity"
                renderItem={renderVerificationItem}
              />
              <VerificationSection
                title="Driving Licenses"
                count={pending.licenses?.length || 0}
                items={pending.licenses}
                type="license"
                renderItem={renderVerificationItem}
              />
              <VerificationSection
                title="Vehicle Licenses"
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
            User Management
          </h1>
          <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200">
            <MetricTile label="All Users" value={stats.users?.total || 0} />
            <MetricTile label="Renters" value={(stats.users?.byRole?.user || 0) + (stats.users?.byRole?.renter || 0)} />
            <MetricTile label="Owners" value={stats.users?.byRole?.agency || 0} />
            <MetricTile label="Drivers" value={stats.users?.byRole?.driver || 0} />
          </div>
          <div className="border border-sand-200 rounded-soft overflow-hidden">
            <div className="hidden md:grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.5fr)_90px_110px_110px] gap-4 bg-sand-100 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500">
              <span>User</span>
              <span>Email</span>
              <span>Role</span>
              <span>KYC</span>
              <span>Joined</span>
            </div>
            <div className="divide-y divide-sand-100">
              {platform.users.map((item) => (
                <div key={item._id} className="grid grid-cols-1 gap-2 px-4 py-3 text-[0.85rem] md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.5fr)_90px_110px_110px] md:items-center md:gap-4">
                  <span className="font-semibold text-sand-900">{item.name}</span>
                  <span className="truncate text-sand-600">{item.email}</span>
                  <span className="capitalize text-sand-700">{item.role}</span>
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
            Bookings
          </h1>
          <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200">
            <MetricTile label="Total" value={stats.bookings?.total || 0} />
            <MetricTile label="Pending" value={stats.bookings?.byStatus?.pending || 0} accent={(stats.bookings?.byStatus?.pending || 0) > 0} />
            <MetricTile label="Active" value={stats.bookings?.byStatus?.active || 0} accent={(stats.bookings?.byStatus?.active || 0) > 0} />
            <MetricTile label="Completed" value={stats.bookings?.byStatus?.completed || 0} />
          </div>
          <div className="border border-sand-200 rounded-soft overflow-hidden">
            <div className="hidden lg:grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_90px_110px] gap-4 bg-sand-100 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500">
              <span>Booking</span>
              <span>Renter</span>
              <span>Provider</span>
              <span>Status</span>
              <span className="text-right">Total</span>
            </div>
            <div className="divide-y divide-sand-100">
              {platform.bookings.map((item) => (
                <div key={item._id} className="grid grid-cols-1 gap-2 px-4 py-3 text-[0.85rem] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_90px_110px] lg:items-center lg:gap-4">
                  <span className="font-semibold text-sand-900">
                    {item.vehicle ? `${item.vehicle.make} ${item.vehicle.model}` : 'Driver request'}
                    <span className="block text-[0.74rem] font-normal text-sand-500">{formatDate(item.createdAt)}</span>
                  </span>
                  <span className="text-sand-700">{item.renter?.name || 'Unknown'}</span>
                  <span className="text-sand-700">{item.owner?.name || item.driver?.name || 'Unknown'}</span>
                  <StatusBadge status={item.status} />
                  <span className="space-y-1 font-semibold text-sand-900 tabular-nums lg:text-right">
                    <span className="block">{money(item.totalPrice)}</span>
                    <PaymentProofLink path={item.paymentProof} />
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
            Fleet Overview
          </h1>
          <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200">
            <MetricTile label="Vehicles" value={stats.vehicles?.total || 0} />
            <MetricTile label="Available" value={stats.vehicles?.available || 0} accent={(stats.vehicles?.available || 0) > 0} />
            <MetricTile label="Rented" value={stats.vehicles?.rented || 0} />
            <MetricTile label="Pending KYC" value={stats.vehicles?.pendingKyc || 0} accent={(stats.vehicles?.pendingKyc || 0) > 0} />
          </div>
          <div className="border border-sand-200 rounded-soft overflow-hidden">
            <div className="hidden lg:grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_90px_100px_110px] gap-4 bg-sand-100 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500">
              <span>Vehicle</span>
              <span>Owner</span>
              <span>Status</span>
              <span>KYC</span>
              <span className="text-right">Daily Price</span>
            </div>
            <div className="divide-y divide-sand-100">
              {platform.vehicles.map((item) => (
                <div key={item._id} className="grid grid-cols-1 gap-2 px-4 py-3 text-[0.85rem] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_90px_100px_110px] lg:items-center lg:gap-4">
                  <span className="font-semibold text-sand-900">
                    {item.make} {item.model}
                    <span className="block text-[0.74rem] font-normal capitalize text-sand-500">{item.year} / {item.type}</span>
                  </span>
                  <span className="text-sand-700">{item.owner?.name || 'Unknown'}</span>
                  <span className={`inline-block px-2 py-0.5 rounded-subtle text-[0.7rem] font-semibold ${
                    item.isAvailable === false
                      ? 'bg-sand-100 text-sand-600 border border-sand-200'
                      : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    {item.isAvailable === false ? 'Rented' : 'Available'}
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
            Reviews
          </h1>
          <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200">
            <MetricTile label="Reviews" value={stats.reviews?.total || 0} />
            <MetricTile label="Average Rating" value={(stats.reviews?.averageRating || 0).toFixed(1)} />
          </div>
          <div className="border border-sand-200 rounded-soft overflow-hidden">
            <div className="hidden md:grid grid-cols-[minmax(0,1fr)_80px_minmax(0,1.2fr)_110px] gap-4 bg-sand-100 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500">
              <span>Author</span>
              <span>Rating</span>
              <span>Target</span>
              <span>Date</span>
            </div>
            <div className="divide-y divide-sand-100">
              {platform.reviews.length === 0 ? (
                <div className="py-10 text-center text-[0.8125rem] text-sand-500">No reviews yet.</div>
              ) : (
                platform.reviews.map((item) => (
                  <div key={item._id} className="grid grid-cols-1 gap-2 px-4 py-3 text-[0.85rem] md:grid-cols-[minmax(0,1fr)_80px_minmax(0,1.2fr)_110px] md:items-center md:gap-4">
                    <span className="font-semibold text-sand-900">{item.author?.name || 'Unknown'}</span>
                    <span className="font-semibold text-signal-700 tabular-nums">{item.rating}/5</span>
                    <span className="text-sand-700">
                      {item.targetVehicle
                        ? `${item.targetVehicle.make} ${item.targetVehicle.model}`
                        : item.targetUser?.name || 'Unknown'}
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
    </DashboardShell>
  );
}

function VerificationSection({ title, count, items, type, renderItem }) {
  return (
    <div>
      <h2 className="text-[0.95rem] font-semibold text-sand-900 mb-3">
        {title}{' '}
        <span className="text-sand-500 font-normal">({count})</span>
      </h2>
      {count === 0 ? (
        <div className="border border-sand-200 rounded-soft py-6 text-center text-[0.8125rem] text-sand-500">
          No pending {title.toLowerCase()}.
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
