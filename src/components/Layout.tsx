import React, { useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  ChevronDown,
} from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
    roles: ['owner', 'admin', 'manager', 'analyst'],
  },
  {
    name: 'POS Terminal',
    href: '/pos',
    icon: Calculator,
    roles: ['owner', 'admin', 'manager', 'cashier'],
  },
  {
    name: 'Products',
    href: '/products',
    icon: Package,
    roles: ['owner', 'admin', 'manager'],
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: Package,
    roles: ['owner', 'admin', 'manager'],
  },
  {
    name: 'Sales',
    href: '/sales',
    icon: ShoppingCart,
    roles: ['owner', 'admin', 'manager', 'analyst'],
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: Users,
    roles: ['owner', 'admin', 'manager'],
  },
  {
    name: 'Purchases',
    href: '/purchases',
    icon: Truck,
    roles: ['owner', 'admin', 'manager', 'purchaser'],
  },
  {
    name: 'Employees',
    href: '/employees',
    icon: UserCheck,
    roles: ['owner', 'admin', 'manager'],
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: PieChart,
    roles: ['owner', 'admin', 'manager', 'analyst'],
  },
  {
    name: 'Billing',
    href: '/billing',
    icon: CreditCard,
    roles: ['owner', 'admin'],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['owner', 'admin', 'manager'],
  },
];

export default function Layout() {
  const { user, logout, branches, currentBranch, switchBranch } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const filteredNavigation = navigation.filter(item =>
    item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile sidebar */}
      <div className={clsx(
        'fixed inset-0 flex z-40 md:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
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
            currentBranch={currentBranch}
            branches={branches}
            branchDropdownOpen={branchDropdownOpen}
            setBranchDropdownOpen={setBranchDropdownOpen}
            switchBranch={switchBranch}
            handleLogout={handleLogout}
            user={user}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent 
            navigation={filteredNavigation} 
            location={location}
            currentBranch={currentBranch}
            branches={branches}
            branchDropdownOpen={branchDropdownOpen}
            setBranchDropdownOpen={setBranchDropdownOpen}
            switchBranch={switchBranch}
            handleLogout={handleLogout}
            user={user}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">
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
            <div className="w-6" />
          </div>
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

interface SidebarContentProps {
  navigation: typeof navigation;
  location: ReturnType<typeof useLocation>;
  currentBranch: any;
  branches: any[];
  branchDropdownOpen: boolean;
  setBranchDropdownOpen: (open: boolean) => void;
  switchBranch: (branchId: string) => void;
  handleLogout: () => void;
  user: any;
}

function SidebarContent({ 
  navigation, 
  location, 
  currentBranch,
  branches,
  branchDropdownOpen,
  setBranchDropdownOpen,
  switchBranch,
  handleLogout,
  user 
}: SidebarContentProps) {
  return (
    <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
      <div className="flex items-center flex-shrink-0 px-4">
        <Store className="h-8 w-8 text-blue-600" />
        <span className="ml-2 text-xl font-bold text-gray-900">POS Demo</span>
      </div>

      {/* Branch selector */}
      <div className="mt-5 px-3">
        <div className="relative">
          <button
            onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center">
              <Store className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-900 truncate">{currentBranch?.name}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
          
          {branchDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => {
                    switchBranch(branch.id);
                    setBranchDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-md last:rounded-b-md"
                >
                  {branch.name}
                </button>
              ))}
            </div>
          )}
        </div>
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
                  ? 'bg-blue-50 border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                'group flex items-center pl-3 pr-2 py-2 border-l-4 text-sm font-medium transition-colors'
              )}
            >
              <item.icon
                className={clsx(
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
                  'mr-3 h-5 w-5 transition-colors'
                )}
              />
              {item.name}
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
                {user.name.charAt(0)}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-3 w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}