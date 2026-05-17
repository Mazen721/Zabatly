import { useState } from 'react';

const API = 'http://localhost:5000';

export default function PaymentProofLink({ path }) {
  const [open, setOpen] = useState(false);
  if (!path) return null;

  const src = path.startsWith('http') ? path : `${API}${path}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-subtle border border-sand-200 bg-sand-100 px-2.5 py-1.5 text-[0.72rem] font-semibold text-primary-700 transition-colors duration-150 hover:bg-sand-200/60"
      >
        Payment Proof
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h7v7" />
          <path d="M13 3 5 11" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-primary-950/60 px-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="max-h-[88vh] w-full max-w-2xl rounded-soft border border-sand-200 bg-sand-50 p-3 shadow-lg" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[0.875rem] font-semibold text-sand-950">Payment Proof</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-subtle text-sand-500 transition-colors hover:bg-sand-100 hover:text-sand-900"
                aria-label="Close payment proof"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
            <img src={src} alt="Payment proof" className="max-h-[72vh] w-full rounded-subtle object-contain" />
          </div>
        </div>
      )}
    </>
  );
}
