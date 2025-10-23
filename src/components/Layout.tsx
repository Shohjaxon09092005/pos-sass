// components/Layout.tsx
import React, { useState } from "react";
import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  CreditCard,
  UserCheck,
  Truck,
  PieChart,
  Calculator,
  Folder,
  ChevronDown,
  Building,
  Globe,
  Eye,
  EyeOff,
} from "lucide-react";
import { clsx } from "clsx";

// Navigation items with translation keys
const navigation = [
  {
    name: "dashboard",
    href: "/dashboard",
    icon: BarChart3,
    roles: ["owner", "admin", "manager", "analyst"],
  },
  {
    name: "posTerminal",
    href: "/pos",
    icon: Calculator,
    roles: ["owner", "admin", "manager", "cashier", "viewer"],
  },
  {
    name: "products",
    href: "/products",
    icon: Package,
    roles: ["owner", "admin", "manager", "viewer"],
  },
  {
    name: "categories",
    href: "/categories",
    icon: Folder,
    roles: ["owner", "admin", "manager", "viewer"],
  },
  {
    name: "inventory",
    href: "/inventory",
    icon: Package,
    roles: ["owner", "admin", "manager", "viewer"],
  },
  {
    name: "sales",
    href: "/sales",
    icon: ShoppingCart,
    roles: ["owner", "admin", "manager", "analyst", "viewer"],
  },
  {
    name: "customers",
    href: "/customers",
    icon: Users,
    roles: ["owner", "admin", "manager", "viewer"],
  },
  {
    name: "purchases",
    href: "/purchases",
    icon: Truck,
    roles: ["owner", "admin", "manager", "purchaser", "viewer"],
  },
  {
    name: "employees",
    href: "/employees",
    icon: UserCheck,
    roles: ["owner", "admin", "manager", "viewer"],
  },
  {
    name: "reports",
    href: "/reports",
    icon: PieChart,
    roles: ["owner", "admin", "manager", "analyst", "viewer"],
  },
  {
    name: "billing",
    href: "/billing",
    icon: CreditCard,
    roles: ["owner", "admin", "viewer"],
  },
  {
    name: "settings",
    href: "/settings",
    icon: Settings,
    roles: ["owner", "admin", "manager", "viewer"],
  },
];

// Language options
const languages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "uz", name: "Uzbek", nativeName: "O'zbekcha" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
];

// User display name ni olish uchun helper function
const getUserDisplayName = (user: any) => {
  if (user?.name) {
    return user.name;
  }
  if (user?.first_name && user?.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  return user?.username || user?.email || "User";
};

// User initial ni olish uchun helper function
const getUserInitial = (user: any) => {
  const displayName = getUserDisplayName(user);
  return displayName.charAt(0).toUpperCase();
};

// User role ni olish uchun helper function
const getUserRole = (user: any) => {
  return user?.role || user?.billing_role || "user";
};

export default function Layout() {
  const { user, logout, company } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = getUserRole(user);
  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(userRole)
  );

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setSidebarHidden(!sidebarHidden);
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile sidebar */}
      <div
        className={clsx(
          "fixed inset-0 flex z-40 md:hidden",
          sidebarOpen ? "block" : "hidden"
        )}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent
            navigation={filteredNavigation}
            location={location}
            company={company}
            handleLogout={handleLogout}
            user={user}
            sidebarHidden={sidebarHidden}
            toggleSidebar={toggleSidebar}
            t={t}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className={clsx(
          "hidden md:flex md:flex-shrink-0 transition-all duration-300 ease-in-out",
          sidebarHidden ? "w-0" : "w-64"
        )}
      >
        <div className="flex flex-col w-64">
          <SidebarContent
            navigation={filteredNavigation}
            location={location}
            company={company}
            handleLogout={handleLogout}
            user={user}
            sidebarHidden={sidebarHidden}
            toggleSidebar={toggleSidebar}
            t={t}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile header */}
        <div className="md:hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm border-b border-gray-200">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">POS System</h1>
            <LanguageSelectorMobile />
          </div>
        </div>

        {/* Desktop header with sidebar toggle */}
        <div className="hidden md:flex items-center justify-between px-6 py-3 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600 p-2 rounded-md transition-colors"
              onClick={toggleSidebar}
              title={sidebarHidden ? t('showSidebar') : t('hideSidebar')}
            >
              {sidebarHidden ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
            <span className="ml-2 text-sm text-gray-600">
              {sidebarHidden ? t('sidebarHidden') : t('sidebarVisible')}
            </span>
          </div>
          
          {/* Language selector for desktop */}
          <LanguageSelector />
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Language Selector Component for Desktop
function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const selectedLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Globe className="h-4 w-4 text-gray-400" />
        <span>{selectedLanguage?.nativeName}</span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg py-1">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={clsx(
                "block w-full text-left px-4 py-2 text-sm transition-colors",
                i18n.language === language.code
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <div className="flex flex-col">
                <span>{language.nativeName}</span>
                <span className="text-xs text-gray-500">{language.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Language Selector Component for Mobile
function LanguageSelectorMobile() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const selectedLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        <Globe className="h-4 w-4" />
        <span className="text-xs">{selectedLanguage.code.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-32 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg py-1">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={clsx(
                "block w-full text-left px-3 py-2 text-sm transition-colors",
                i18n.language === language.code
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              {language.nativeName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface SidebarContentProps {
  navigation: typeof navigation;
  location: ReturnType<typeof useLocation>;
  company: any;
  handleLogout: () => void;
  user: any;
  sidebarHidden: boolean;
  toggleSidebar: () => void;
  t: (key: string) => string;
}

function SidebarContent({
  navigation,
  location,
  company,
  handleLogout,
  user,
  sidebarHidden,
  toggleSidebar,
  t,
}: SidebarContentProps) {
  const displayName = getUserDisplayName(user);
  const userInitial = getUserInitial(user);
  const userRole = getUserRole(user);
  const { companies, selectedCompanyId, setSelectedCompany } = useAuth();
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  const selectedCompany =
    companies.find((c) => c.id === selectedCompanyId) || company;

  // Kompaniya tanlash funksiyasi
  const handleCompanySelect = async (companyId: number) => {
    console.log("Selecting company:", companyId);
    await setSelectedCompany(companyId);
    setShowCompanyDropdown(false);

    // Yangilangan kompaniya ma'lumotlarini ko'rsatish
    const newSelectedCompany = companies.find((c) => c.id === companyId);
    if (newSelectedCompany) {
      console.log("Successfully selected company:", newSelectedCompany.title);
    }
  };

  return (
    <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
      <div className="flex items-center justify-between flex-shrink-0 px-4">
        <div className="flex items-center">
          <Store className="h-8 w-8 text-blue-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">POS Demo</span>
        </div>
        <button
          type="button"
          className="md:hidden text-gray-500 hover:text-gray-600 p-1 rounded-md transition-colors"
          onClick={toggleSidebar}
          title={sidebarHidden ? t('showSidebar') : t('hideSidebar')}
        >
          {sidebarHidden ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </button>
      </div>
      
      {/* Company selection dropdown */}
      <div className="mt-5 px-3 relative">
        <div
          className="px-3 py-2 text-sm bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Building className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-900 truncate font-medium">
                {selectedCompany?.title || t('selectCompany')}
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${
                showCompanyDropdown ? "rotate-180" : ""
              }`}
            />
          </div>
          {selectedCompany?.address && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              {selectedCompany.address}
            </p>
          )}
        </div>

        {/* Company dropdown menu */}
        {showCompanyDropdown && companies.length > 0 && (
          <div className="absolute top-full left-3 right-3 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
            {companies.map((companyItem) => (
              <div
                key={companyItem.id}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                  selectedCompanyId === companyItem.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => handleCompanySelect(companyItem.id)}
              >
                <div className="font-medium">{companyItem.title}</div>
                {companyItem.address && (
                  <div className="text-xs text-gray-500 truncate">
                    {companyItem.address}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={clsx(
                isActive
                  ? "bg-blue-50 border-blue-600 text-blue-700"
                  : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                "group flex items-center pl-3 pr-2 py-2 border-l-4 text-sm font-medium transition-colors"
              )}
            >
              <item.icon
                className={clsx(
                  isActive
                    ? "text-blue-500"
                    : "text-gray-400 group-hover:text-gray-500",
                  "mr-3 h-5 w-5 transition-colors"
                )}
              />
              {t(item.name)}
            </Link>
          );
        })}
      </nav>

      {/* User info and logout */}
      <div className="flex-shrink-0 px-2 py-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {userInitial}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{displayName}</p>
            <p className="text-xs text-gray-500 capitalize">{userRole}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-3 w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4" />
          {t('signOut')}
        </button>
      </div>
    </div>
  );
}