import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import DashboardShell from './DashboardShell';
import PaymentProofLink from '../PaymentProofLink';

const API = 'http://localhost:5000';

const getImg = (v) =>
  v?.images?.length > 0
    ? `${API}${v.images[0]}`
    : 'https://placehold.co/100x75/f2efea/a49888?text=No+Photo';

const statusColors = {
  upcoming: 'bg-signal-50 text-signal-700 border border-signal-200',
  active: 'bg-green-50 text-green-700 border border-green-200',
  pending: 'bg-signal-50 text-signal-700 border border-signal-200',
  completed: 'bg-primary-50 text-primary-700 border border-primary-200',
  cancelled: 'bg-sand-100 text-sand-600 border border-sand-200',
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
  const [section, setSection] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        setError('Could not load dashboard data. Try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.token, user._id]);

  const myBookings = bookings.filter(
    (b) => b.owner?._id === user._id || b.owner === user._id
  );
  const pendingRequests = myBookings.filter((b) => b.status === 'pending');
  const activeRentals = myBookings.filter((b) => b.status === 'active');
  const completedBookings = myBookings.filter((b) => b.status === 'completed');
  const revenue = completedBookings.reduce(
    (sum, b) => sum + (b.totalPrice || 0),
    0
  );
  const availableCount = vehicles.filter((v) => v.isAvailable !== false).length;

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
      setError('Failed to update booking status.');
    }
  };

  const deleteVehicle = async (vehicleId) => {
    try {
      await axios.delete(`${API}/api/vehicles/${vehicleId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setVehicles((prev) => prev.filter((v) => v._id !== vehicleId));
    } catch {
      setError('Failed to remove vehicle.');
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
      id: 'vehicles',
      label: 'My Vehicles',
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
      id: 'requests',
      label: 'Requests',
      badge: pendingRequests.length || null,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H2v9h4l2 2.5L10 11h4V2z" />
        </svg>
      ),
    },
    {
      id: 'earnings',
      label: 'Earnings',
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
      label: 'Add Vehicle',
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

  const contextStrip = pendingRequests.length > 0 ? (
    <div className="flex items-center gap-3">
      <span className="inline-block w-2 h-2 rounded-full bg-signal-500" />
      <span className="font-semibold text-sand-800">
        {pendingRequests.length} pending request{pendingRequests.length > 1 ? 's' : ''}
      </span>
      <span className="text-sand-500">·</span>
      <button
        onClick={() => setSection('requests')}
        className="text-[0.8125rem] font-medium text-primary-700 hover:text-primary-900 transition-colors"
      >
        Review now
      </button>
    </div>
  ) : activeRentals.length > 0 ? (
    <div className="flex items-center gap-3">
      <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <span className="font-semibold text-sand-800">
        {activeRentals.length} active rental{activeRentals.length > 1 ? 's' : ''}
      </span>
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
            Dismiss
          </button>
        </div>
      )}

      {/* Overview */}
      {section === 'overview' && (
        <div className="space-y-6">
          <h1 className="text-[1.25rem] font-semibold text-sand-950">
            Fleet Overview
          </h1>

          <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200">
            <MetricTile label="Listed" value={vehicles.length} />
            <MetricTile label="Available" value={availableCount} accent />
            <MetricTile
              label="Rented"
              value={vehicles.length - availableCount}
            />
            <MetricTile label="Revenue" value={`${revenue.toLocaleString()} EGP`} />
          </div>

          {/* Pending requests preview */}
          {pendingRequests.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[0.95rem] font-semibold text-sand-900">
                  Pending Requests
                </h2>
                <button
                  onClick={() => setSection('requests')}
                  className="text-[0.75rem] font-medium text-primary-600 hover:text-primary-800 transition-colors"
                >
                  View all
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
              Active Rentals
            </h2>
            {loading ? (
              <SkeletonBlock />
            ) : activeRentals.length === 0 ? (
              <div className="border border-sand-200 rounded-soft py-6 text-center text-[0.8125rem] text-sand-500">
                No active rentals right now.
              </div>
            ) : (
              <div className="border border-sand-200 rounded-soft overflow-hidden divide-y divide-sand-100">
                {activeRentals.map((b) => (
                  <div
                    key={b._id}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-sand-100/60 transition-colors duration-100"
                  >
                    <img
                      src={getImg(b.vehicle)}
                      alt=""
                      className="w-12 h-9 rounded object-cover bg-sand-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.875rem] font-medium text-sand-900 truncate">
                        {b.vehicle?.make} {b.vehicle?.model}
                      </p>
                      <p className="text-[0.75rem] text-sand-500">
                        Rented by {b.renter?.name || 'User'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <PaymentProofLink path={b.paymentProof} />
                      {b.renterFinished ? (
                        <button
                          onClick={() => updateStatus(b._id, 'completed')}
                          className="text-[0.75rem] font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-subtle hover:bg-green-100 transition-colors"
                        >
                          Confirm Return
                        </button>
                      ) : (
                        <p className="text-[0.75rem] text-sand-500">
                          Returns{' '}
                          {b.endDate
                            ? new Date(b.endDate).toLocaleDateString('en-GB', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
                        </p>
                      )}
                    </div>
                  </div>
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
              My Vehicles
            </h1>
            <Link
              to="/add-vehicle"
              className="text-[0.8125rem] font-semibold bg-primary-800 text-white px-4 py-2 rounded-subtle hover:bg-primary-900 transition-colors duration-150"
            >
              + Add Vehicle
            </Link>
          </div>

          {vehicles.length === 0 ? (
            <EmptyState
              message="You haven't listed any vehicles yet."
              cta="Add Your First Vehicle"
              href="/add-vehicle"
            />
          ) : (
            <div className="border border-sand-200 rounded-soft overflow-hidden">
              <div className="hidden md:grid grid-cols-[minmax(0,2fr)_100px_130px_80px_80px] gap-4 px-4 py-2 bg-sand-100 text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 border-b border-sand-200">
                <span>Vehicle</span>
                <span>Status</span>
                <span>Daily Rate</span>
                <span>Bookings</span>
                <span className="text-right">Actions</span>
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
                          {v.isAvailable !== false ? 'Available' : 'Rented'}
                        </span>
                      </div>
                      <span className="text-[0.8125rem] text-sand-700 tabular-nums">
                        {v.pricePerDay?.toLocaleString() || '—'} EGP/day
                      </span>
                      <span className="text-[0.8125rem] text-sand-600 tabular-nums">
                        {vBookings.length}
                      </span>
                      <div className="md:text-right">
                        <button
                          onClick={() => deleteVehicle(v._id)}
                          className="text-[0.75rem] font-medium text-red-600 hover:text-red-800 transition-colors"
                        >
                          Remove
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

      {/* Requests */}
      {section === 'requests' && (
        <div>
          <h1 className="text-[1.25rem] font-semibold text-sand-950 mb-5">
            Booking Requests
          </h1>
          {pendingRequests.length === 0 ? (
            <div className="border border-sand-200 rounded-soft py-10 text-center text-[0.8125rem] text-sand-500">
              No pending requests right now.
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

          {/* Completed history */}
          {completedBookings.length > 0 && (
            <div className="mt-8">
              <h2 className="text-[0.95rem] font-semibold text-sand-900 mb-3">
                Completed
              </h2>
              <div className="border border-sand-200 rounded-soft overflow-hidden divide-y divide-sand-100">
                {completedBookings.slice(0, 10).map((b) => (
                  <div
                    key={b._id}
                    className="flex items-center gap-4 px-4 py-3"
                  >
                    <img
                      src={getImg(b.vehicle)}
                      alt=""
                      className="w-10 h-7 rounded object-cover bg-sand-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.8125rem] text-sand-800 truncate">
                        {b.vehicle?.make} {b.vehicle?.model} · {b.renter?.name || 'User'}
                      </p>
                    </div>
                    <span className="text-[0.8125rem] font-semibold text-sand-900 tabular-nums">
                      {b.totalPrice?.toLocaleString()} EGP
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Earnings */}
      {section === 'earnings' && (
        <div>
          <h1 className="text-[1.25rem] font-semibold text-sand-950 mb-5">
            Earnings
          </h1>
          <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200 mb-6">
            <MetricTile label="Total Revenue" value={`${revenue.toLocaleString()} EGP`} />
            <MetricTile label="Completed Trips" value={completedBookings.length} />
            <MetricTile label="Active Rentals" value={activeRentals.length} accent />
          </div>

          <h2 className="text-[0.95rem] font-semibold text-sand-900 mb-3">
            Transaction History
          </h2>
          <div className="border border-sand-200 rounded-soft overflow-hidden">
            <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_100px] gap-4 px-4 py-2 bg-sand-100 text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 border-b border-sand-200">
              <span>Vehicle</span>
              <span>Renter</span>
              <span>Date</span>
              <span className="text-right">Amount</span>
            </div>
            {completedBookings.length === 0 ? (
              <div className="py-10 text-center text-[0.8125rem] text-sand-500">
                No completed transactions yet.
              </div>
            ) : (
              <div className="divide-y divide-sand-100">
                {completedBookings.map((b) => (
                  <div
                    key={b._id}
                    className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_100px] gap-2 md:gap-4 items-center px-4 py-3"
                  >
                    <span className="text-[0.875rem] text-sand-800 truncate">
                      {b.vehicle?.make} {b.vehicle?.model}
                    </span>
                    <span className="text-[0.8125rem] text-sand-600">
                      {b.renter?.name || 'User'}
                    </span>
                    <span className="text-[0.8125rem] text-sand-600">
                      {b.endDate
                        ? new Date(b.endDate).toLocaleDateString('en-GB', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </span>
                    <span className="text-[0.875rem] font-semibold text-sand-900 md:text-right tabular-nums">
                      {b.totalPrice?.toLocaleString()} EGP
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
          {b.renter?.name || 'Guest'}{' '}
          <span className="text-sand-500 font-normal">
            wants {b.vehicle?.make} {b.vehicle?.model}
          </span>
        </p>
        <p className="text-[0.8125rem] font-semibold text-sand-800 tabular-nums">
          {b.totalPrice?.toLocaleString()} EGP
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-[0.72rem] font-medium text-sand-500">
            {paymentLabels[b.paymentMethod] || 'Payment pending'}
          </span>
          <PaymentProofLink path={b.paymentProof} />
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
