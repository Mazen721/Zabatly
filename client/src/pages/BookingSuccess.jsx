import { Link, useLocation, Navigate } from 'react-router-dom';

const methodLabels = {
  card: 'Credit / Debit Card',
  vodafone_cash: 'Vodafone Cash',
  instapay: 'InstaPay',
};

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
    : 'https://placehold.co/420x280/f2efea/a49888?text=Zabatly';

export default function BookingSuccess() {
  const { state } = useLocation();
  const booking = state?.booking;
  const vehicle = state?.vehicle || booking?.vehicle;
  const paymentMethod = state?.paymentMethod || booking?.payment?.method;

  if (!booking) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="mx-auto max-w-[980px] px-6 py-10 lg:px-10">
        <div className="rounded-soft border border-sand-200 bg-sand-50 p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-soft bg-green-50 text-green-700 ring-1 ring-green-200">
              <svg className="h-9 w-9 animate-[successPop_500ms_cubic-bezier(0.25,1,0.5,1)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-green-700">Booking confirmed</p>
              <h1 className="mt-1 text-[1.65rem] font-bold leading-tight text-sand-950">Your ride is reserved</h1>
              <p className="mt-2 max-w-prose text-[0.875rem] leading-relaxed text-sand-600">
                Payment is marked as received. The owner can now see the reservation and payment details.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <img src={getImage(vehicle)} alt="" className="aspect-[4/3] w-full rounded-soft object-cover" />
            <div className="space-y-4">
              <div>
                <h2 className="text-[1.05rem] font-semibold text-sand-950">
                  {vehicle?.make || 'Vehicle'} {vehicle?.model || ''}
                </h2>
                <p className="mt-1 text-[0.8125rem] text-sand-500">Booking ID: <span className="font-semibold text-sand-700">{booking._id}</span></p>
              </div>

              <div className="grid gap-px overflow-hidden rounded-soft border border-sand-200 bg-sand-200 sm:grid-cols-2">
                <SummaryTile label="Dates" value={`${formatDate(booking.startDate)} to ${formatDate(booking.endDate)}`} />
                <SummaryTile label="Payment Method" value={methodLabels[paymentMethod] || 'Payment'} />
                <SummaryTile label="Status" value={booking.status || 'pending'} />
                <SummaryTile label="Total" value={`${Number(booking.totalPrice || 0).toLocaleString()} EGP`} />
              </div>

              {booking.payment?.proofUrl && (
                <a
                  href={booking.payment.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-subtle border border-sand-200 bg-sand-100 px-3 py-2 text-[0.75rem] font-semibold text-primary-700 transition-colors hover:bg-sand-200/60"
                >
                  Payment Proof
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3h7v7" />
                    <path d="M13 3 5 11" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/dashboard" className="inline-flex justify-center rounded-subtle bg-primary-800 px-5 py-3 text-[0.85rem] font-semibold text-white transition-colors hover:bg-primary-900">
              Back to Dashboard
            </Link>
            <Link to="/dashboard" state={{ section: 'bookings' }} className="inline-flex justify-center rounded-subtle border border-sand-200 bg-sand-100 px-5 py-3 text-[0.85rem] font-semibold text-primary-700 transition-colors hover:bg-sand-200/60">
              View My Bookings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ label, value }) {
  return (
    <div className="bg-sand-50 px-4 py-3">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500">{label}</p>
      <p className="mt-1 text-[0.875rem] font-semibold capitalize text-sand-900">{value}</p>
    </div>
  );
}
