import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { API } from '../config/api';

const ARABIC_FONT = "'Cairo', 'system-ui', sans-serif";

const ROLES = [
  { value: 'user', label: 'Renter', desc: 'I want to rent a car' },
  { value: 'agency', label: 'Agency / Owner', desc: 'I have cars to list' },
  { value: 'driver', label: 'Freelance Driver', desc: 'I want to drive for others' },
];

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [driverDetails, setDriverDetails] = useState({
    currentLocation: '',
    coveredAreas: '',
    availability: '',
    drivingExperience: '',
    vehicleTypes: '',
    licenseInfo: '',
    languagesSpoken: '',
    contactDetails: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const nameRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const listFromText = (value) =>
        value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

      const { data } = await axios.post(`${API}/api/auth/register`, {
        name,
        email,
        password,
        role,
        ...(role === 'driver'
          ? {
              currentLocation: driverDetails.currentLocation,
              coveredAreas: listFromText(driverDetails.coveredAreas),
              availability: driverDetails.availability,
              drivingExperience: driverDetails.drivingExperience,
              vehicleTypes: listFromText(driverDetails.vehicleTypes),
              licenseInfo: driverDetails.licenseInfo,
              languagesSpoken: listFromText(driverDetails.languagesSpoken),
              contactDetails: driverDetails.contactDetails,
            }
          : {}),
      });
      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-sand-50">
      {/* Left: Brand Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img
          src="/Zabatlyimage.png"
          alt="Young Egyptians by their car in Cairo"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-950/80 via-primary-950/30 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 z-10">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <span className="text-3xl font-extrabold text-white">Zabatly</span>
            <span className="text-3xl font-bold text-signal-500" style={{ fontFamily: ARABIC_FONT }}>زبطلي</span>
          </Link>
          <p className="text-primary-200 text-lg max-w-md leading-relaxed">
            Join the community. Rent cars, list vehicles, or drive for others.
          </p>
        </div>
        <span
          className="absolute top-8 right-8 text-[7rem] font-black text-signal-500/25 leading-none select-none pointer-events-none"
          aria-hidden="true"
          style={{ fontFamily: ARABIC_FONT }}
        >
          زبطلى
        </span>
      </div>

      {/* Right: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-primary-800">Zabatly</span>
              <span className="text-2xl font-bold text-signal-500" style={{ fontFamily: ARABIC_FONT }}>زبطلي</span>
            </Link>
          </div>

          <h1 className="text-headline text-primary-800 mb-2">Create your account</h1>
          <p className="text-body text-sand-500 mb-8">Join Zabatly and get started in seconds.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-subtle px-4 py-3 mb-6" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label htmlFor="reg-name" className="block text-label text-sand-700 mb-1.5">Full name</label>
              <input
                ref={nameRef}
                id="reg-name"
                type="text"
                required
                autoComplete="name"
                placeholder="Ahmed Ali"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-body focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-label text-sand-700 mb-1.5">Email</label>
              <input
                id="reg-email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-body focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-label text-sand-700 mb-1.5">Password</label>
              <input
                id="reg-password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-body focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                disabled={loading}
              />
            </div>

            <fieldset disabled={loading}>
              <legend className="block text-label text-sand-700 mb-2">I want to join as</legend>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`text-center px-2 py-3 rounded-subtle border transition-colors duration-150 ${
                      role === r.value
                        ? 'bg-primary-800 text-white border-primary-800'
                        : 'bg-sand-100 text-sand-700 border-sand-200 hover:border-primary-400'
                    }`}
                  >
                    <span className="block text-sm font-semibold leading-tight">{r.label}</span>
                    <span className={`block text-[0.65rem] mt-0.5 leading-tight ${role === r.value ? 'text-primary-200' : 'text-sand-400'}`}>{r.desc}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {role === 'driver' && (
              <fieldset className="space-y-4 border-t border-sand-200 pt-5" disabled={loading}>
                <legend className="mb-3 text-[0.8125rem] font-semibold text-sand-900">
                  Driver profile details
                </legend>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="driver-current-location" className="block text-label text-sand-700 mb-1.5">Current Location</label>
                    <input
                      id="driver-current-location"
                      type="text"
                      placeholder="Alexandria"
                      value={driverDetails.currentLocation}
                      onChange={(e) => setDriverDetails((prev) => ({ ...prev, currentLocation: e.target.value }))}
                      className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-[0.9rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                    />
                  </div>
                  <div>
                    <label htmlFor="driver-availability" className="block text-label text-sand-700 mb-1.5">Availability</label>
                    <select
                      id="driver-availability"
                      value={driverDetails.availability}
                      onChange={(e) => setDriverDetails((prev) => ({ ...prev, availability: e.target.value }))}
                      className="w-full bg-sand-100 border border-sand-200 text-sand-950 rounded-subtle px-4 py-3 text-[0.9rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                    >
                      <option value="">Select availability</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Weekdays">Weekdays</option>
                      <option value="Weekends">Weekends</option>
                      <option value="Evenings">Evenings</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="driver-covered-areas" className="block text-label text-sand-700 mb-1.5">Areas / Cities Covered</label>
                  <input
                    id="driver-covered-areas"
                    type="text"
                    placeholder="Alexandria, Cairo, North Coast"
                    value={driverDetails.coveredAreas}
                    onChange={(e) => setDriverDetails((prev) => ({ ...prev, coveredAreas: e.target.value }))}
                    className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-[0.9rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="driver-experience" className="block text-label text-sand-700 mb-1.5">Driving Experience</label>
                    <input
                      id="driver-experience"
                      type="text"
                      placeholder="6 years, airport routes"
                      value={driverDetails.drivingExperience}
                      onChange={(e) => setDriverDetails((prev) => ({ ...prev, drivingExperience: e.target.value }))}
                      className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-[0.9rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                    />
                  </div>
                  <div>
                    <label htmlFor="driver-vehicle-types" className="block text-label text-sand-700 mb-1.5">Vehicle Types</label>
                    <input
                      id="driver-vehicle-types"
                      type="text"
                      placeholder="Sedan, SUV, Van"
                      value={driverDetails.vehicleTypes}
                      onChange={(e) => setDriverDetails((prev) => ({ ...prev, vehicleTypes: e.target.value }))}
                      className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-[0.9rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="driver-license-info" className="block text-label text-sand-700 mb-1.5">License Information</label>
                  <input
                    id="driver-license-info"
                    type="text"
                    placeholder="Private license, valid through 2029"
                    value={driverDetails.licenseInfo}
                    onChange={(e) => setDriverDetails((prev) => ({ ...prev, licenseInfo: e.target.value }))}
                    className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-[0.9rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="driver-languages" className="block text-label text-sand-700 mb-1.5">Languages Spoken</label>
                    <input
                      id="driver-languages"
                      type="text"
                      placeholder="Arabic, English"
                      value={driverDetails.languagesSpoken}
                      onChange={(e) => setDriverDetails((prev) => ({ ...prev, languagesSpoken: e.target.value }))}
                      className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-[0.9rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                    />
                  </div>
                  <div>
                    <label htmlFor="driver-contact" className="block text-label text-sand-700 mb-1.5">Contact Details</label>
                    <input
                      id="driver-contact"
                      type="text"
                      placeholder="Phone or WhatsApp"
                      value={driverDetails.contactDetails}
                      onChange={(e) => setDriverDetails((prev) => ({ ...prev, contactDetails: e.target.value }))}
                      className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-[0.9rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                    />
                  </div>
                </div>
              </fieldset>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-800 text-white font-semibold py-3.5 rounded-subtle hover:bg-primary-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign up'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sand-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-700 font-semibold hover:text-primary-800 transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
