import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Pages
import Landing from './pages/Landing'; 
import Home from './pages/Home';       
import Login from './pages/Login';
import Register from './pages/Register';
import Drivers from './pages/Drivers';
import AddVehicle from './pages/AddVehicle';
import Dashboard from './pages/Dashboard';
import VehicleDetails from './pages/VehicleDetails';
import Profile from './pages/Profile'; 
import AiChat from './components/AiChat'; 
import AdminDashboard from './pages/AdminDashboard';
import AIAssistant from './pages/AIAssistant';
import PaymentPage from './pages/PaymentPage';
import BookingSuccess from './pages/BookingSuccess';
import UserPublicProfile from './pages/UserPublicProfile';
import ContactUs from './pages/ContactUs';
import AboutUs from './pages/AboutUs';
import LanguageSwitcher from './components/LanguageSwitcher';

function getProfilePictureUrl(path) {
  if (!path) return null;
  return path;
}

const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('common');

  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    navigate('/login');
  };

  const dashboardTarget = user?.role === 'admin' ? '/admin' : '/dashboard';
  const dashboardState =
    location.pathname === '/explore'
      ? { from: '/explore' }
      : undefined;
  const profilePicture = getProfilePictureUrl(user?.profilePicture);

  return (
    <nav className="sticky top-0 z-50 bg-sand-50/90 backdrop-blur-md border-b border-sand-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-[1.35rem] font-extrabold text-primary-800 tracking-tight">Zabatly</span>
          <span className="text-[1.35rem] font-bold text-signal-500 font-arabic">زبطلي</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          <Link to="/explore" className="text-[0.82rem] font-medium text-sand-700 hover:text-primary-700 transition-colors">{t('nav.browseCars')}</Link>
          <Link to="/drivers" className="text-[0.82rem] font-medium text-sand-700 hover:text-primary-700 transition-colors">{t('nav.drivers')}</Link>
          <Link to="/ai-assistant" className="text-[0.82rem] font-medium text-sand-700 hover:text-primary-700 transition-colors">{t('nav.aiAssistant')}</Link>
          {user && (
            <Link
              to={dashboardTarget}
              state={dashboardState}
              className="text-[0.82rem] font-medium text-sand-700 hover:text-primary-700 transition-colors"
            >
              {user.role === 'admin' ? t('nav.adminPanel') : t('nav.dashboard')}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {user.role === 'agency' && (
                <Link to="/add-vehicle" className="hidden md:flex items-center gap-1 bg-signal-500 text-primary-950 text-[0.82rem] font-semibold px-4 py-2 rounded-subtle hover:bg-signal-600 transition-colors duration-200">
                  {t('nav.listVehicle')}
                </Link>
              )}
              <Link to="/profile" className="flex items-center gap-1.5 text-[0.82rem] font-medium text-sand-700 hover:text-primary-700 transition-colors" aria-label="Open profile settings">
                <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-sand-200 bg-sand-100 text-primary-800">
                  {profilePicture ? (
                    <img src={profilePicture} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="8" cy="5" r="3" />
                      <path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" />
                    </svg>
                  )}
                </span>
                {user.name}
              </Link>
              <button
                onClick={handleLogout}
                className="text-[0.82rem] font-medium text-sand-500 hover:text-red-600 transition-colors"
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <Link to="/login" className="flex items-center gap-1.5 bg-primary-800 text-white text-[0.82rem] font-semibold px-4 py-2 rounded-subtle hover:bg-primary-900 transition-colors duration-200">
              {t('nav.login')}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="5" r="3" /><path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" /></svg>
            </Link>
          )}
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
};

function AppShell() {
  const location = useLocation();
  const { t } = useTranslation('common');
  const isLanding = location.pathname === '/';
  const isAuth = location.pathname === '/login' || location.pathname === '/register';
  const isDashboard = ['/dashboard', '/admin', '/profile', '/add-vehicle'].includes(location.pathname);
  const isStaticPage = ['/contact', '/about'].includes(location.pathname);
  const hideChrome = isLanding || isAuth || isDashboard || isStaticPage;
  const hideFloatingChat = hideChrome || location.pathname === '/ai-assistant';

  return (
    <div className="min-h-screen flex flex-col bg-sand-50 font-sans antialiased text-sand-950">
      {!hideChrome && <Navbar />}

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/explore" element={<Home />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-vehicle" element={<AddVehicle />} />
          <Route path="/admin" element={<AdminDashboard />} />

          <Route path="/verify-identity" element={<Navigate to="/profile" replace />} />

          <Route path="/vehicles/:id" element={<VehicleDetails />} />
          <Route path="/vehicle/:id" element={<VehicleDetails />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/booking-success" element={<BookingSuccess />} />

          <Route path="/profile" element={<Profile />} />
          <Route path="/user/:id" element={<UserPublicProfile />} />

          <Route path="*" element={
            <div className="text-center mt-32 p-10 bg-sand-50 max-w-lg mx-auto rounded-soft border border-sand-200">
              <h2 className="text-3xl font-bold mb-4 text-sand-950">{t('notFound.title')}</h2>
              <p className="text-sand-500 mb-8 leading-relaxed">{t('notFound.message')}</p>
              <Link to="/" className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-subtle font-semibold hover:bg-primary-700 transition-colors">{t('notFound.backHome')}</Link>
            </div>
          } />
        </Routes>
      </main>

      {!hideFloatingChat && <AiChat />}

    </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
