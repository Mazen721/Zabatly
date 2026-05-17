import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const ARABIC_FONT = "'Cairo', 'system-ui', sans-serif";

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/login', formData);
      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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
            Rent a car on your terms. Simple, fast, and hassle-free.
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
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-primary-800">Zabatly</span>
              <span className="text-2xl font-bold text-signal-500" style={{ fontFamily: ARABIC_FONT }}>زبطلي</span>
            </Link>
          </div>

          <h1 className="text-headline text-primary-800 mb-2">Welcome back</h1>
          <p className="text-body text-sand-500 mb-8">Sign in to continue to your account.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-subtle px-4 py-3 mb-6" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-label text-sand-700 mb-1.5">Email</label>
              <input
                ref={emailRef}
                id="login-email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-body focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-label text-sand-700 mb-1.5">Password</label>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-sand-100 border border-sand-200 text-sand-950 placeholder-sand-400 rounded-subtle px-4 py-3 text-body focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-150"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-800 text-white font-semibold py-3.5 rounded-subtle hover:bg-primary-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sand-500 text-sm">
            New here?{' '}
            <Link to="/register" className="text-primary-700 font-semibold hover:text-primary-800 transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
