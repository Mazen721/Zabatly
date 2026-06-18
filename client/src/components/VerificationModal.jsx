import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * VerificationModal – reusable overlay that nudges users to verify their account.
 *
 * Props:
 *   open        – boolean – controls visibility
 *   onClose     – fn     – called when user clicks "Skip for now" (optional – hidden when absent)
 *   role        – string – 'user' | 'agency' | 'driver' – adjusts the message
 *   variant     – string – 'prompt' (after register, has Skip) | 'required' (must verify, no skip)
 */
export default function VerificationModal({ open, onClose, role = 'user', variant = 'prompt' }) {
  const navigate = useNavigate();

  // Lock body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const isRequired = variant === 'required';

  const roleMessages = {
    user: 'Verify your account so you can rent cars and enjoy the full Zabatly experience.',
    agency: 'Verify your account so you can list your vehicles and start earning.',
    driver: 'Verify your account so you can accept ride requests and start driving.',
  };

  const roleMessagesAr = {
    user: 'قم بتوثيق حسابك حتى تتمكن من استئجار السيارات والاستمتاع بتجربة زبطلي الكاملة.',
    agency: 'قم بتوثيق حسابك حتى تتمكن من إدراج سياراتك والبدء في الكسب.',
    driver: 'قم بتوثيق حسابك حتى تتمكن من قبول طلبات الرحلات والبدء في القيادة.',
  };

  const requiredMessage = 'You must verify your account before you can proceed. Please complete your identity verification.';
  const requiredMessageAr = 'يجب عليك توثيق حسابك قبل المتابعة. يرجى إكمال التحقق من الهوية.';

  // Detect language from <html dir> or localStorage
  const isAr = document.documentElement.dir === 'rtl' || document.documentElement.lang === 'ar';

  const title = isRequired
    ? (isAr ? 'التوثيق مطلوب' : 'Verification Required')
    : (isAr ? 'وثّق حسابك' : 'Verify Your Account');

  const message = isRequired
    ? (isAr ? requiredMessageAr : requiredMessage)
    : (isAr ? (roleMessagesAr[role] || roleMessagesAr.user) : (roleMessages[role] || roleMessages.user));

  const goLabel = isAr ? 'توثيق الآن' : 'Verify Now';
  const skipLabel = isAr ? 'تخطي الآن' : 'Skip for now';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden animate-[modalIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-primary-600 via-signal-500 to-primary-800" />

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rtl:left-4 rtl:right-auto text-sand-400 hover:text-sand-600 transition-colors z-10 p-1.5 rounded-full hover:bg-sand-100"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div className="px-6 pt-7 pb-6 text-center">
          {/* Icon */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-signal-50 border-2 border-signal-200">
            {isRequired ? (
              <svg className="h-8 w-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4" /><path d="M12 17h.01" />
                <path d="M5.07 19H19a2 2 0 0 0 1.75-2.75L13.75 4a2 2 0 0 0-3.5 0L3.32 16.25A2 2 0 0 0 5.07 19z" />
              </svg>
            ) : (
              <svg className="h-8 w-8 text-signal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            )}
          </div>

          <h2 className="text-xl font-bold text-primary-800 mb-2">{title}</h2>
          <p className="text-[0.9rem] leading-relaxed text-sand-600 mb-7">{message}</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/profile?section=verification')}
              className="w-full bg-primary-800 text-white py-3 rounded-subtle text-[0.9rem] font-semibold hover:bg-primary-900 transition-all duration-150 active:scale-[0.98]"
            >
              {goLabel}
            </button>

            {!isRequired && onClose && (
              <button
                onClick={onClose}
                className="w-full bg-sand-100 text-sand-600 py-3 rounded-subtle text-[0.9rem] font-medium hover:bg-sand-200 transition-colors duration-150"
              >
                {skipLabel}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
