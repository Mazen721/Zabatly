import { useLanguage } from '../context/LanguageProvider';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const isArabic = language === 'ar';

  const toggle = () => setLanguage(isArabic ? 'en' : 'ar');

  return (
    <button
      onClick={toggle}
      className="relative flex items-center h-8 w-[52px] rounded-full border border-sand-200 bg-sand-100/60 transition-all duration-200 hover:border-sand-300 hover:bg-sand-200/70 shrink-0"
      aria-label={isArabic ? 'Switch to English' : 'التبديل للعربية'}
      title={isArabic ? 'Switch to English' : 'التبديل للعربية'}
      style={{ direction: 'ltr' }}
    >
      {/* Sliding pill — always uses LTR positioning */}
      <span
        className="absolute top-0.5 h-[26px] w-[24px] rounded-full bg-primary-800 shadow-sm transition-all duration-300 ease-out"
        style={{ left: isArabic ? 'calc(100% - 26px)' : '2px' }}
      />
      {/* EN label */}
      <span
        className={`relative z-10 flex-1 text-center text-[0.65rem] font-bold transition-colors duration-200 ${
          !isArabic ? 'text-white' : 'text-sand-500'
        }`}
      >
        EN
      </span>
      {/* ع label */}
      <span
        className={`relative z-10 flex-1 text-center text-[0.7rem] font-bold transition-colors duration-200 font-arabic ${
          isArabic ? 'text-white' : 'text-sand-500'
        }`}
      >
        ع
      </span>
    </button>
  );
}
