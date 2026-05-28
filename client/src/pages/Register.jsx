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

const passwordChecks = (value) => ({
  length: value.length >= 8,
  upper: /[A-Z]/.test(value),
  special: /[^A-Za-z0-9]/.test(value),
});

const passwordStrength = (value) => {
  const score = Object.values(passwordChecks(value)).filter(Boolean).length;
  if (score >= 3) return { label: 'Strong', className: 'text-green-700' };
  if (score >= 2) return { label: 'Medium', className: 'text-signal-700' };
  return { label: 'Weak', className: 'text-red-700' };
};

const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters' },
  { key: 'upper', label: 'At least 1 uppercase letter' },
  { key: 'special', label: 'At least 1 symbol' },
];

export default function Register() {
  const [step, setStep] = useState('credentials');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [accountDetails, setAccountDetails] = useState({
    dateOfBirth: '',
    gender: '',
    city: '',
    phone: '',
    nationality: '',
    preferredLanguage: 'English',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
  });
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
  const emailRef = useRef(null);
  const navigate = useNavigate();
  const checks = passwordChecks(password);
  const strength = passwordStrength(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordReady = Object.values(checks).every(Boolean) && passwordsMatch;

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!Object.values(checks).every(Boolean)) {
      setError('Password must be 8+ characters and include uppercase and symbol.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (step === 'credentials') {
      setStep('details');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!name.trim()) {
      setError('Add your full name.');
      return;
    }
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
        dateOfBirth: accountDetails.dateOfBirth,
        gender: accountDetails.gender,
        city: accountDetails.city,
        currentLocation: accountDetails.city,
        phone: accountDetails.phone,
        nationality: accountDetails.nationality,
        preferredLanguage: accountDetails.preferredLanguage,
        emergencyContact: {
          name: accountDetails.emergencyContactName,
          phone: accountDetails.emergencyContactPhone,
          relation: accountDetails.emergencyContactRelation,
        },
        ...(role === 'driver'
          ? {
              currentLocation: accountDetails.city,
              coveredAreas: listFromText(driverDetails.coveredAreas),
              availability: driverDetails.availability,
              drivingExperience: driverDetails.drivingExperience,
              vehicleTypes: listFromText(driverDetails.vehicleTypes),
              licenseInfo: driverDetails.licenseInfo,
              languagesSpoken: listFromText(driverDetails.languagesSpoken),
              contactDetails: accountDetails.phone,
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

          <div className="mb-6">
            <div className="mb-4 flex items-center gap-2 text-[0.75rem] font-semibold text-sand-500">
              <span className={`h-1.5 flex-1 rounded-full ${step === 'credentials' ? 'bg-primary-800' : 'bg-green-600'}`} />
              <span className={`h-1.5 flex-1 rounded-full ${step === 'details' ? 'bg-primary-800' : 'bg-sand-200'}`} />
            </div>
            <h1 className="text-[1.55rem] font-bold leading-tight text-primary-800">
              {step === 'credentials' ? 'Create your account' : 'Account details'}
            </h1>
            <p className="mt-2 text-[0.92rem] leading-6 text-sand-500">
              {step === 'credentials'
                ? 'Start with email and password. Details come next.'
                : 'Add the info renters and owners need to trust your profile.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-subtle px-4 py-3 mb-6" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {step === 'credentials' && (
              <>
            <div>
              <label htmlFor="reg-email" className="block text-label text-sand-700 mb-1.5">Email</label>
              <input
                ref={emailRef}
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
                placeholder="8+ chars, uppercase, symbol"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-body focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                disabled={loading}
              />
              {password && (
                <div className="mt-2 space-y-1.5 rounded-subtle bg-sand-100 px-3 py-2">
                  <p className={`text-[0.75rem] font-semibold ${strength.className}`}>Strength: {strength.label}</p>
                  {PASSWORD_RULES.map((rule) => (
                    <PasswordRule key={rule.key} valid={checks[rule.key]} label={rule.label} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="reg-confirm-password" className="block text-label text-sand-700 mb-1.5">Confirm Password</label>
              <input
                id="reg-confirm-password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Retype password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-body focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                disabled={loading}
              />
              {confirmPassword && (
                <p className={`mt-1.5 text-[0.75rem] font-semibold ${passwordsMatch ? 'text-green-700' : 'text-red-700'}`}>
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>
              </>
            )}

            {step === 'details' && (
              <>
            <div>
              <label htmlFor="reg-name" className="block text-label text-sand-700 mb-1.5">Full name</label>
              <input
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

            <fieldset className="space-y-4 border-t border-sand-200 pt-5" disabled={loading}>
              <legend className="mb-3 text-[0.8125rem] font-semibold text-sand-900">Account details</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <RegisterInput id="reg-dob" label="Date of birth" type="date" value={accountDetails.dateOfBirth} onChange={(value) => setAccountDetails((prev) => ({ ...prev, dateOfBirth: value }))} />
                <div>
                  <label htmlFor="reg-gender" className="block text-label text-sand-700 mb-1.5">Gender</label>
                  <select id="reg-gender" value={accountDetails.gender} onChange={(e) => setAccountDetails((prev) => ({ ...prev, gender: e.target.value }))} className="w-full bg-sand-100 border border-sand-200 text-sand-950 rounded-subtle px-4 py-3 text-[0.9rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150">
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <RegisterInput id="reg-city" label="Current city" value={accountDetails.city} placeholder="Alexandria" onChange={(value) => setAccountDetails((prev) => ({ ...prev, city: value }))} />
                <RegisterInput id="reg-phone" label="Phone number" type="tel" value={accountDetails.phone} placeholder="01012345678" onChange={(value) => setAccountDetails((prev) => ({ ...prev, phone: value }))} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <RegisterInput id="reg-nationality" label="Nationality" value={accountDetails.nationality} placeholder="Egyptian" onChange={(value) => setAccountDetails((prev) => ({ ...prev, nationality: value }))} />
                <RegisterInput id="reg-language" label="Preferred language" value={accountDetails.preferredLanguage} placeholder="English" onChange={(value) => setAccountDetails((prev) => ({ ...prev, preferredLanguage: value }))} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <RegisterInput id="reg-emergency-name" label="Emergency contact (optional)" value={accountDetails.emergencyContactName} placeholder="Name" onChange={(value) => setAccountDetails((prev) => ({ ...prev, emergencyContactName: value }))} />
                <RegisterInput id="reg-emergency-phone" label="Contact phone (optional)" type="tel" value={accountDetails.emergencyContactPhone} placeholder="Phone" onChange={(value) => setAccountDetails((prev) => ({ ...prev, emergencyContactPhone: value }))} />
                <RegisterInput id="reg-emergency-relation" label="Relation (optional)" value={accountDetails.emergencyContactRelation} placeholder="Brother" onChange={(value) => setAccountDetails((prev) => ({ ...prev, emergencyContactRelation: value }))} />
              </div>
            </fieldset>

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
              </fieldset>
            )}
              </>
            )}

            <div className="flex gap-3">
              {step === 'details' && (
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  disabled={loading}
                  className="rounded-subtle border border-sand-200 bg-sand-100 px-4 py-3 text-[0.85rem] font-semibold text-sand-700 transition-colors hover:bg-sand-200/70 disabled:opacity-60"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading || (step === 'credentials' && !passwordReady)}
                className="flex flex-1 items-center justify-center gap-2 rounded-subtle bg-primary-800 py-3 text-[0.9rem] font-semibold text-white transition-all duration-150 hover:bg-primary-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : step === 'credentials' ? (
                  'Continue'
                ) : (
                  'Sign up'
                )}
              </button>
            </div>
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

function RegisterInput({ id, label, value, onChange, placeholder = '', type = 'text' }) {
  return (
    <div>
      <label htmlFor={id} className="block text-label text-sand-700 mb-1.5">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-[0.9rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
      />
    </div>
  );
}

function PasswordRule({ valid, label }) {
  return (
    <p className={`flex items-center gap-1.5 text-[0.72rem] font-medium ${valid ? 'text-green-700' : 'text-red-700'}`}>
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border text-[0.58rem] leading-none">
        {valid ? 'OK' : '!'}
      </span>
      {label}
    </p>
  );
}
