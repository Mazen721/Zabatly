import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardShell from './DashboardShell';
import { API } from '../../config/api';

const statusColors = {
  active: 'bg-green-50 text-green-700 border border-green-200',
  confirmed: 'bg-primary-50 text-primary-700 border border-primary-200',
  upcoming: 'bg-primary-50 text-primary-700 border border-primary-200',
  pending: 'bg-signal-50 text-signal-700 border border-signal-200',
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

const displayStatus = (booking, now = new Date()) => {
  if (booking.status === 'active' || booking.status === 'completed') return booking.status;
  if (booking.status === 'pending' || booking.status === 'confirmed') {
    const start = booking.startDate ? new Date(booking.startDate) : null;
    return start && start > now ? 'upcoming' : booking.status;
  }
  return booking.status || 'pending';
};

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-GB', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not set';

const formatDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 'Not set';
  const minutes = Math.max(0, Math.round((new Date(endDate) - new Date(startDate)) / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours && rest) return `${hours}h ${rest}m`;
  if (hours) return `${hours}h`;
  return `${rest}m`;
};

const formatCountdown = (endDate, now) => {
  if (!endDate) return 'No end time';
  const seconds = Math.max(0, Math.floor((new Date(endDate) - now) / 1000));
  if (seconds === 0) return 'Ending now';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(rest).padStart(2, '0')}s`;
};

const driverStatusStyles = {
  online: {
    label: 'Online',
    helper: 'Available for booking',
    dot: 'bg-green-500',
    badge: 'border-green-200 bg-green-50 text-green-700',
  },
  busy: {
    label: 'Busy',
    helper: 'Not accepting bookings',
    dot: 'bg-red-500',
    badge: 'border-red-200 bg-red-50 text-red-700',
  },
  offline: {
    label: 'Offline',
    helper: 'Hidden from renters',
    dot: 'bg-sand-400',
    badge: 'border-sand-200 bg-sand-100 text-sand-600',
  },
};

export default function DriverDashboard({ user, returnTarget = null }) {
  const [section, setSection] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [driverStatus, setDriverStatus] = useState(user.driverStatus || (user.isAvailable === false ? 'offline' : 'online'));
  const [dailyRate, setDailyRate] = useState(user.dailyRate || 200);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get(`${API}/api/bookings`, config);
        setBookings(data || []);
      } catch {
        setError('Could not load your assignments.');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user.token]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const myJobs = bookings.filter(
    (b) => b.driver?._id === user._id || b.driver === user._id
  );
  const pendingJobs = myJobs.filter((b) => b.status === 'pending' || b.status === 'confirmed');
  const activeJob = myJobs.find((b) => b.status === 'active');
  const completedJobs = myJobs.filter((b) => b.status === 'completed');
  const earnings = completedJobs.reduce(
    (sum, b) => sum + (b.totalPrice || 0),
    0
  );

  const hasBlockingJob = myJobs.some((b) => ['active', 'pending', 'confirmed'].includes(b.status));
  const visibleDriverStatus = hasBlockingJob ? 'busy' : driverStatus;
  const visibleStatusStyle = driverStatusStyles[visibleDriverStatus] || driverStatusStyles.offline;

  const saveSettings = async (nextStatus = driverStatus) => {
    setSaving(true);
    try {
      const { data } = await axios.put(
        `${API}/api/users/driver-settings`,
        {
          driverStatus: nextStatus,
          isAvailable: nextStatus === 'online',
          dailyRate: Number(dailyRate),
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      const stored = JSON.parse(localStorage.getItem('userInfo'));
      stored.isAvailable = data.isAvailable;
      stored.driverStatus = data.driverStatus;
      stored.dailyRate = data.dailyRate;
      localStorage.setItem('userInfo', JSON.stringify(stored));
      setDriverStatus(data.driverStatus);
    } catch {
      setError('Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const { data } = await axios.put(
        `${API}/api/bookings/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, ...data } : b))
      );
      if (status === 'active') {
        const stored = JSON.parse(localStorage.getItem('userInfo'));
        stored.isAvailable = false;
        stored.driverStatus = 'busy';
        localStorage.setItem('userInfo', JSON.stringify(stored));
        setDriverStatus('busy');
      }
    } catch {
      setError('Failed to update job status.');
    }
  };

  const finishRide = async (id) => {
    try {
      const { data } = await axios.put(
        `${API}/api/bookings/finish/${id}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, ...data } : b))
      );
      if (data.status === 'completed') {
        const stored = JSON.parse(localStorage.getItem('userInfo'));
        stored.isAvailable = false;
        stored.driverStatus = 'busy';
        localStorage.setItem('userInfo', JSON.stringify(stored));
        setDriverStatus('busy');
      }
    } catch {
      setError('Could not finish the ride.');
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
      id: 'requests',
      label: 'Requests',
      badge: pendingJobs.length || null,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H2v9h4l2 2.5L10 11h4V2z" />
        </svg>
      ),
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
          <path d="M5 1v3M11 1v3M2 6.5h12" />
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

  const contextStrip = (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${visibleStatusStyle.dot}`} />
        <span className="text-[0.8125rem] font-semibold text-sand-800">
          {visibleStatusStyle.label}
        </span>
        <span className={`rounded-subtle border px-2 py-0.5 text-[0.7rem] font-semibold ${visibleStatusStyle.badge}`}>
          {visibleStatusStyle.helper}
        </span>
      </div>
      {activeJob && (
        <>
          <span className="text-sand-300">|</span>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[0.8125rem] text-sand-700">
              Driving for {activeJob.renter?.name || 'Client'}
            </span>
          </div>
        </>
      )}
    </div>
  );

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
            Driver Dashboard
          </h1>

          {/* Settings bar */}
          <div className="grid gap-4 border border-sand-200 rounded-soft p-4 bg-sand-50 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="space-y-3">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 mb-1">
                  Current Status
                </p>
                <div className={`inline-flex items-center gap-2 rounded-subtle border px-3 py-2 text-[0.8125rem] font-semibold ${visibleStatusStyle.badge}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${visibleStatusStyle.dot}`} />
                  {visibleStatusStyle.label}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => saveSettings('online')}
                  disabled={saving || hasBlockingJob}
                  className="rounded-subtle bg-green-600 px-3.5 py-2 text-[0.78rem] font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-sand-200 disabled:text-sand-500"
                >
                  Go Online
                </button>
                <button
                  type="button"
                  onClick={() => saveSettings('online')}
                  disabled={saving || hasBlockingJob}
                  className="rounded-subtle border border-green-200 bg-green-50 px-3.5 py-2 text-[0.78rem] font-semibold text-green-700 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:border-sand-200 disabled:bg-sand-100 disabled:text-sand-500"
                >
                  Mark as Available
                </button>
                <button
                  type="button"
                  onClick={() => saveSettings('busy')}
                  disabled={saving || hasBlockingJob}
                  className="rounded-subtle border border-red-200 bg-red-50 px-3.5 py-2 text-[0.78rem] font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:border-sand-200 disabled:bg-sand-100 disabled:text-sand-500"
                >
                  Mark as Busy
                </button>
                <button
                  type="button"
                  onClick={() => saveSettings('offline')}
                  disabled={saving || hasBlockingJob}
                  className="rounded-subtle border border-sand-200 bg-sand-100 px-3.5 py-2 text-[0.78rem] font-semibold text-sand-700 transition-colors hover:bg-sand-200/70 disabled:cursor-not-allowed disabled:text-sand-500"
                >
                  Go Offline
                </button>
              </div>
              {hasBlockingJob && (
                <p className="text-[0.75rem] text-sand-500">
                  You are Busy while a reservation is pending or active. Complete the trip before going Online.
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
              <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 mb-1">
                Daily Rate (EGP)
              </label>
              <input
                type="number"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                className="w-28 bg-sand-100 border border-sand-200 rounded-subtle px-3 py-2 text-[0.875rem] font-semibold text-sand-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors disabled:opacity-50 tabular-nums"
              />
            </div>
            <button
              onClick={() => saveSettings(driverStatus)}
              disabled={saving}
              className="bg-primary-800 text-white text-[0.8125rem] font-semibold px-4 py-2 rounded-subtle hover:bg-primary-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Rate'}
            </button>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200">
            <MetricTile label="Earnings" value={`${earnings.toLocaleString()} EGP`} />
            <MetricTile label="Trips" value={completedJobs.length} />
            <MetricTile label="Pending" value={pendingJobs.length} accent={pendingJobs.length > 0} />
          </div>

          {/* Active assignment */}
          {activeJob && (
            <div className="border border-green-200 bg-green-50/50 rounded-soft p-4">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-green-700 mb-2">
                Active Assignment
              </p>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="min-w-0">
                  <p className="text-[0.95rem] font-semibold text-sand-900">
                    Driving for {activeJob.renter?.name || 'Client'}
                  </p>
                  <p className="text-[0.8125rem] text-sand-600">
                    {activeJob.vehicle
                      ? `${activeJob.vehicle.make} ${activeJob.vehicle.model}`
                      : 'Driver service'}{' '}
                    · Ends{' '}
                    {activeJob.endDate
                      ? new Date(activeJob.endDate).toLocaleDateString('en-GB', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </p>
                  <p className="text-[0.95rem] font-bold text-sand-900 mt-1 tabular-nums">
                    {activeJob.totalPrice?.toLocaleString()} EGP
                  </p>
                  <p className="mt-1 text-[0.8125rem] text-sand-600">
                    {activeJob.routeDescription || 'Pickup details not added'}
                  </p>
                  <p className="mt-1 text-[0.8125rem] font-semibold tabular-nums text-green-700">
                    Time left: {formatCountdown(activeJob.endDate, now)}
                  </p>
                </div>
                {activeJob.renter?.phone && (
                  <div className="flex flex-wrap gap-2">
                    <a href={`tel:${activeJob.renter.phone}`} className="rounded-subtle border border-sand-200 bg-sand-50 px-3 py-2 text-[0.75rem] font-semibold text-primary-700 transition-colors hover:bg-sand-100">
                      Call renter
                    </a>
                    <a href={`https://wa.me/${activeJob.renter.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="rounded-subtle border border-green-200 bg-green-50 px-3 py-2 text-[0.75rem] font-semibold text-green-700 transition-colors hover:bg-green-100">
                      WhatsApp
                    </a>
                  </div>
                )}
                <button
                  onClick={() => finishRide(activeJob._id)}
                  className="bg-primary-800 text-white text-[0.8125rem] font-semibold px-5 py-2.5 rounded-subtle hover:bg-primary-900 transition-colors"
                >
                  Finish Ride
                </button>
              </div>
            </div>
          )}

          {/* Pending requests preview */}
          {pendingJobs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[0.95rem] font-semibold text-sand-900">
                  Incoming Requests
                </h2>
                <button
                  onClick={() => setSection('requests')}
                  className="text-[0.75rem] font-medium text-primary-600 hover:text-primary-800 transition-colors"
                >
                  View all
                </button>
              </div>
              <div className="space-y-2">
                {pendingJobs.slice(0, 3).map((b) => (
                  <JobRequestRow
                    key={b._id}
                    booking={b}
                    onAccept={() => updateStatus(b._id, 'active')}
                    onDecline={() => updateStatus(b._id, 'cancelled')}
                  />
                ))}
              </div>
            </div>
          )}

          {!activeJob && pendingJobs.length === 0 && !loading && (
            <div className="border border-sand-200 rounded-soft py-10 text-center">
              <div
                className={`inline-block w-3 h-3 rounded-full mb-3 ${
                  visibleDriverStatus === 'online' ? 'bg-green-500 animate-pulse' : visibleDriverStatus === 'busy' ? 'bg-red-500' : 'bg-sand-400'
                }`}
              />
              <p className="text-[0.95rem] font-semibold text-sand-800">
                {visibleDriverStatus === 'online' ? 'Online, waiting for requests' : visibleDriverStatus === 'busy' ? 'You are marked busy' : 'You are offline'}
              </p>
              <p className="text-[0.8125rem] text-sand-500 mt-1">
                {visibleDriverStatus === 'online'
                  ? 'New requests will appear here.'
                  : 'Go online when you are ready to receive ride requests.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Requests */}
      {section === 'requests' && (
        <div>
          <h1 className="text-[1.25rem] font-semibold text-sand-950 mb-5">
            Ride Requests
          </h1>
          {pendingJobs.length === 0 ? (
            <div className="border border-sand-200 rounded-soft py-10 text-center text-[0.8125rem] text-sand-500">
              No pending requests right now.
            </div>
          ) : (
            <div className="space-y-2">
              {pendingJobs.map((b) => (
                <JobRequestRow
                  key={b._id}
                  booking={b}
                  onAccept={() => updateStatus(b._id, 'active')}
                  onDecline={() => updateStatus(b._id, 'cancelled')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule */}
      {section === 'schedule' && (
        <div>
          <h1 className="text-[1.25rem] font-semibold text-sand-950 mb-5">
            Schedule
          </h1>
          {myJobs.filter((b) => ['active', 'pending', 'confirmed'].includes(b.status))
            .length === 0 ? (
            <div className="border border-sand-200 rounded-soft py-10 text-center text-[0.8125rem] text-sand-500">
              No upcoming assignments.
            </div>
          ) : (
            <div className="border border-sand-200 rounded-soft overflow-hidden divide-y divide-sand-100">
              {myJobs
                .filter((b) => ['active', 'pending', 'confirmed'].includes(b.status))
                .map((b) => (
                  <div
                    key={b._id}
                    className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.8fr)_120px_110px] md:items-center"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.875rem] font-medium text-sand-900">
                        {b.renter?.name || 'Client'}
                      </p>
                      <p className="text-[0.75rem] text-sand-500">
                        {b.startDate
                          ? new Date(b.startDate).toLocaleDateString('en-GB', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                        {b.endDate
                          ? ` – ${new Date(b.endDate).toLocaleDateString('en-GB', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}`
                          : ''}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[0.8125rem] text-sand-700">
                        {formatDateTime(b.startDate)} to {formatDateTime(b.endDate)}
                      </p>
                      <p className="mt-0.5 truncate text-[0.75rem] text-sand-500">
                        {b.routeDescription || 'Pickup details not added'} · {formatDuration(b.startDate, b.endDate)}
                      </p>
                    </div>
                    <StatusBadge status={displayStatus(b, now)} />
                    <span className="text-[0.875rem] font-semibold text-sand-900 tabular-nums">
                      {b.totalPrice?.toLocaleString()} EGP
                    </span>
                  </div>
                ))}
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
            <MetricTile label="Total Earned" value={`${earnings.toLocaleString()} EGP`} />
            <MetricTile label="Completed Rides" value={completedJobs.length} />
          </div>

          <h2 className="text-[0.95rem] font-semibold text-sand-900 mb-3">
            Ride History
          </h2>
          <div className="border border-sand-200 rounded-soft overflow-hidden">
            <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_100px] gap-4 px-4 py-2 bg-sand-100 text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 border-b border-sand-200">
              <span>Client</span>
              <span>Date</span>
              <span className="text-right">Payout</span>
            </div>
            {completedJobs.length === 0 ? (
              <div className="py-10 text-center text-[0.8125rem] text-sand-500">
                No completed rides yet.
              </div>
            ) : (
              <div className="divide-y divide-sand-100">
                {completedJobs.map((b) => (
                  <div
                    key={b._id}
                    className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_100px] gap-2 md:gap-4 items-center px-4 py-3"
                  >
                    <span className="text-[0.875rem] text-sand-800">
                      {b.renter?.name || 'Client'}
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

function JobRequestRow({ booking: b, onAccept, onDecline }) {
  const phone = b.renter?.phone;
  const whatsapp = phone ? phone.replace(/\D/g, '') : '';

  return (
    <div className="grid gap-3 border border-sand-200 rounded-soft px-4 py-3 bg-sand-50 hover:bg-sand-100/60 transition-colors lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)_auto] lg:items-center">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[0.875rem] font-medium text-sand-900">
            {b.renter?.name || 'Client'}
          </p>
          <StatusBadge status={displayStatus(b)} />
        </div>
        <p className="text-[0.75rem] text-sand-500">
          {phone || 'No phone added'}
        </p>
        <p className="text-[0.8125rem] font-semibold text-sand-800 mt-0.5 tabular-nums">
          {b.totalPrice?.toLocaleString()} EGP
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-[0.8125rem] text-sand-700">
          {formatDateTime(b.startDate)} to {formatDateTime(b.endDate)}
        </p>
        <p className="mt-0.5 text-[0.75rem] leading-5 text-sand-500">
          {b.routeDescription || 'Pickup details not added'}
        </p>
        <p className="mt-0.5 text-[0.75rem] font-semibold text-sand-700">
          Duration: {formatDuration(b.startDate, b.endDate)}
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {phone && (
          <>
            <a
              href={`tel:${phone}`}
              className="text-[0.75rem] font-semibold text-primary-700 bg-sand-100 border border-sand-200 px-3.5 py-1.5 rounded-subtle hover:bg-sand-200/60 transition-colors"
            >
              Call
            </a>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="text-[0.75rem] font-semibold text-green-700 bg-green-50 border border-green-200 px-3.5 py-1.5 rounded-subtle hover:bg-green-100 transition-colors"
              >
                WhatsApp
              </a>
            )}
          </>
        )}
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
          accent ? 'text-signal-600' : 'text-sand-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
