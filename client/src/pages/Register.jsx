import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { API } from '../config/api';
import { useTranslation } from 'react-i18next';

const passwordChecks = (value) => ({
  length: value.length >= 8,
  upper: /[A-Z]/.test(value),
  special: /[^A-Za-z0-9]/.test(value),
});

export default function Register() {
  const { t } = useTranslation('auth');
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

  const passwordStrength = (value) => {
    const score = Object.values(passwordChecks(value)).filter(Boolean).length;
    if (score >= 3) return { label: t('register.strong'), className: 'text-green-700' };
    if (score >= 2) return { label: t('register.medium'), className: 'text-signal-700' };
    return { label: t('register.weak'), className: 'text-red-700' };
  };

  const strength = passwordStrength(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordReady = Object.values(checks).every(Boolean) && passwordsMatch;

  const PASSWORD_RULES = [
    { key: 'length', label: t('register.rule8chars') },
    { key: 'upper', label: t('register.rule1upper') },
    { key: 'special', label: t('register.rule1symbol') },
  ];

  const ROLES = [
    { value: 'user', label: t('register.renter'), desc: t('register.renterDesc') },
    { value: 'agency', label: t('register.agencyOwner'), desc: t('register.agencyDesc') },
    { value: 'driver', label: t('register.freelanceDriver'), desc: t('register.driverDesc') },
  ];

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!Object.values(checks).every(Boolean)) {
      setError(t('register.passwordError'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('register.passwordMismatch'));
      return;
    }
    if (step === 'credentials') {
      setStep('details');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!name.trim()) {
      setError(t('register.nameRequired'));
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
      setError(err.response?.data?.message || t('register.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-sand-50 px-5 py-10 sm:px-6 sm:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <Link to="/" className="mx-auto mb-12 flex w-fit items-center gap-2 sm:mb-16" aria-label="Zabatly home">
          <span className="text-3xl font-extrabold tracking-tight text-primary-800">Zabatly</span>
          <span className="text-3xl font-bold text-signal-500 font-arabic">زبطلي</span>
        </Link>

        <section aria-labelledby="register-title">
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-2 text-[0.75rem] font-semibold text-sand-500">
              <span className={`h-1.5 flex-1 rounded-full ${step === 'credentials' ? 'bg-primary-800' : 'bg-green-600'}`} />
              <span className={`h-1.5 flex-1 rounded-full ${step === 'details' ? 'bg-primary-800' : 'bg-sand-200'}`} />
            </div>
            <h1 id="register-title" className="text-[1.55rem] font-bold leading-tight text-primary-800">
              {step === 'credentials' ? t('register.createAccount') : t('register.accountDetails')}
            </h1>
            <p className="mt-2 text-[0.92rem] leading-6 text-sand-500">
              {step === 'credentials'
                ? t('register.step1Subtitle')
                : t('register.step2Subtitle')}
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
              <label htmlFor="reg-email" className="block text-label text-sand-700 mb-1.5">{t('register.email')}</label>
              <input
                ref={emailRef}
                id="reg-email"
                type="email"
                required
                autoComplete="email"
                placeholder={t('register.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-body focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-label text-sand-700 mb-1.5">{t('register.password')}</label>
              <input
                id="reg-password"
                type="password"
                required
                autoComplete="new-password"
                placeholder={t('register.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-body focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                disabled={loading}
              />
              {password && (
                <div className="mt-2 space-y-1.5 rounded-subtle bg-sand-100 px-3 py-2">
                  <p className={`text-[0.75rem] font-semibold ${strength.className}`}>{t('register.strength')}: {strength.label}</p>
                  {PASSWORD_RULES.map((rule) => (
                    <PasswordRule key={rule.key} valid={checks[rule.key]} label={rule.label} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="reg-confirm-password" className="block text-label text-sand-700 mb-1.5">{t('register.confirmPassword')}</label>
              <input
                id="reg-confirm-password"
                type="password"
                required
                autoComplete="new-password"
                placeholder={t('register.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-body focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                disabled={loading}
              />
              {confirmPassword && (
                <p className={`mt-1.5 text-[0.75rem] font-semibold ${passwordsMatch ? 'text-green-700' : 'text-red-700'}`}>
                  {passwordsMatch ? t('register.passwordsMatch') : t('register.passwordsDontMatch')}
                </p>
              )}
            </div>
              </>
            )}

            {step === 'details' && (
              <>
            <div>
              <label htmlFor="reg-name" className="block text-label text-sand-700 mb-1.5">{t('register.fullName')}</label>
              <input
                id="reg-name"
                type="text"
                required
                autoComplete="name"
                placeholder={t('register.fullNamePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-body focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                disabled={loading}
              />
            </div>

            <fieldset className="space-y-4 border-t border-sand-200 pt-5" disabled={loading}>
              <legend className="mb-3 text-[0.8125rem] font-semibold text-sand-900">{t('register.accountDetailsLegend')}</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <RegisterInput id="reg-dob" label={t('register.dateOfBirth')} type="date" value={accountDetails.dateOfBirth} onChange={(value) => setAccountDetails((prev) => ({ ...prev, dateOfBirth: value }))} />
                <div>
                  <label htmlFor="reg-gender" className="block text-label text-sand-700 mb-1.5">{t('register.gender')}</label>
                  <select id="reg-gender" value={accountDetails.gender} onChange={(e) => setAccountDetails((prev) => ({ ...prev, gender: e.target.value }))} className="w-full bg-sand-100 border border-sand-200 text-sand-950 rounded-subtle px-4 py-3 text-[0.9rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150">
                    <option value="">{t('register.selectGender')}</option>
                    <option value="male">{t('register.male')}</option>
                    <option value="female">{t('register.female')}</option>
                    <option value="other">{t('register.other')}</option>
                    <option value="prefer_not_to_say">{t('register.preferNotToSay')}</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <RegisterInput id="reg-city" label={t('register.currentCity')} value={accountDetails.city} placeholder={t('register.cityPlaceholder')} onChange={(value) => setAccountDetails((prev) => ({ ...prev, city: value }))} />
                <RegisterInput id="reg-phone" label={t('register.phone')} type="tel" value={accountDetails.phone} placeholder={t('register.phonePlaceholder')} onChange={(value) => setAccountDetails((prev) => ({ ...prev, phone: value }))} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <RegisterInput id="reg-nationality" label={t('register.nationality')} value={accountDetails.nationality} placeholder={t('register.nationalityPlaceholder')} onChange={(value) => setAccountDetails((prev) => ({ ...prev, nationality: value }))} />
                <RegisterInput id="reg-language" label={t('register.preferredLanguage')} value={accountDetails.preferredLanguage} placeholder={t('register.preferredLanguagePlaceholder')} onChange={(value) => setAccountDetails((prev) => ({ ...prev, preferredLanguage: value }))} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <RegisterInput id="reg-emergency-name" label={t('register.emergencyContact')} value={accountDetails.emergencyContactName} placeholder={t('register.emergencyNamePlaceholder')} onChange={(value) => setAccountDetails((prev) => ({ ...prev, emergencyContactName: value }))} />
                <RegisterInput id="reg-emergency-phone" label={t('register.contactPhone')} type="tel" value={accountDetails.emergencyContactPhone} placeholder={t('register.emergencyPhonePlaceholder')} onChange={(value) => setAccountDetails((prev) => ({ ...prev, emergencyContactPhone: value }))} />
                <RegisterInput id="reg-emergency-relation" label={t('register.relation')} value={accountDetails.emergencyContactRelation} placeholder={t('register.relationPlaceholder')} onChange={(value) => setAccountDetails((prev) => ({ ...prev, emergencyContactRelation: value }))} />
              </div>
            </fieldset>

            <fieldset disabled={loading}>
              <legend className="block text-label text-sand-700 mb-2">{t('register.joinAs')}</legend>
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
                  {t('register.driverProfileDetails')}
                </legend>

                <div>
                  <label htmlFor="driver-availability" className="block text-label text-sand-700 mb-1.5">{t('register.availability')}</label>
                  <select
                    id="driver-availability"
                    value={driverDetails.availability}
                    onChange={(e) => setDriverDetails((prev) => ({ ...prev, availability: e.target.value }))}
                    className="w-full bg-sand-100 border border-sand-200 text-sand-950 rounded-subtle px-4 py-3 text-[0.9rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                  >
                    <option value="">{t('register.selectAvailability')}</option>
                    <option value="Full-time">{t('register.fullTime')}</option>
                    <option value="Weekdays">{t('register.weekdays')}</option>
                    <option value="Weekends">{t('register.weekends')}</option>
                    <option value="Evenings">{t('register.evenings')}</option>
                    <option value="Flexible">{t('register.flexible')}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="driver-covered-areas" className="block text-label text-sand-700 mb-1.5">{t('register.areasCovered')}</label>
                  <input
                    id="driver-covered-areas"
                    type="text"
                    placeholder={t('register.areasCoveredPlaceholder')}
                    value={driverDetails.coveredAreas}
                    onChange={(e) => setDriverDetails((prev) => ({ ...prev, coveredAreas: e.target.value }))}
                    className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-[0.9rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="driver-experience" className="block text-label text-sand-700 mb-1.5">{t('register.drivingExperience')}</label>
                    <input
                      id="driver-experience"
                      type="text"
                      placeholder={t('register.experiencePlaceholder')}
                      value={driverDetails.drivingExperience}
                      onChange={(e) => setDriverDetails((prev) => ({ ...prev, drivingExperience: e.target.value }))}
                      className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-[0.9rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                    />
                  </div>
                  <div>
                    <label htmlFor="driver-vehicle-types" className="block text-label text-sand-700 mb-1.5">{t('register.vehicleTypes')}</label>
                    <input
                      id="driver-vehicle-types"
                      type="text"
                      placeholder={t('register.vehicleTypesPlaceholder')}
                      value={driverDetails.vehicleTypes}
                      onChange={(e) => setDriverDetails((prev) => ({ ...prev, vehicleTypes: e.target.value }))}
                      className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-[0.9rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="driver-license-info" className="block text-label text-sand-700 mb-1.5">{t('register.licenseInfo')}</label>
                  <input
                    id="driver-license-info"
                    type="text"
                    placeholder={t('register.licenseInfoPlaceholder')}
                    value={driverDetails.licenseInfo}
                    onChange={(e) => setDriverDetails((prev) => ({ ...prev, licenseInfo: e.target.value }))}
                    className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-[0.9rem] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                  />
                </div>

                <div>
                  <label htmlFor="driver-languages" className="block text-label text-sand-700 mb-1.5">{t('register.languagesSpoken')}</label>
                  <input
                    id="driver-languages"
                    type="text"
                    placeholder={t('register.languagesPlaceholder')}
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
                  {t('register.back')}
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
                  t('register.continue')
                ) : (
                  t('register.signUp')
                )}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sand-500 text-sm">
            {t('register.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-primary-700 font-semibold hover:text-primary-800 transition-colors">
              {t('register.logIn')}
            </Link>
          </p>
        </section>
      </div>
    </main>
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
