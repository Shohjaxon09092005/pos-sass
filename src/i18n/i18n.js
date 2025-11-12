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

import enCategory from "./locales/en/categories.json";
import ruCategory from "./locales/ru/categories.json";
import uzCategory from "./locales/uz/categories.json";

import enInventory from "./locales/en/inventory.json";
import ruInventory from "./locales/ru/inventory.json";
import uzInventory from "./locales/uz/inventory.json";

import enSales from "./locales/en/sales.json";
import ruSales from "./locales/ru/sales.json";
import uzSales from "./locales/uz/sales.json";

import enPayment from "./locales/en/payment.json";
import ruPayment from "./locales/ru/payment.json";
import uzPayment from "./locales/uz/payment.json";

import enCustomers from "./locales/en/customers.json";
import ruCustomers from "./locales/ru/customers.json";
import uzCustomers from "./locales/uz/customers.json";

import enPurchase from "./locales/en/purchase.json";
import ruPurchase from "./locales/ru/purchase.json";
import uzPurchase from "./locales/uz/purchase.json";

import enEmployees from "./locales/en/employees.json";
import ruEmployees from "./locales/ru/employees.json";
import uzEmployees from "./locales/uz/employees.json";

import enBilling from "./locales/en/billing.json";
import ruBilling from "./locales/ru/billing.json";
import uzBilling from "./locales/uz/billing.json";

import enSettings from "./locales/en/settings.json";
import ruSettings from "./locales/ru/settings.json";
import uzSettings from "./locales/uz/settings.json";

import enNotFound from "./locales/en/notFound.json";
import ruNotFound from "./locales/ru/notFound.json";
import uzNotFound from "./locales/uz/notFound.json";



i18n.use(initReactI18next).init({
  resources: {
    en: {
      home: enHome,
      dashboard: enDashboard,
      products: enProduct,
      categories: enCategory,
      inventory: enInventory,
      sales: enSales,
      payment: enPayment,
      customers: enCustomers,
      purchase: enPurchase,
      employees: enEmployees,
      billing: enBilling,
      settings: enSettings,
      notFound: enNotFound
    },
    ru: {
      home: ruHome,
      dashboard: ruDashboard,
      products: ruProduct,
      categories: ruCategory,
      inventory: ruInventory,
      sales: ruSales,
      payment: ruPayment,
      customers: ruCustomers,
      purchase: ruPurchase,
      employees: ruEmployees,
      billing: ruBilling,
      settings: ruSettings,
      notFound: ruNotFound
    },
    uz: {
      home: uzHome,
      dashboard: uzDashboard,
      products: uzProduct,
      categories: uzCategory,
      inventory: uzInventory,
      sales: uzSales,
      payment: uzPayment,
      customers: uzCustomers,
      purchase: uzPurchase,
      employees: uzEmployees,
      billing: uzBilling,
      settings: uzSettings,
      notFound: uzNotFound
    },
  },
  lng: "uz", // default til
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
