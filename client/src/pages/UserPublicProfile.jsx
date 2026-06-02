import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config/api';
import { useTranslation } from 'react-i18next';

function StarRating({ rating, count }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-signal-500' : 'text-sand-300'}`} viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {count !== undefined && <span className="text-[0.75rem] text-sand-500">({count})</span>}
    </div>
  );
}

const getImg = (v) =>
  v?.images?.length > 0
    ? v.images[0]
    : 'https://placehold.co/320x220/f2efea/a49888?text=No+Photo';

export default function UserPublicProfile() {
  const { id } = useParams();
  const { t, i18n } = useTranslation('profile');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isRTL = i18n.language === 'ar';
  const locale = isRTL ? 'ar-EG' : 'en-GB';

  useEffect(() => {
    window.scrollTo(0, 0);
    (async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
        const config = userInfo?.token
          ? { headers: { Authorization: `Bearer ${userInfo.token}` } }
          : undefined;
        const { data } = await axios.get(`${API}/api/users/${id}/public`, config);
        setProfile(data);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-50">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 pt-10">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-sand-200" />
              <div className="space-y-2">
                <div className="h-5 w-40 bg-sand-200 rounded" />
                <div className="h-3 w-24 bg-sand-100 rounded" />
              </div>
            </div>
            <div className="h-24 bg-sand-200 rounded-soft" />
            <div className="h-40 bg-sand-200 rounded-soft" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[0.95rem] font-semibold text-sand-700 mb-2">{t('userNotFound')}</p>
          <Link to="/explore" className="text-primary-700 font-semibold hover:text-primary-800 text-[0.8rem]">{t('backToFleet')}</Link>
        </div>
      </div>
    );
  }

  const joinDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
    : '';

  const roleLabel = profile.role === 'agency' ? t('vehicleOwner') : profile.role === 'driver' ? t('freelanceDriver') : t('renter');
  const isRenter = profile.role === 'user';
  const hasSensitiveDetails = Boolean(profile.dateOfBirth || profile.phone || profile.emergencyContact?.phone);
  const birthDate = profile.dateOfBirth
    ? new Date(profile.dateOfBirth).toLocaleDateString(locale, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="max-w-3xl mx-auto px-6 lg:px-10 pt-6 pb-16">
        {/* Back */}
        <button onClick={() => window.history.back()} className="inline-flex items-center gap-1 text-[0.8rem] text-sand-500 font-medium hover:text-primary-700 transition-colors mb-6">
          <svg className={`w-4 h-4 ${isRTL ? 'scale-x-[-1]' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 3L5 8l5 5" /></svg>
          {t('back')}
        </button>

        {/* Profile header */}
        <div className="flex items-center gap-5 mb-6">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-sand-200 shrink-0 border-2 border-sand-200">
            {profile.profilePicture ? (
              <img src={profile.profilePicture} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sand-500 font-bold text-2xl bg-primary-50 text-primary-700">
                {profile.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-[1.5rem] font-bold text-sand-950">{profile.name}</h1>
              {profile.is_verified && (
                <span className="text-[0.65rem] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">{t('verified')}</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[0.8rem] text-sand-500">
              <span className="inline-block px-2 py-0.5 rounded-subtle text-[0.7rem] font-semibold uppercase bg-primary-50 text-primary-700 border border-primary-200">
                {roleLabel}
              </span>
              {profile.city || profile.currentLocation ? (
                <span>{profile.city || profile.currentLocation}</span>
              ) : null}
            </div>
            {!isRenter && profile.rating > 0 && (
              <div className="mt-2">
                <StarRating rating={profile.rating} count={profile.numReviews} />
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200 mb-8">
          {!isRenter && (
            <>
              <div className="flex-1 bg-sand-50 px-4 py-3.5">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 mb-0.5">{t('rating')}</p>
                <p className="text-[1.35rem] font-bold text-sand-900 tabular-nums">{profile.rating || t('new')}</p>
              </div>
              <div className="flex-1 bg-sand-50 px-4 py-3.5">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 mb-0.5">{t('reviews')}</p>
                <p className="text-[1.35rem] font-bold text-sand-900 tabular-nums">{profile.numReviews || 0}</p>
              </div>
            </>
          )}
          <div className="flex-1 bg-sand-50 px-4 py-3.5">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 mb-0.5">{isRenter ? t('totalTrips') : t('totalRentals')}</p>
            <p className="text-[1.35rem] font-bold text-sand-900 tabular-nums">{profile.totalRentals || 0}</p>
          </div>
          {profile.vehicles?.length > 0 && (
            <div className="flex-1 bg-sand-50 px-4 py-3.5">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 mb-0.5">{t('listedCars')}</p>
              <p className="text-[1.35rem] font-bold text-green-700 tabular-nums">{profile.vehicles.length}</p>
            </div>
          )}
        </div>

        {/* Member since */}
        {joinDate && (
          <div className="mb-8 flex items-center gap-2 text-[0.8rem] text-sand-500">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2.5" y="3" width="11" height="10.5" rx="1.5" />
              <path d="M5 1.8v2.4M11 1.8v2.4M2.5 6h11" />
            </svg>
            {t('memberSince', { date: joinDate })}
          </div>
        )}

        {/* Shared booking details */}
        {hasSensitiveDetails && (
          <div className="mb-8 border border-sand-200 rounded-soft bg-sand-50 overflow-hidden">
            <div className="grid gap-px bg-sand-200 sm:grid-cols-3">
              {birthDate && (
                <div className="bg-sand-50 px-4 py-3.5">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 mb-0.5">{t('dateOfBirthLabel')}</p>
                  <p className="text-[0.875rem] font-semibold text-sand-900">{birthDate}</p>
                </div>
              )}
              {profile.phone && (
                <div className="bg-sand-50 px-4 py-3.5">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 mb-0.5">{t('phoneLabel')}</p>
                  <p className="text-[0.875rem] font-semibold text-sand-900 tabular-nums">{profile.phone}</p>
                </div>
              )}
              {profile.emergencyContact?.phone && (
                <div className="bg-sand-50 px-4 py-3.5">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 mb-0.5">{t('emergencyLabel')}</p>
                  <p className="text-[0.875rem] font-semibold text-sand-900">
                    {profile.emergencyContact.name || t('emergencyContactFallback')}
                  </p>
                  <p className="text-[0.78rem] text-sand-500 tabular-nums">
                    {profile.emergencyContact.phone}
                    {profile.emergencyContact.relation ? ` / ${profile.emergencyContact.relation}` : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Listed vehicles */}
        {profile.vehicles?.length > 0 && (
          <div>
            <h2 className="text-[1.1rem] font-semibold text-sand-950 mb-4">
              {t('listedVehicles')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {profile.vehicles.map((v) => (
                <Link
                  key={v._id}
                  to={`/vehicles/${v._id}`}
                  className="group rounded-soft border border-sand-200 bg-sand-50 overflow-hidden hover:border-primary-300 hover:shadow-sm transition-all duration-200"
                >
                  <div className="aspect-[16/10] bg-sand-100 overflow-hidden">
                    <img
                      src={getImg(v)}
                      alt={`${v.make} ${v.model}`}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3.5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-[0.9rem] font-semibold text-sand-950">{v.make} {v.model}</h3>
                      <span className={`shrink-0 inline-block px-2 py-0.5 rounded-subtle text-[0.65rem] font-semibold ${v.isAvailable !== false ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-sand-100 text-sand-500 border border-sand-200'}`}>
                        {v.isAvailable !== false ? t('available') : t('rented')}
                      </span>
                    </div>
                    <p className="text-[0.78rem] text-sand-500">{v.year} &middot; {v.type}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[0.85rem] font-bold text-primary-800">{v.price_per_day} EGP<span className="text-sand-500 font-normal text-[0.75rem]"> {t('perDay')}</span></span>
                      {v.rating > 0 && <StarRating rating={v.rating} count={v.numReviews} />}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No vehicles */}
        {(!profile.vehicles || profile.vehicles.length === 0) && profile.role === 'agency' && (
          <div className="border border-sand-200 rounded-soft py-10 text-center text-[0.85rem] text-sand-500">
            {t('noVehiclesYet')}
          </div>
        )}
      </div>
    </div>
  );
}
