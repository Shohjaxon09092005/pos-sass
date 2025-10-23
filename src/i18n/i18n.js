import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enHome from "./locales/en/dashboard.json";
import ruHome from "./locales/ru/dashboard.json";
import uzHome from "./locales/uz/dashboard.json";



i18n.use(initReactI18next).init({
  resources: {
    en: {
      home: enHome,
    },
    ru: {
      home: ruHome,
    },
    uz: {
      home: uzHome,
    },
  },
  lng: "uz", // default til
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
