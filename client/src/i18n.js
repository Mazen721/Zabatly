import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// EN namespaces
import enCommon from './locales/en/common.json';
import enLanding from './locales/en/landing.json';
import enAuth from './locales/en/auth.json';
import enExplore from './locales/en/explore.json';
import enVehicle from './locales/en/vehicle.json';
import enDrivers from './locales/en/drivers.json';
import enPayment from './locales/en/payment.json';
import enBooking from './locales/en/booking.json';
import enProfile from './locales/en/profile.json';
import enDashboard from './locales/en/dashboard.json';
import enAdmin from './locales/en/admin.json';
import enAddVehicle from './locales/en/addVehicle.json';
import enAi from './locales/en/ai.json';

// AR namespaces
import arCommon from './locales/ar/common.json';
import arLanding from './locales/ar/landing.json';
import arAuth from './locales/ar/auth.json';
import arExplore from './locales/ar/explore.json';
import arVehicle from './locales/ar/vehicle.json';
import arDrivers from './locales/ar/drivers.json';
import arPayment from './locales/ar/payment.json';
import arBooking from './locales/ar/booking.json';
import arProfile from './locales/ar/profile.json';
import arDashboard from './locales/ar/dashboard.json';
import arAdmin from './locales/ar/admin.json';
import arAddVehicle from './locales/ar/addVehicle.json';
import arAi from './locales/ar/ai.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        landing: enLanding,
        auth: enAuth,
        explore: enExplore,
        vehicle: enVehicle,
        drivers: enDrivers,
        payment: enPayment,
        booking: enBooking,
        profile: enProfile,
        dashboard: enDashboard,
        admin: enAdmin,
        addVehicle: enAddVehicle,
        ai: enAi,
      },
      ar: {
        common: arCommon,
        landing: arLanding,
        auth: arAuth,
        explore: arExplore,
        vehicle: arVehicle,
        drivers: arDrivers,
        payment: arPayment,
        booking: arBooking,
        profile: arProfile,
        dashboard: arDashboard,
        admin: arAdmin,
        addVehicle: arAddVehicle,
        ai: arAi,
      },
    },
    defaultNS: 'common',
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'zabatly_lang',
    },
  });

export default i18n;
