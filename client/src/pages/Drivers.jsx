import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API } from '../config/api';

function getInitials(name = 'Driver') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function getDriverPhoto(driver) {
  return driver?.profilePicture || null;
}

function formatRating(rating) {
  const value = Number(rating || 0);
  return value > 0 ? value.toFixed(1) : 'New';
}

function asList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function toDateTimeLocal(date) {
  const value = new Date(date);
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 16);
}

function DriverSkeleton() {
  return (
    <div className="rounded-soft border border-sand-200 bg-sand-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-soft bg-sand-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-sand-200 animate-pulse" />
            <div className="h-3 w-24 rounded bg-sand-200 animate-pulse" />
          </div>
        </div>
        <div className="h-6 w-20 rounded bg-sand-200 animate-pulse" />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="h-14 rounded-subtle bg-sand-100 animate-pulse" />
        <div className="h-14 rounded-subtle bg-sand-100 animate-pulse" />
        <div className="h-14 rounded-subtle bg-sand-100 animate-pulse" />
      </div>
      <div className="mt-5 h-10 rounded-subtle bg-sand-200 animate-pulse" />
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-subtle bg-sand-100 px-3 py-2">
      <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-sand-500">{label}</p>
      <p className="mt-0.5 truncate text-[0.88rem] font-semibold text-sand-950">{value}</p>
    </div>
  );
}

function DriverCard({ driver, onSelect, currentUser }) {
  const photo = getDriverPhoto(driver);
  const rating = formatRating(driver.rating);
  const reviews = Number(driver.numReviews || 0);
  const dailyRate = driver.dailyRate || 200;
  const verified = driver.kyc_status === 'verified' || driver.driving_license?.is_verified;
  const coveredAreas = asList(driver.coveredAreas);
  const vehicleTypes = asList(driver.vehicleTypes);
  const languages = asList(driver.languagesSpoken);
  const isCurrentDriver = currentUser?._id === driver._id;
  const driverUserBlocked = currentUser?.role === 'driver';
  const driverStatus = driver.driverStatus || (driver.isAvailable ? 'online' : 'offline');
  const canRequest = driverStatus === 'online' && driver.isAvailable && !driverUserBlocked && !isCurrentDriver;
  const buttonLabel = driverStatus === 'busy'
    ? 'Busy'
    : driverStatus === 'offline'
    ? 'Offline'
    : driverUserBlocked
    ? 'Drivers cannot request'
    : isCurrentDriver
    ? 'This is you'
    : 'Request driver';

  return (
    <article className="group rounded-soft border border-sand-200 bg-sand-50 p-5 transition-all duration-200 ease-out-quart hover:-translate-y-0.5 hover:border-sand-300 hover:shadow-md hover:shadow-sand-200/40">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {photo ? (
            <img
              src={photo}
              alt={`${driver.name} profile`}
              className="h-14 w-14 shrink-0 rounded-soft object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-soft bg-primary-50 text-[1rem] font-bold text-primary-800">
              {getInitials(driver.name)}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-[1rem] font-semibold leading-tight text-sand-950">{driver.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-signal-100 px-1.5 py-0.5 text-[0.68rem] font-semibold text-signal-800">
                Zabatly partner
              </span>
              {verified && (
                <span className="rounded bg-primary-50 px-1.5 py-0.5 text-[0.68rem] font-semibold text-primary-700">
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        <span className={`shrink-0 rounded-subtle border px-2 py-1 text-[0.72rem] font-semibold ${
          driverStatus === 'online'
            ? 'border-green-200 bg-green-50 text-green-700'
            : driverStatus === 'busy'
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-sand-200 bg-sand-100 text-sand-500'
        }`}>
          {driverStatus === 'online' ? 'Online' : driverStatus === 'busy' ? 'Busy' : 'Offline'}
        </span>
      </div>

      <div className="mt-4 rounded-subtle border border-primary-200 bg-primary-50 px-3 py-2.5">
        <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-primary-700">Location</p>
        <p className="mt-0.5 text-[0.9rem] font-semibold text-primary-950">
          {driver.currentLocation || 'Location not added'}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[0.76rem] leading-5 text-primary-700">
          {coveredAreas.length > 0 ? `Covers ${coveredAreas.join(', ')}` : 'Covered areas coming soon'}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Metric label="Rating" value={rating === 'New' ? 'New' : `${rating}/5`} />
        <Metric label="Reviews" value={reviews > 0 ? reviews : 'None yet'} />
        <Metric label="Experience" value={driver.drivingExperience || 'Profile'} />
      </div>

      {(vehicleTypes.length > 0 || languages.length > 0 || driver.licenseInfo) && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {vehicleTypes.slice(0, 3).map((type) => (
            <span key={type} className="rounded bg-sand-100 px-2 py-1 text-[0.68rem] font-medium text-sand-700">
              {type}
            </span>
          ))}
          {languages.slice(0, 2).map((language) => (
            <span key={language} className="rounded bg-sand-100 px-2 py-1 text-[0.68rem] font-medium text-sand-700">
              {language}
            </span>
          ))}
          {driver.licenseInfo && (
            <span className="rounded bg-sand-100 px-2 py-1 text-[0.68rem] font-medium text-sand-700">
              Licensed
            </span>
          )}
        </div>
      )}

      <div className="mt-5 flex items-end justify-between gap-4 border-t border-sand-200 pt-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-sand-500">Daily rate</p>
          <p className="mt-0.5 text-[1.25rem] font-bold text-primary-800">
            {dailyRate}
            <span className="ml-1 text-[0.75rem] font-medium text-sand-500">EGP</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => canRequest && onSelect(driver)}
          disabled={!canRequest}
          className={`inline-flex h-10 items-center justify-center rounded-subtle px-4 text-[0.82rem] font-semibold transition-all duration-150 active:scale-[0.98] ${
            canRequest
              ? 'bg-primary-800 text-white hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 focus:ring-offset-sand-50'
              : 'cursor-not-allowed bg-sand-200 text-sand-500'
          }`}
        >
          {buttonLabel}
        </button>
      </div>
    </article>
  );
}

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [route, setRoute] = useState('');
  const [reservationStart, setReservationStart] = useState(() => toDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)));
  const [reservationEnd, setReservationEnd] = useState(() => toDateTimeLocal(new Date(Date.now() + 3 * 60 * 60 * 1000)));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [routeError, setRouteError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/api/users/drivers`);
        setDrivers(data);
      } catch {
        setError('Could not load drivers. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const areaOptions = useMemo(() => {
    const areas = new Set();
    drivers.forEach((driver) => {
      if (driver.currentLocation) areas.add(driver.currentLocation);
      asList(driver.coveredAreas).forEach((area) => areas.add(area));
    });
    return Array.from(areas).sort();
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return drivers.filter((driver) => {
      const coveredAreas = asList(driver.coveredAreas);
      const vehicleTypes = asList(driver.vehicleTypes);
      const languages = asList(driver.languagesSpoken);
      const searchable = [
        driver.name,
        driver.currentLocation,
        driver.drivingExperience,
        driver.licenseInfo,
        driver.availability,
        ...coveredAreas,
        ...vehicleTypes,
        ...languages,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (q && !searchable.includes(q)) return false;
      if (areaFilter !== 'all') {
        const locationMatch = driver.currentLocation === areaFilter || coveredAreas.includes(areaFilter);
        if (!locationMatch) return false;
      }
      if (availabilityFilter !== 'all' && driver.availability !== availabilityFilter) return false;
      return true;
    });
  }, [drivers, search, areaFilter, availabilityFilter]);

  const stats = useMemo(() => {
    const available = filteredDrivers.filter((driver) => (driver.driverStatus || (driver.isAvailable ? 'online' : 'offline')) === 'online' && driver.isAvailable).length;
    const rated = filteredDrivers.filter((driver) => Number(driver.rating || 0) > 0);
    const averageRate = filteredDrivers.length
      ? Math.round(filteredDrivers.reduce((sum, driver) => sum + Number(driver.dailyRate || 200), 0) / filteredDrivers.length)
      : 0;
    const averageRating = rated.length
      ? (rated.reduce((sum, driver) => sum + Number(driver.rating || 0), 0) / rated.length).toFixed(1)
      : 'New';

    return { available, averageRate, averageRating };
  }, [filteredDrivers]);

  const openRequest = (driver) => {
    if (currentUser?.role === 'driver' || currentUser?._id === driver._id) return;
    setSelectedDriver(driver);
    setRoute('');
    setReservationStart(toDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)));
    setReservationEnd(toDateTimeLocal(new Date(Date.now() + 3 * 60 * 60 * 1000)));
    setRouteError('');
  };

  const closeRequest = () => {
    if (submitting) return;
    setSelectedDriver(null);
    setRoute('');
    setRouteError('');
  };

  const requestDriver = async () => {
    if (!route.trim()) {
      setRouteError('Tell the driver your pickup, drop-off, and timing.');
      return;
    }
    if (!reservationStart || !reservationEnd || new Date(reservationStart) >= new Date(reservationEnd)) {
      setRouteError('Choose a valid start and end time for the reservation.');
      return;
    }

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo) {
      navigate('/login');
      return;
    }
    if (userInfo.role === 'driver') {
      setRouteError('Driver accounts can rent cars, but cannot request another driver.');
      return;
    }
    if (userInfo._id === selectedDriver._id) {
      setRouteError("You can't book yourself as a driver.");
      return;
    }

    try {
      setSubmitting(true);
      setRouteError('');
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.post(`${API}/api/bookings`, {
        driver: selectedDriver._id,
        renter: userInfo._id,
        routeDescription: route,
        totalPrice: selectedDriver.dailyRate || 200,
        startDate: new Date(reservationStart).toISOString(),
        endDate: new Date(reservationEnd).toISOString(),
        paymentMethod: 'card',
      }, config);

      setSelectedDriver(null);
      navigate('/booking-success', {
        state: {
          booking: data,
          driver: data.driver || selectedDriver,
          paymentMethod: 'card',
        },
      });
    } catch (err) {
      setRouteError(err.response?.data?.message || 'Could not send this request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="mx-auto max-w-[1400px] px-6 pb-16 pt-6 lg:px-10">
        <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-[0.75rem] font-semibold uppercase tracking-wide text-signal-700">Driver network</p>
            <h1 className="text-[1.7rem] font-bold leading-tight text-sand-950 md:text-[2rem]">Find a trusted driver</h1>
            <p className="mt-2 max-w-[62ch] text-[0.92rem] leading-6 text-sand-600">
              Browse vetted Zabatly partners, compare their rates, and send your route when you are ready.
            </p>
          </div>

          {!loading && !error && (
            <div className="grid w-full grid-cols-3 gap-2 rounded-soft border border-sand-200 bg-sand-100 p-2 lg:w-[420px]">
              <Metric label="Available" value={`${stats.available}/${filteredDrivers.length}`} />
              <Metric label="Avg. rating" value={stats.averageRating === 'New' ? 'New' : `${stats.averageRating}/5`} />
              <Metric label="Avg. rate" value={stats.averageRate ? `${stats.averageRate} EGP` : 'Pending'} />
            </div>
          )}
        </header>

        {!loading && !error && drivers.length > 0 && (
          <div className="mb-6 grid gap-3 rounded-soft border border-sand-200 bg-sand-100 p-3 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
            <div className="relative">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="8.5" cy="8.5" r="5.5" /><path d="M13 13l4 4" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search drivers, areas, vehicle types..."
                className="w-full rounded-subtle border border-sand-200 bg-sand-50 py-2 pl-9 pr-3 text-[0.85rem] text-sand-950 placeholder:text-sand-400 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
              />
            </div>
            <select
              value={areaFilter}
              onChange={(event) => setAreaFilter(event.target.value)}
              className="rounded-subtle border border-sand-200 bg-sand-50 px-3 py-2 text-[0.85rem] text-sand-900 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
            >
              <option value="all">Any area</option>
              {areaOptions.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
            <select
              value={availabilityFilter}
              onChange={(event) => setAvailabilityFilter(event.target.value)}
              className="rounded-subtle border border-sand-200 bg-sand-50 px-3 py-2 text-[0.85rem] text-sand-900 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
            >
              <option value="all">Any availability</option>
              <option value="Full-time">Full-time</option>
              <option value="Weekdays">Weekdays</option>
              <option value="Weekends">Weekends</option>
              <option value="Evenings">Evenings</option>
              <option value="Flexible">Flexible</option>
            </select>
          </div>
        )}

        {currentUser?.role === 'driver' && (
          <div className="mb-5 rounded-subtle border border-signal-200 bg-signal-50 px-4 py-3 text-[0.82rem] font-medium text-signal-800">
            Driver accounts can browse the network, but ride requests are for renters. You can still book cars from the fleet.
          </div>
        )}

        {error && (
          <div className="py-20 text-center">
            <p className="mb-4 text-[0.95rem] font-semibold text-sand-700">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-[0.82rem] font-semibold text-primary-700 transition-colors hover:text-primary-800"
            >
              Retry
            </button>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <DriverSkeleton key={index} />)}
          </div>
        )}

        {!loading && !error && drivers.length === 0 && (
          <div className="border-y border-sand-200 py-20 text-center">
            <h2 className="text-[1rem] font-semibold text-sand-800">No drivers are listed yet.</h2>
            <p className="mx-auto mt-2 max-w-md text-[0.88rem] leading-6 text-sand-500">
              Check back soon. New partners appear here as soon as their profiles are ready.
            </p>
          </div>
        )}

        {!loading && !error && drivers.length > 0 && filteredDrivers.length === 0 && (
          <div className="border-y border-sand-200 py-20 text-center">
            <h2 className="text-[1rem] font-semibold text-sand-800">No drivers match those filters.</h2>
            <p className="mx-auto mt-2 max-w-md text-[0.88rem] leading-6 text-sand-500">
              Try another area, availability, or vehicle type.
            </p>
          </div>
        )}

        {!loading && !error && filteredDrivers.length > 0 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredDrivers.map((driver) => (
              <DriverCard key={driver._id} driver={driver} onSelect={openRequest} currentUser={currentUser} />
            ))}
          </div>
        )}

        {selectedDriver && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary-950/35 px-4 py-4 sm:items-center">
            <div className="w-full max-w-xl rounded-soft border border-sand-200 bg-sand-50 p-5 shadow-xl shadow-primary-950/15 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  {getDriverPhoto(selectedDriver) ? (
                    <img
                      src={getDriverPhoto(selectedDriver)}
                      alt={`${selectedDriver.name} profile`}
                      className="h-12 w-12 shrink-0 rounded-soft object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-soft bg-primary-50 text-[0.9rem] font-bold text-primary-800">
                      {getInitials(selectedDriver.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate text-[1.15rem] font-bold text-sand-950">Request {selectedDriver.name}</h2>
                    <p className="mt-0.5 text-[0.82rem] text-sand-500">Tell the driver where to meet you and where you are going.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeRequest}
                  aria-label="Close request form"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-subtle text-sand-500 transition-colors hover:bg-sand-100 hover:text-sand-800"
                >
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <Metric label="Rate" value={`${selectedDriver.dailyRate || 200} EGP`} />
                <Metric label="Rating" value={formatRating(selectedDriver.rating) === 'New' ? 'New' : `${formatRating(selectedDriver.rating)}/5`} />
                <Metric label="Reviews" value={selectedDriver.numReviews || 'None'} />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="block text-[0.75rem] font-semibold uppercase tracking-wide text-sand-500">
                    Start time
                  </span>
                  <input
                    type="datetime-local"
                    value={reservationStart}
                    min={toDateTimeLocal(new Date())}
                    onChange={(event) => {
                      setReservationStart(event.target.value);
                      if (routeError) setRouteError('');
                    }}
                    className="mt-2 w-full rounded-subtle border border-sand-200 bg-sand-100 px-3 py-2.5 text-[0.85rem] text-sand-950 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
                  />
                </label>
                <label className="block">
                  <span className="block text-[0.75rem] font-semibold uppercase tracking-wide text-sand-500">
                    End time
                  </span>
                  <input
                    type="datetime-local"
                    value={reservationEnd}
                    min={reservationStart || toDateTimeLocal(new Date())}
                    onChange={(event) => {
                      setReservationEnd(event.target.value);
                      if (routeError) setRouteError('');
                    }}
                    className="mt-2 w-full rounded-subtle border border-sand-200 bg-sand-100 px-3 py-2.5 text-[0.85rem] text-sand-950 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
                  />
                </label>
              </div>

              <label htmlFor="route" className="mt-5 block text-[0.75rem] font-semibold uppercase tracking-wide text-sand-500">
                Trip route
              </label>
              <textarea
                id="route"
                value={route}
                placeholder="Example: Pickup from Borg El Arab Airport at 5 PM, drop off at San Stefano."
                className={`mt-2 h-32 w-full resize-none rounded-subtle border bg-sand-100 px-3 py-3 text-[0.9rem] leading-6 text-sand-950 placeholder:text-sand-400 transition-colors focus:outline-none focus:ring-1 ${
                  routeError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-sand-200 focus:border-primary-600 focus:ring-primary-600'
                }`}
                onChange={(event) => {
                  setRoute(event.target.value);
                  if (routeError) setRouteError('');
                }}
                autoFocus
              />

              {routeError && (
                <p className="mt-2 rounded-subtle border border-red-200 bg-red-50 px-3 py-2 text-[0.8rem] font-medium text-red-700">
                  {routeError}
                </p>
              )}

              <div className="mt-5 flex flex-col gap-3 border-t border-sand-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[0.75rem] font-semibold uppercase tracking-wide text-sand-500">Driver fee</p>
                  <p className="mt-0.5 text-[1.35rem] font-bold text-primary-800">
                    {selectedDriver.dailyRate || 200}
                    <span className="ml-1 text-[0.78rem] font-medium text-sand-500">EGP today</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeRequest}
                    className="h-10 rounded-subtle bg-sand-100 px-4 text-[0.82rem] font-semibold text-sand-700 transition-colors hover:bg-sand-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={requestDriver}
                    disabled={submitting}
                    className="h-10 rounded-subtle bg-primary-800 px-5 text-[0.82rem] font-semibold text-white transition-colors hover:bg-primary-900 disabled:cursor-not-allowed disabled:bg-sand-300 disabled:text-sand-500"
                  >
                    {submitting ? 'Sending...' : 'Send request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
