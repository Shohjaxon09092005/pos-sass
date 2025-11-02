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
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex overflow-hidden">
      {/* Mobile sidebar */}
      <div
        className={clsx(
          "fixed inset-0 flex z-40 md:hidden",
          sidebarOpen ? "block" : "hidden"
        )}
      >
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white/95 backdrop-blur-xl border-r border-slate-200/50 shadow-2xl">
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
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      {!sidebarHidden && (
        <div
          className={clsx(
            "hidden md:flex md:flex-shrink-0 transition-all duration-300 ease-in-out z-30",
            "w-64"
          )}
          style={{ position: 'relative' }}
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
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile header */}
        <div className="md:hidden">
          <div className="flex items-center justify-between px-4 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Enterprise POS</h1>
            <LanguageSelectorMobile />
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100/50 transition-all duration-200"
              onClick={toggleSidebar}
              title={sidebarHidden ? t('showSidebar') : t('hideSidebar')}
            >
              {sidebarHidden ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          </div>

          <LanguageSelector />
        </div>

        <main
          className={clsx(
            "flex-1 relative overflow-y-auto focus:outline-none z-10",
            typeof window !== 'undefined' && window.innerWidth >= 768 && !sidebarHidden ? "ml-1" : ""
          )}
        >
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-10">
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

  const selectedLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white/50 border border-slate-200/50 rounded-xl shadow-sm hover:bg-white/80 hover:shadow transition-all duration-200 backdrop-blur-sm"
      >
        <Globe className="h-4 w-4 text-slate-400" />
        <span>{selectedLanguage?.nativeName}</span>
        <ChevronDown className={clsx("h-4 w-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-xl shadow-xl py-1 overflow-hidden">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={clsx(
                "block w-full text-left px-4 py-2.5 text-sm transition-all",
                i18n.language === language.code
                  ? "bg-blue-50/50 text-blue-600 font-semibold"
                  : "text-slate-700 hover:bg-slate-50/50 hover:text-slate-900"
              )}
            >
              <div className="flex flex-col">
                <span>{language.nativeName}</span>
                <span className="text-xs text-slate-500">{language.name}</span>
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

  const selectedLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-2.5 py-1.5 text-sm text-slate-700 bg-white/50 border border-slate-200 rounded-lg hover:bg-white/80 transition-all backdrop-blur-sm"
      >
        <Globe className="h-4 w-4" />
        <span className="text-xs font-medium">{selectedLanguage.code.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-32 origin-top-right bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl py-1">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={clsx(
                "block w-full text-left px-3 py-2 text-sm transition-all",
                i18n.language === language.code
                  ? "bg-blue-50/50 text-blue-600 font-semibold"
                  : "text-slate-700 hover:bg-slate-50"
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

  const handleCompanySelect = async (companyId: number) => {
    console.log("Selecting company:", companyId);
    await setSelectedCompany(companyId);
    setShowCompanyDropdown(false);

    const newSelectedCompany = companies.find((c) => c.id === companyId);
    if (newSelectedCompany) {
      console.log("Successfully selected company:", newSelectedCompany.title);
    }
  };

  return (
    <div className="flex flex-col flex-grow pt-6 pb-4 overflow-y-auto">
      <div className="flex items-center justify-between flex-shrink-0 px-6 mb-8">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Zap className="h-8 w-8 text-blue-600" />
            <div className="absolute inset-0 blur-lg bg-blue-400/30 -z-10"></div>
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Enterprise</span>
            <div className="text-xs font-medium text-slate-500 -mt-1">POS System</div>
          </div>
        </div>
      </div>

      {/* Company selection dropdown */}
      <div className="mx-4 mb-6 relative">
        <div
          className="px-4 py-3 text-sm bg-slate-50/50 backdrop-blur-sm rounded-xl cursor-pointer hover:bg-slate-100/50 transition-all duration-200 border border-slate-200/30"
          onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <Building className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-900 truncate font-medium">
                {selectedCompany?.title || t('selectCompany')}
              </span>
            </div>
            <ChevronDown
              className={clsx("h-4 w-4 text-slate-400 transition-transform flex-shrink-0", showCompanyDropdown && "rotate-180")}
            />
          </div>
          {selectedCompany?.address && (
            <p className="text-xs text-slate-500 mt-1 ml-6 truncate">
              {selectedCompany.address}
            </p>
          )}
        </div>

        {showCompanyDropdown && companies.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto">
            {companies.map((companyItem) => (
              <div
                key={companyItem.id}
                className={clsx(
                  "px-4 py-3 text-sm cursor-pointer transition-all",
                  selectedCompanyId === companyItem.id
                    ? "bg-blue-50/50 text-blue-600 font-medium"
                    : "text-slate-700 hover:bg-slate-50/50"
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
            <p className="text-sm font-semibold text-slate-900">{displayName}</p>
            <p className="text-xs text-slate-500 capitalize">{userRole}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-xl transition-all duration-200"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span>{t('signOut')}</span>
        </button>
      </div>
    </div>
  );
}
