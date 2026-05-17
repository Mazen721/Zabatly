import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import RenterDashboard from '../components/dashboard/RenterDashboard';
import OwnerDashboard from '../components/dashboard/OwnerDashboard';
import DriverDashboard from '../components/dashboard/DriverDashboard';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const returnTarget = {
    href: location.state?.from || '/explore',
    label: location.state?.label || 'Fleet',
  };
  const initialSection = location.state?.section;

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (!stored) {
      navigate('/login');
      return;
    }
    const parsed = JSON.parse(stored);
    if (parsed.role === 'admin') {
      navigate('/admin');
      return;
    }
    setUser(parsed);
  }, [navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-50">
        <div className="animate-pulse space-y-3 text-center">
          <div className="h-4 w-32 bg-sand-200 rounded mx-auto" />
          <div className="h-3 w-20 bg-sand-100 rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (user.role === 'agency') return <OwnerDashboard user={user} returnTarget={returnTarget} />;
  if (user.role === 'driver') return <DriverDashboard user={user} returnTarget={returnTarget} />;
  return <RenterDashboard user={user} returnTarget={returnTarget} initialSection={initialSection} />;
}
