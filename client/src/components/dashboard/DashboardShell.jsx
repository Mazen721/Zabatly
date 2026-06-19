import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ARABIC_FONT = "'Cairo', 'system-ui', sans-serif";

function getProfilePictureUrl(path) {
  if (!path) return null;
  return path;
}

function ProfileAvatar({ user, size = 'sm' }) {
  const src = getProfilePictureUrl(user?.profilePicture);
  const sizeClass = size === 'md' ? 'h-10 w-10' : 'h-8 w-8';

  return (
    <span className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10 text-primary-100`}>
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="5" r="3" />
          <path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" />
        </svg>
      )}
    </span>
  );
}

const DashboardShell = ({
  navItems,
  activeSection,
  onSectionChange,
  contextStrip,
  user,
  bottomActions = [],
  returnTarget: propReturnTarget,
  onBeforeNavigate,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.language === 'ar';

  const returnTarget = propReturnTarget || { href: '/explore', label: t('nav.fleet') };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const guardedNavigate = (path, e) => {
    if (onBeforeNavigate && !onBeforeNavigate(path)) {
      if (e) e.preventDefault();
    }
  };

  const sidebar = (
    <>
      <div className="px-5 pt-6 pb-4">
        <Link to="/" className="flex items-center gap-1.5">
          <span className="text-[1.2rem] font-extrabold text-white tracking-tight">
            Zabatly
          </span>
          <span
            className="text-[1.2rem] font-bold text-signal-500"
            style={{ fontFamily: ARABIC_FONT }}
          >
            زبطلي
          </span>
        </Link>
      </div>

      <nav dir={isRTL ? 'rtl' : 'ltr'} className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) =>
          item.type === 'divider' ? (
            <div key={item.id} className="pt-4 pb-2 px-3">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-primary-400">
                {item.label}
              </span>
            </div>
          ) : item.href ? (
            <Link
              key={item.id}
              to={item.href}
              onClick={(e) => guardedNavigate(item.href, e)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-subtle text-[0.8125rem] font-medium text-primary-300 hover:text-white hover:bg-white/5 transition-colors duration-150"
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ) : (
            <button
              key={item.id}
              onClick={() => {
                onSectionChange(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-subtle text-[0.8125rem] font-medium transition-colors duration-150 ${
                activeSection === item.id
                  ? 'bg-white/12 text-white'
                  : 'text-primary-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="bg-signal-500 text-primary-950 text-[0.65rem] font-bold leading-none px-1.5 py-0.5 rounded-subtle min-w-[1.25rem] text-center">
                  {item.badge}
                </span>
              )}
            </button>
          )
        )}
      </nav>

      <div className="px-3 py-4 border-t border-white/8 space-y-0.5">
        {user && (
          <Link
            to="/profile"
            onClick={(e) => guardedNavigate('/profile', e)}
            className="mb-3 flex items-center gap-2.5 rounded-subtle px-3 py-2 text-primary-200 transition-colors duration-150 hover:bg-white/5 hover:text-white"
          >
            <ProfileAvatar user={user} />
            <span className="min-w-0">
              <span className="block truncate text-[0.8125rem] font-semibold">{user.name}</span>
              <span className="block truncate text-[0.68rem] text-primary-400">{t('nav.profileSettings', 'Profile settings')}</span>
            </span>
          </Link>
        )}
        {bottomActions.map((action) => (
          <Link
            key={action.id}
            to={action.href}
            onClick={(e) => guardedNavigate(action.href, e)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-subtle text-[0.8125rem] font-medium text-primary-300 hover:text-white hover:bg-white/5 transition-colors duration-150"
          >
            {action.icon}
            <span>{action.label}</span>
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-subtle text-[0.8125rem] font-medium text-primary-300 hover:text-red-400 transition-colors duration-150"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 14H3.333A1.333 1.333 0 0 1 2 12.667V3.333A1.333 1.333 0 0 1 3.333 2H6" />
            <path d="M10.667 11.333 14 8l-3.333-3.333" />
            <path d="M14 8H6" />
          </svg>
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-sand-50">
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex w-56 bg-primary-800 flex-col fixed inset-y-0 z-40 ${isRTL ? 'right-0' : 'left-0'}`}>
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-primary-950/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} w-56 bg-primary-800 flex flex-col z-50 lg:hidden transform transition-transform duration-200 ease-out-quart ${
          mobileOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'
        }`}
      >
        {sidebar}
      </aside>

      {/* Main content */}
      <div className={`flex-1 min-w-0 ${isRTL ? 'lg:mr-56' : 'lg:ml-56'}`}>
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-sand-50 border-b border-sand-200 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 -ml-1 text-sand-700 hover:text-primary-800 transition-colors"
            aria-label="Open navigation"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>
          <Link to="/" className="flex items-center gap-1.5">
            <span className="text-[1rem] font-extrabold text-primary-800">Zabatly</span>
            <span className="text-[1rem] font-bold text-signal-500" style={{ fontFamily: ARABIC_FONT }}>زبطلي</span>
          </Link>
          <Link to="/profile" aria-label="Open profile settings">
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-sand-200 bg-primary-50 text-primary-800">
              {getProfilePictureUrl(user?.profilePicture) ? (
                <img src={getProfilePictureUrl(user.profilePicture)} alt="" className="h-full w-full object-cover" />
              ) : (
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="5" r="3" />
                  <path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" />
                </svg>
              )}
            </span>
          </Link>
        </div>

        {/* Context strip */}
        {contextStrip && (
          <div className="bg-sand-100 border-b border-sand-200 px-6 py-2.5 text-[0.8125rem]">
            {contextStrip}
          </div>
        )}

        {/* Page content */}
        <div className="px-4 py-5 lg:px-8 lg:py-6">
          {returnTarget && (
            <Link
              to={returnTarget.href}
              onClick={(e) => guardedNavigate(returnTarget.href, e)}
              className="mb-4 inline-flex items-center gap-2 rounded-subtle border border-sand-200 bg-sand-100 px-3 py-2 text-[0.8125rem] font-semibold text-sand-700 transition-colors hover:bg-sand-200/70 hover:text-primary-800"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={isRTL ? 'scale-x-[-1]' : ''}>
                <path d="M8.5 3 4.5 7l4 4" />
                <path d="M5 7h6" />
              </svg>
              {t('nav.backTo', { target: returnTarget.label })}
            </Link>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardShell;
