import { useNavigate } from 'react-router-dom';

/**
 * Full-page "Account Created" screen shown after registration.
 * Encourages the user to verify their account, with a Skip option.
 * Reads `role` from the freshly-stored userInfo in localStorage.
 */
export default function AccountCreated() {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const role = userInfo.role || 'user';

  const roleMessages = {
    user: 'Verify your identity so you can rent cars and enjoy the full Zabatly experience.',
    agency: 'Verify your identity so you can list your vehicles and start earning.',
    driver: 'Verify your identity so you can accept ride requests and start driving.',
  };

  return (
    <main className="min-h-screen bg-sand-50 flex items-center justify-center px-5 py-14">
      <div className="w-full max-w-md text-center">
        {/* Success checkmark */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 border-2 border-green-200">
          <svg className="h-10 w-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        {/* Logo */}
        <div className="mb-2 flex items-center justify-center gap-2">
          <span className="text-2xl font-extrabold tracking-tight text-primary-800">Zabatly</span>
          <span className="text-2xl font-bold text-signal-500 font-arabic">زبطلي</span>
        </div>

        <h1 className="text-[1.6rem] font-bold text-primary-800 mb-3">
          Account Created Successfully!
        </h1>

        <p className="text-[0.95rem] leading-relaxed text-sand-600 mb-8 max-w-sm mx-auto">
          {roleMessages[role] || roleMessages.user}
        </p>

        {/* Verify CTA */}
        <button
          onClick={() => navigate('/profile?section=verification')}
          className="w-full bg-primary-800 text-white py-3.5 rounded-subtle text-[0.95rem] font-semibold hover:bg-primary-900 transition-all duration-150 active:scale-[0.98] mb-3"
        >
          Verify My Account
        </button>

        {/* Skip */}
        <button
          onClick={() => navigate('/')}
          className="w-full bg-sand-100 text-sand-600 py-3 rounded-subtle text-[0.9rem] font-medium hover:bg-sand-200 transition-colors duration-150"
        >
          Skip for now
        </button>

        <p className="mt-6 text-[0.78rem] text-sand-400 leading-relaxed">
          You can verify your account anytime from your profile settings.
        </p>
      </div>
    </main>
  );
}
