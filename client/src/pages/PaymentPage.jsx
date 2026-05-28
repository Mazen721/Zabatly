import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config/api';
const VODAFONE_NUMBER = '01090923550';
const INSTAPAY_ID = 'mazen721@instapay';
const SERVICE_FEE_RATE = 0.1;

const methods = [
  { id: 'card', label: 'Credit / Debit Card', helper: 'Visa and Mastercard' },
  { id: 'vodafone_cash', label: 'Vodafone Cash', helper: VODAFONE_NUMBER },
  { id: 'instapay', label: 'InstaPay', helper: INSTAPAY_ID },
];

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

const getImage = (vehicle) =>
  vehicle?.images?.length > 0
    ? vehicle.images[0]
    : 'https://placehold.co/320x220/f2efea/a49888?text=Zabatly';

const formatCardNumber = (value) =>
  value
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim();

const detectBrand = (number) => {
  const digits = number.replace(/\D/g, '');
  if (!digits) return 'Card';
  if (digits.startsWith('4')) return 'Visa';
  if (digits.startsWith('5')) return 'Mastercard';
  const firstFour = Number(digits.slice(0, 4));
  if (digits.length >= 4 && firstFour >= 2221 && firstFour <= 2720) {
    return 'Mastercard';
  }
  return 'Card';
};

const cardThemes = {
  Visa: {
    name: 'Visa detected',
    previewStyle: {
      background: 'linear-gradient(135deg, #1434cb 0%, #1b2b44 62%, #f7b600 150%)',
    },
    panelStyle: { borderColor: 'rgba(20, 52, 203, 0.34)', backgroundColor: 'rgba(20, 52, 203, 0.04)' },
    labelClass: 'text-primary-700',
  },
  Mastercard: {
    name: 'Mastercard detected',
    previewStyle: {
      background: 'linear-gradient(135deg, #eb001b 0%, #2c2723 48%, #f79e1b 130%)',
    },
    panelStyle: { borderColor: 'rgba(221, 143, 36, 0.45)', backgroundColor: 'rgba(221, 143, 36, 0.08)' },
    labelClass: 'text-signal-700',
  },
  Card: {
    name: 'Card details',
    previewStyle: {
      background: '#1b2b44',
    },
    panelStyle: null,
    labelClass: 'text-sand-500',
  },
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString()} EGP`;

function FloatingInput({ label, value, onChange, placeholder, maxLength, inputMode = 'text' }) {
  return (
    <label className="group block">
      <span className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500">
        {label}
      </span>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        className="w-full rounded-subtle border border-sand-200 bg-sand-100 px-3 py-3 text-[0.875rem] text-sand-950 outline-none transition-all duration-200 ease-out-quart placeholder:text-sand-400 focus:border-primary-600 focus:bg-sand-50 focus:ring-1 focus:ring-primary-600"
      />
    </label>
  );
}

function BrandMark({ brand }) {
  return (
    <div className="flex h-8 min-w-12 items-center justify-center rounded-subtle border border-sand-200 bg-sand-50 px-2 text-[0.68rem] font-bold text-primary-800 shadow-sm transition-all duration-200 ease-out-quart">
      {brand === 'Mastercard' ? (
        <span className="flex items-center">
          <span className="h-4 w-4 rounded-full bg-signal-500" />
          <span className="-ml-1.5 h-4 w-4 rounded-full bg-primary-500/80" />
        </span>
      ) : brand === 'Visa' ? (
        <span className="tracking-[0.08em]">VISA</span>
      ) : (
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
          <path d="M1.5 7h13" />
        </svg>
      )}
    </div>
  );
}

function VodafoneIcon({ className }) {
  return (
    <svg viewBox="-.398 -4.59 378.918 388.633" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="m119.441 14.328c47.465-18.918 102.754-17.61 148.954 4.363-13.165-2-26.555-.492-39.586 1.711-35.391 6.684-69.024 23.336-95.313 48.075-25.207 24.777-42.871 57.652-47.86 92.824-3.3 24.922-.241 51.062 10.942 73.746 11.524 23.8 31.809 43.32 56.258 53.394 23.559 9.97 50.887 9.86 74.75.961 35.805-13.14 61.531-48.62 64.473-86.527 1.851-24.844-4.192-51.273-20.883-70.328-15.934-18.652-39.238-28.926-62.559-34.774-1.25-23 9.586-45.722 26.77-60.68 9.543-8.605 21.386-14.09 33.633-17.6l.93-.321c35.058 16.812 64.847 44.539 83.827 78.578 16.262 28.98 24.743 62.375 23.903 95.64-.16 43.016-16.239 85.606-43.801 118.497-26.063 31.367-62.516 53.93-102.246 62.965-39.836 9.191-82.695 5.226-119.977-11.704-36.48-16.293-67.386-44.617-87.047-79.457-16.355-28.953-25.007-62.336-24.289-95.64.078-41.496 14.813-82.672 40.54-115.121 20.55-25.91 47.812-46.512 78.581-58.602zm0 0" fill="#e60000"/>
      <path d="m228.809 20.402c13.03-2.203 26.421-3.71 39.586-1.71l1.89.32-1.265.48c-12.247 3.512-24.09 8.996-33.633 17.602-17.184 14.957-28.02 37.68-26.77 60.68 23.32 5.847 46.625 16.12 62.559 34.773 16.691 19.055 22.734 45.484 20.883 70.328-2.942 37.906-28.668 73.387-64.473 86.527-23.863 8.899-51.191 9.008-74.75-.96-24.45-10.075-44.734-29.594-56.258-53.395-11.183-22.684-14.242-48.824-10.941-73.746 4.988-35.172 22.652-68.047 47.86-92.824 26.288-24.739 59.921-41.391 95.312-48.075zm0 0" fill="#fff"/>
    </svg>
  );
}

function InstaPayIcon({ className }) {
  return (
    <img src="/instapay.png" alt="InstaPay" className={className} />
  );
}

function ProofUpload({ proof, setProof }) {
  const [dragging, setDragging] = useState(false);
  const preview = proof ? URL.createObjectURL(proof) : null;

  const acceptFile = (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return;
    setProof(file);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        acceptFile(event.dataTransfer.files?.[0]);
      }}
      className={`rounded-soft border border-dashed p-4 transition-all duration-200 ease-out-quart ${
        dragging
          ? 'border-primary-500 bg-primary-50'
          : proof
            ? 'border-green-200 bg-green-50'
            : 'border-sand-300 bg-sand-100 hover:border-primary-300 hover:bg-sand-50'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-20 w-full items-center justify-center overflow-hidden rounded-subtle border border-sand-200 bg-sand-50 sm:w-28">
          {preview ? (
            <img src={preview} alt="Payment proof preview" className="h-full w-full object-cover" />
          ) : (
            <svg width="28" height="28" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sand-400">
              <path d="M8 11V3" />
              <path d="M5 6l3-3 3 3" />
              <path d="M3 13h10" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.875rem] font-semibold text-sand-900">Upload payment screenshot</p>
          <p className="mt-1 text-[0.75rem] text-sand-500">JPG, PNG, or WEBP. Drag it here or choose a file.</p>
          {proof && (
            <p className="mt-2 text-[0.75rem] font-semibold text-green-700">Receipt uploaded</p>
          )}
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer rounded-subtle border border-sand-200 bg-sand-50 px-3 py-2 text-[0.75rem] font-semibold text-primary-700 transition-colors duration-150 hover:bg-sand-100">
            {proof ? 'Replace' : 'Choose'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => acceptFile(event.target.files?.[0])}
            />
          </label>
          {proof && (
            <button
              type="button"
              onClick={() => setProof(null)}
              className="rounded-subtle border border-red-200 bg-red-50 px-3 py-2 text-[0.75rem] font-semibold text-red-700 transition-colors duration-150 hover:bg-red-100"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const draft = location.state?.bookingDraft || JSON.parse(sessionStorage.getItem('zabatlyBookingDraft') || 'null');
  const user = JSON.parse(localStorage.getItem('userInfo') || 'null');

  const [method, setMethod] = useState('card');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [proof, setProof] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const brand = useMemo(() => detectBrand(cardNumber), [cardNumber]);
  const theme = cardThemes[brand] || cardThemes.Card;
  const vehiclePrice = Number(draft?.payload?.totalPrice || 0);
  const serviceFee = Math.round(vehiclePrice * SERVICE_FEE_RATE * 100) / 100;
  const finalTotal = vehiclePrice + serviceFee;

  if (!draft) {
    return (
      <div className="min-h-screen bg-sand-50 px-6 py-16">
        <div className="mx-auto max-w-lg rounded-soft border border-sand-200 bg-sand-50 p-6 text-center">
          <h1 className="text-[1.25rem] font-semibold text-sand-950">No booking ready</h1>
          <p className="mt-2 text-[0.875rem] text-sand-500">Choose a vehicle and dates before payment.</p>
          <Link to="/explore" className="mt-5 inline-flex rounded-subtle bg-primary-800 px-5 py-2.5 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-primary-900">
            Browse Fleet
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-sand-50 px-6 py-16">
        <div className="mx-auto max-w-lg rounded-soft border border-sand-200 bg-sand-50 p-6 text-center">
          <h1 className="text-[1.25rem] font-semibold text-sand-950">Log in to pay</h1>
          <p className="mt-2 text-[0.875rem] text-sand-500">Your booking is saved for this browser.</p>
          <Link to="/login" className="mt-5 inline-flex rounded-subtle bg-primary-800 px-5 py-2.5 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-primary-900">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  const validate = () => {
    if (method === 'card') {
      if (!cardName.trim() || !cardNumber.trim() || !expiry.trim() || !cvv.trim()) {
        return 'Fill in all card details.';
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
        return 'Use expiry format MM/YY.';
      }
      if (!/^\d{3,4}$/.test(cvv)) {
        return 'CVV must be 3 or 4 digits.';
      }
    } else if (!proof) {
      return 'Upload payment screenshot before confirming.';
    }
    return '';
  };

  const copyValue = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      setError('Could not copy. Please copy it manually.');
    }
  };

  const submitPayment = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      Object.entries(draft.payload).forEach(([key, value]) => {
        if (key === 'totalPrice') return;
        formData.append(key, value ?? '');
      });
      formData.append('rentalPrice', vehiclePrice);
      formData.append('serviceFee', serviceFee);
      formData.append('totalPrice', finalTotal);
      formData.append('paymentMethod', method);
      if (proof) formData.append('paymentProof', proof);

      const { data } = await axios.post(`${API}/api/bookings`, formData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      sessionStorage.removeItem('zabatlyBookingDraft');
      navigate('/booking-success', {
        state: {
          booking: data,
          vehicle: draft.vehicle,
          paymentMethod: method,
          proofPreview: proof ? URL.createObjectURL(proof) : null,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Payment could not be confirmed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const methodLabel = methods.find((item) => item.id === method)?.label;
  const canConfirm = method === 'card' || proof;

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="mx-auto max-w-[1180px] px-6 py-8 lg:px-10">
        <Link to={`/vehicles/${draft.vehicle._id}`} className="mb-5 inline-flex items-center gap-1 text-[0.8rem] font-medium text-sand-500 transition-colors hover:text-primary-700">
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 3 5 8l5 5" /></svg>
          Back to vehicle
        </Link>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-5">
            <div>
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-sand-500">Secure Payment</p>
              <h1 className="mt-1 text-[1.65rem] font-bold leading-tight text-sand-950">Confirm your booking</h1>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {methods.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setMethod(item.id);
                    setError('');
                  }}
                  className={`rounded-soft border p-4 text-left transition-all duration-200 ease-out-quart ${
                    method === item.id
                      ? 'border-primary-700 bg-primary-800 text-white shadow-sm'
                      : 'border-sand-200 bg-sand-50 text-sand-900 hover:bg-sand-100'
                  }`}
                >
                  <span className="block text-[0.875rem] font-semibold">{item.label}</span>
                  <span className={`mt-1 block text-[0.74rem] ${method === item.id ? 'text-primary-100' : 'text-sand-500'}`}>{item.helper}</span>
                </button>
              ))}
            </div>

            <div
              className="rounded-soft border border-sand-200 bg-sand-50 p-5 transition-all duration-200 ease-out-quart"
              style={method === 'card' && theme.panelStyle ? theme.panelStyle : undefined}
            >
              {method === 'card' && (
                <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
                  <div
                    className="rounded-soft p-5 text-white shadow-sm transition-transform duration-300 ease-out-quart hover:-translate-y-0.5"
                    style={theme.previewStyle}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[0.75rem] font-semibold text-primary-100">Zabatly Pay</span>
                      <BrandMark brand={brand} />
                    </div>
                    <p className="mt-10 font-mono text-[1.05rem] tracking-[0.08em]">
                      {cardNumber || '0000 0000 0000 0000'}
                    </p>
                    <div className="mt-8 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[0.62rem] uppercase tracking-[0.08em] text-primary-200">Holder</p>
                        <p className="mt-1 truncate text-[0.8rem] font-semibold">{cardName || 'Your Name'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[0.62rem] uppercase tracking-[0.08em] text-primary-200">Expiry</p>
                        <p className="mt-1 text-[0.8rem] font-semibold">{expiry || 'MM/YY'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className={`rounded-subtle border border-sand-200 bg-sand-50 px-3 py-2 text-[0.75rem] font-semibold ${theme.labelClass}`}>
                      {theme.name}
                    </div>
                    <FloatingInput label="Card Holder Name" value={cardName} onChange={(event) => setCardName(event.target.value)} placeholder="Mazen Ahmed" />
                    <div className="relative">
                      <FloatingInput
                        label="Card Number"
                        value={cardNumber}
                        onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                        placeholder="4242 4242 4242 4242"
                        inputMode="numeric"
                      />
                      <div className="absolute right-2 top-[1.95rem]">
                        <BrandMark brand={brand} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FloatingInput
                        label="Expiry Date"
                        value={expiry}
                        onChange={(event) => {
                          const value = event.target.value.replace(/[^\d]/g, '').slice(0, 4);
                          setExpiry(value.length > 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value);
                        }}
                        placeholder="MM/YY"
                        maxLength={5}
                        inputMode="numeric"
                      />
                      <FloatingInput
                        label="CVV"
                        value={cvv}
                        onChange={(event) => setCvv(event.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="123"
                        maxLength={4}
                        inputMode="numeric"
                      />
                    </div>
                    <div className="flex items-center gap-2 rounded-subtle bg-sand-100 px-3 py-2 text-[0.75rem] font-medium text-sand-600">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="7" width="10" height="7" rx="1.5" />
                        <path d="M5 7V5a3 3 0 0 1 6 0v2" />
                      </svg>
                      Secure Payment
                    </div>
                  </div>
                </div>
              )}

              {method === 'vodafone_cash' && (
                <div className="space-y-5">
                  <div className="rounded-soft border border-red-200 bg-red-50 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-red-700">Vodafone Cash</p>
                        <p className="mt-1 text-[1.35rem] font-bold tabular-nums text-sand-950">{VODAFONE_NUMBER}</p>
                        <p className="mt-1 text-[0.8125rem] text-sand-600">Send payment then press confirm.</p>
                      </div>
                      <button onClick={() => copyValue(VODAFONE_NUMBER)} className="rounded-subtle bg-primary-800 px-4 py-2 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-primary-900">
                        Copy number
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)]">
                    <div className="flex aspect-square items-center justify-center rounded-soft border border-sand-200 bg-white p-5 shadow-sm">
                      <VodafoneIcon className="h-full w-full object-contain" />
                    </div>
                    <ProofUpload proof={proof} setProof={setProof} />
                  </div>
                </div>
              )}

              {method === 'instapay' && (
                <div className="space-y-5">
                  <div className="rounded-soft border border-purple-200 bg-purple-50 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-purple-700">InstaPay</p>
                        <p className="mt-1 text-[1.25rem] font-bold text-sand-950">{INSTAPAY_ID}</p>
                        <p className="mt-1 text-[0.8125rem] text-sand-600">Transfer, upload the receipt, then confirm.</p>
                      </div>
                      <button onClick={() => copyValue(INSTAPAY_ID)} className="rounded-subtle bg-purple-700 px-4 py-2 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-purple-800">
                        Copy ID
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)]">
                    <div className="flex aspect-square items-center justify-center rounded-soft border border-purple-100 bg-white p-5 shadow-sm">
                      <InstaPayIcon className="h-full w-full object-contain" />
                    </div>
                    <ProofUpload proof={proof} setProof={setProof} />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-subtle border border-red-200 bg-red-50 px-4 py-3 text-[0.8125rem] text-red-700">
                {error}
              </div>
            )}
          </section>

          <aside className="h-fit rounded-soft border border-sand-200 bg-sand-50 p-5 lg:sticky lg:top-20">
            <img src={getImage(draft.vehicle)} alt="" className="aspect-[4/3] w-full rounded-soft object-cover" />
            <h2 className="mt-4 text-[1rem] font-semibold text-sand-950">{draft.vehicle.make} {draft.vehicle.model}</h2>
            <div className="mt-4 space-y-2 border-t border-sand-200 pt-4 text-[0.8125rem]">
              <div className="flex justify-between gap-4">
                <span className="text-sand-500">Dates</span>
                <span className="text-right font-semibold text-sand-800">{formatDate(draft.payload.startDate)} to {formatDate(draft.payload.endDate)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sand-500">Payment</span>
                <span className="font-semibold text-sand-800">{methodLabel}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sand-500">Vehicle Price</span>
                <span className="font-semibold tabular-nums text-sand-800">{formatMoney(vehiclePrice)}</span>
              </div>
              <div className="rounded-subtle border border-signal-200 bg-signal-50 px-3 py-2">
                <div className="flex justify-between gap-4">
                  <span className="font-semibold text-signal-700">Zabatly Fee (10%)</span>
                  <span className="font-bold tabular-nums text-signal-700">{formatMoney(serviceFee)}</span>
                </div>
              </div>
              <div className="flex justify-between gap-4 border-t border-sand-200 pt-3 text-[0.95rem]">
                <span className="font-semibold text-sand-950">Total</span>
                <span className="font-bold tabular-nums text-primary-800">{formatMoney(finalTotal)}</span>
              </div>
            </div>
            <button
              onClick={submitPayment}
              disabled={submitting || !canConfirm}
              className={`mt-5 w-full rounded-subtle py-3 text-[0.85rem] font-semibold transition-all duration-200 ease-out-quart ${
                submitting || !canConfirm
                  ? 'cursor-not-allowed bg-sand-200 text-sand-500'
                  : 'bg-primary-800 text-white hover:-translate-y-0.5 hover:bg-primary-900'
              }`}
            >
              {submitting ? 'Confirming...' : 'Confirm Payment'}
            </button>
            {method !== 'card' && !proof && (
              <p className="mt-2 text-center text-[0.7rem] text-sand-500">Upload receipt to enable confirmation.</p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
