import { ChatWindow } from '../components/AiChat';
import { useTranslation } from 'react-i18next';

export default function AIAssistant() {
  const { t } = useTranslation('ai');
  return (
    <div className="min-h-screen bg-sand-50">
      <div className="mx-auto max-w-[1100px] px-6 py-8 lg:px-10">
        <header className="mb-5 flex flex-col gap-2 border-b border-sand-200 pb-5">
          <p className="text-[0.75rem] font-semibold uppercase tracking-wide text-signal-700">
            {t('smartMatching')}
          </p>
          <h1 className="text-[1.65rem] font-bold leading-tight text-sand-950">
            {t('pageTitle')}
          </h1>
          <p className="max-w-[65ch] text-[0.92rem] leading-6 text-sand-600">
            {t('pageDescription')}
          </p>
        </header>

        <ChatWindow isFullPage />
      </div>
    </div>
  );
}
