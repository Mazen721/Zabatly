import { Link, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const formatDate = (date, language) =>
  date
    ? new Date(date).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-GB', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

const getImage = (vehicle) =>
  vehicle?.images?.length > 0
    ? vehicle.images[0]
    : 'https://placehold.co/420x280/f2efea/a49888?text=Zabatly';

export default function BookingSuccess() {
  const { t, i18n } = useTranslation('booking');
  const { state } = useLocation();
  const booking = state?.booking;
  const vehicle = state?.vehicle || booking?.vehicle;
  const driver = state?.driver || booking?.driver;
  const paymentMethod = state?.paymentMethod || booking?.payment?.method;
  const isDriverBooking = !vehicle && driver;
  const driverPhone = driver?.phone || booking?.driver?.phone;
  const whatsappPhone = driverPhone ? driverPhone.replace(/\D/g, '') : '';

  const methodLabels = {
    card: t('creditCard'),
    vodafone_cash: t('vodafoneCash'),
    instapay: t('instaPay'),
  };

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
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-green-700">{t('confirmed')}</p>
              <h1 className="mt-1 text-[1.65rem] font-bold leading-tight text-sand-950">{t('rideReserved')}</h1>
              <p className="mt-2 max-w-prose text-[0.875rem] leading-relaxed text-sand-600">
                {isDriverBooking ? t('driverMessage') : t('vehicleMessage')}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            {isDriverBooking ? (
              <div className="flex aspect-[4/3] w-full items-center justify-center rounded-soft border border-primary-200 bg-primary-50 text-[3rem] font-bold text-primary-800">
                {(driver?.name || 'Driver').slice(0, 1).toUpperCase()}
              </div>
            ) : (
              <img src={getImage(vehicle)} alt="" className="aspect-[4/3] w-full rounded-soft object-cover" />
            )}
            <div className="space-y-4">
              <div>
                <h2 className="text-[1.05rem] font-semibold text-sand-950">
                  {isDriverBooking ? driver?.name || t('driverService') : `${vehicle?.make || 'Vehicle'} ${vehicle?.model || ''}`}
                </h2>
                <p className="mt-1 text-[0.8125rem] text-sand-500">{t('bookingId')}: <span className="font-semibold text-sand-700">{booking._id}</span></p>
              </div>

              <div className="grid gap-px overflow-hidden rounded-soft border border-sand-200 bg-sand-200 sm:grid-cols-2">
                <SummaryTile label={t('dates')} value={`${formatDate(booking.startDate, i18n.language)} – ${formatDate(booking.endDate, i18n.language)}`} />
                <SummaryTile label={t('paymentMethod')} value={methodLabels[paymentMethod] || t('payment')} />
                <SummaryTile label={t('status')} value={booking.status || 'pending'} />
                <SummaryTile label={t('total')} value={`${Number(booking.totalPrice || 0).toLocaleString()} EGP`} />
              </div>

              {isDriverBooking && (
                <div className="rounded-soft border border-green-200 bg-green-50 px-4 py-3">
                  <p className="text-[0.75rem] font-semibold uppercase tracking-[0.04em] text-green-700">{t('driverContact')}</p>
                  <p className="mt-1 text-[0.95rem] font-semibold text-sand-950">{driverPhone || t('phoneNotAdded')}</p>
                  {driverPhone && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={`tel:${driverPhone}`} className="rounded-subtle bg-primary-800 px-3 py-2 text-[0.78rem] font-semibold text-white transition-colors hover:bg-primary-900">
                        {t('callDriver')}
                      </a>
                      {whatsappPhone && (
                        <a href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noreferrer" className="rounded-subtle border border-green-200 bg-sand-50 px-3 py-2 text-[0.78rem] font-semibold text-green-700 transition-colors hover:bg-green-50">
                          WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {booking.payment?.proofUrl && (
                <a
                  href={booking.payment.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-subtle border border-sand-200 bg-sand-100 px-3 py-2 text-[0.75rem] font-semibold text-primary-700 transition-colors hover:bg-sand-200/60"
                >
                  {t('paymentProof')}
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
              {t('backToDashboard')}
            </Link>
            <Link to="/dashboard" state={{ section: 'bookings' }} className="inline-flex justify-center rounded-subtle border border-sand-200 bg-sand-100 px-5 py-3 text-[0.85rem] font-semibold text-primary-700 transition-colors hover:bg-sand-200/60">
              {t('viewBookings')}
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
