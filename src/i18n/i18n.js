import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enHome from "./locales/en/layout.json";
import ruHome from "./locales/ru/layout.json";
import uzHome from "./locales/uz/layout.json";

import enDashboard from "./locales/en/dashboard.json";
import ruDashboard from "./locales/ru/dashboard.json";
import uzDashboard from "./locales/uz/dashboard.json";

import enProduct from "./locales/en/products.json";
import ruProduct from "./locales/ru/products.json";
import uzProduct from "./locales/uz/products.json";



i18n.use(initReactI18next).init({
  resources: {
    en: {
      home: enHome,
      dashboard: enDashboard,
      products: enProduct,
    },
    ru: {
      home: ruHome,
      dashboard: ruDashboard,
      products: ruProduct,
    },
    uz: {
      home: uzHome,
      dashboard: uzDashboard,
      products: uzProduct,
    },
  },
  lng: "uz", // default til
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
