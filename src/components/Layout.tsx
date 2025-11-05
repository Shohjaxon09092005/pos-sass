import React, { useState, useEffect } from "react";
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
  Zap,
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
    name: "payments",
    href: "/payments",
    icon: CreditCard,
    roles: ["owner", "admin", "manager", "cashier", "viewer"],
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

const languages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "uz", name: "Uzbek", nativeName: "O'zbekcha" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
];

const getUserDisplayName = (user: any) => {
  if (user?.name) {
    return user.name;
  }
  if (user?.first_name && user?.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  return user?.username || user?.email || "User";
};

const getUserInitial = (user: any) => {
  const displayName = getUserDisplayName(user);
  return displayName.charAt(0).toUpperCase();
};

const getUserRole = (user: any) => {
  return user?.role || user?.billing_role || "user";
};

export default function Layout() {
  const { user, logout, company } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex overflow-hidden">
      {/* Mobile sidebar */}
      <div
        className={clsx(
          "fixed inset-0 flex z-50 md:hidden transition-opacity duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div
          className={clsx(
            "fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300",
            sidebarOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={clsx(
            "relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white/95 backdrop-blur-xl border-r border-slate-200/50 shadow-2xl transform transition-transform duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/50"
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
            i18n={i18n}
          />
        </div>
      </div>

      {/* Desktop sidebar - FIXED: Butunlay yo'qolishi uchun */}
      <div
        className={clsx(
          "hidden md:flex md:flex-shrink-0 transition-all duration-300 ease-in-out",
          sidebarHidden
            ? "w-0 opacity-0 -translate-x-full"
            : "w-64 opacity-100 translate-x-0"
        )}
        style={{
          position: sidebarHidden ? "fixed" : "relative",
          left: sidebarHidden ? "-100%" : "0",
          zIndex: sidebarHidden ? -1 : 40,
        }}
      >
        <div className="flex flex-col w-64 h-full bg-white/80 backdrop-blur-xl border-r border-slate-200/50">
          <SidebarContent
            navigation={filteredNavigation}
            location={location}
            company={company}
            handleLogout={handleLogout}
            user={user}
            sidebarHidden={sidebarHidden}
            toggleSidebar={toggleSidebar}
            t={t}
            i18n={i18n}
          />
        </div>
      </div>

      {/* Main content - FIXED: Kengayishi uchun */}
      <div
        className={clsx(
          "flex-1 overflow-hidden flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          sidebarHidden ? "w-full" : "w-full md:w-[calc(100%-16rem)]"
        )}
      >
        {/* Mobile header */}
        <div className="md:hidden z-30 relative">
          <div className="flex items-center justify-between px-4 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Enterprise POS
            </h1>
            <LanguageSelectorMobile />
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 z-30 relative">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100/50 transition-all duration-200"
              onClick={toggleSidebar}
              title={sidebarHidden ? t("showSidebar") : t("hideSidebar")}
            >
              {sidebarHidden ? (
                <Eye className="h-5 w-5" />
              ) : (
                <EyeOff className="h-5 w-5" />
              )}
            </button>
            {sidebarHidden && (
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Zap className="h-6 w-6 text-blue-600" />
                  <div className="absolute inset-0 blur-lg bg-blue-400/30 -z-10"></div>
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Enterprise POS
                </span>
              </div>
            )}
          </div>

          <LanguageSelector />
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none z-10">
          <div className="py-4">
            <div
              className={clsx(
                "mx-auto transition-all duration-300 ease-in-out",
                sidebarHidden
                  ? "max-w-full px-4 sm:px-4 md:px-4 lg:px-5"
                  : "max-w-7xl px-4 sm:px-4 md:px-4"
              )}
            >
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const selectedLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      // Force a re-render by updating state
      setIsOpen(false);
    } catch (error) {
      console.error("Error changing language:", error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".language-selector")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative language-selector">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white/50 border border-slate-200/50 rounded-xl shadow-sm hover:bg-white/80 hover:shadow transition-all duration-200 backdrop-blur-sm z-40 relative"
      >
        <Globe className="h-4 w-4 text-slate-400" />
        <span>{selectedLanguage?.nativeName}</span>
        <ChevronDown
          className={clsx(
            "h-4 w-4 text-slate-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-xl shadow-xl py-1 overflow-hidden">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={clsx(
                "block w-full text-left px-4 py-2.5 text-sm transition-all duration-200 hover:bg-slate-50/50",
                i18n.language === language.code
                  ? "bg-blue-50/50 text-blue-600 font-semibold"
                  : "text-slate-700 hover:text-slate-900"
              )}
            >
              <div className="flex flex-col">
                <span className="font-medium">{language.nativeName}</span>
                <span className="text-xs text-slate-500 mt-0.5">
                  {language.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LanguageSelectorMobile() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const selectedLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      setIsOpen(false);
    } catch (error) {
      console.error("Error changing language:", error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".language-selector-mobile")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative language-selector-mobile">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-2 text-sm text-slate-700 bg-white/50 border border-slate-200 rounded-lg hover:bg-white/80 transition-all backdrop-blur-sm z-40 relative"
      >
        <Globe className="h-4 w-4" />
        <span className="text-xs font-medium">
          {selectedLanguage.code.toUpperCase()}
        </span>
        <ChevronDown
          className={clsx(
            "h-3 w-3 text-slate-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-40 origin-top-right bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl py-1">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={clsx(
                "block w-full text-left px-3 py-2.5 text-sm transition-all duration-200 hover:bg-slate-50/50",
                i18n.language === language.code
                  ? "bg-blue-50/50 text-blue-600 font-semibold"
                  : "text-slate-700 hover:text-slate-900"
              )}
            >
              <div className="flex items-center space-x-2">
                <span className="font-medium">{language.nativeName}</span>
              </div>
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
  i18n: any;
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
  i18n,
}: SidebarContentProps) {
  const displayName = getUserDisplayName(user);
  const userInitial = getUserInitial(user);
  const userRole = getUserRole(user);
  const { companies, selectedCompanyId, setSelectedCompany } = useAuth();
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  const selectedCompany =
    companies.find((c) => c.id === selectedCompanyId) || company;

  const handleCompanySelect = async (companyId: number) => {
    console.log("Selecting company:", companyId);
    await setSelectedCompany(companyId);
    setShowCompanyDropdown(false);
  };

  // Close company dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".company-selector")) {
        setShowCompanyDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col flex-grow pt-6 pb-4 overflow-y-auto">
      <div className="flex items-center justify-between flex-shrink-0 px-6 mb-8">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Zap className="h-8 w-8 text-blue-600" />   
            <div className="absolute inset-0 blur-lg bg-blue-400/30 -z-10"></div>
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Enterprise
            </span>
            <div className="text-xs font-medium text-slate-500 -mt-1">
              POS System
            </div>
          </div>
        </div>
      </div>

      {/* Company selection dropdown */}
      <div className="mx-4 mb-6 relative company-selector">
        <div
          className="px-4 py-3 text-sm bg-slate-50/50 backdrop-blur-sm rounded-xl cursor-pointer hover:bg-slate-100/50 transition-all duration-200 border border-slate-200/30"
          onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <Building className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-900 truncate font-medium">
                {selectedCompany?.title || t("selectCompany")}
              </span>
            </div>
            <ChevronDown
              className={clsx(
                "h-4 w-4 text-slate-400 transition-transform flex-shrink-0",
                showCompanyDropdown && "rotate-180"
              )}
            />
          </div>
          {selectedCompany?.address && (
            <p className="text-xs text-slate-500 mt-1 ml-6 truncate">
              {selectedCompany.address}
            </p>
          )}
        </div>

        {showCompanyDropdown && companies.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
            {companies.map((companyItem) => (
              <div
                key={companyItem.id}
                className={clsx(
                  "px-4 py-3 text-sm cursor-pointer transition-all duration-200 hover:bg-slate-50/50",
                  selectedCompanyId === companyItem.id
                    ? "bg-blue-50/50 text-blue-600 font-medium"
                    : "text-slate-700"
                )}
                onClick={() => handleCompanySelect(companyItem.id)}
              >
                <div className="font-medium">{companyItem.title}</div>
                {companyItem.address && (
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {companyItem.address}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={clsx(
                "group flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
              )}
            >
              <item.icon
                className={clsx(
                  "mr-3 h-5 w-5 transition-all",
                  isActive
                    ? "text-white"
                    : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              <span>{t(item.name)}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info and logout */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-slate-200/50 mt-4">
        <div className="flex items-center mb-3 px-2">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <span className="text-sm font-bold text-white">
                {userInitial}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-semibold text-slate-900">
              {displayName}
            </p>
            <p className="text-xs text-slate-500 capitalize">{userRole}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-xl transition-all duration-200"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span>{t("signOut")}</span>
        </button>
      </div>
    </div>
  );
}
