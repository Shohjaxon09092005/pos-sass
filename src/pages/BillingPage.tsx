import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Check, Star, ArrowRight, Download, Plus, Search, Filter, Trash2, Edit, FileText, DollarSign, Users, BarChart3, Building, Monitor, User } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL;

// Types
interface Invoice {
  id: string;
  title: string;
  customer_name: string;
  amount_total: string;
  amount_paid: string;
  status: string;
  payments: Payment[];
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: string;
  invoice: string;
  amount: string;
  method: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface BillingPlan {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  currency: {
    id: string;
    title: string;
    symbol: string;
    created_at: string;
    updated_at: string;
    description: string;
  };
  seats_included: number;
  price_yearly: string;
  price_monthly: string;
}

interface Subscription {
  id: number;
  plan: string;
  start_date: string;
  end_date: string;
  status: string;
  seats: number;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

// Company tipini kengaytiramiz
interface CompanyWithCounts {
  id: string;
  name: string;
  // Boshqa mavjud propertylar...
  branches_count?: number;
  registers_count?: number;
  employees_count?: number;
}

type ActiveTab = 'overview' | 'plans' | 'invoices' | 'payments';

export default function BillingPage() {
  const { company: authCompany } = useAuth();
  // Company ni yangi tipga o'tkazamiz
  const company = authCompany as CompanyWithCounts | null;
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  
  // Data states
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [billingPlans, setBillingPlans] = useState<BillingPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stats states - alohida API orqali olishimiz mumkin
  const [companyStats, setCompanyStats] = useState({
    branches_count: 0,
    registers_count: 0,
    employees_count: 0
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Company stats ni olish uchun funksiya
  const fetchCompanyStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      // Bu yerda company stats ni olish uchun API endpoint ishlatishimiz mumkin
      // Agar bunday API bo'lmasa, mock data ishlatamiz
      const response = await fetch(`${API_URL}/api/v1/company/stats/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCompanyStats(data);
      } else {
        // Agar API mavjud bo'lmasa, mock data ishlatamiz
        setCompanyStats({
          branches_count: company?.branches_count || 1,
          registers_count: company?.registers_count || 2,
          employees_count: company?.employees_count || 5
        });
      }
    } catch (err) {
      console.error('Error fetching company stats:', err);
      // Xato bo'lsa ham mock data ishlatamiz
      setCompanyStats({
        branches_count: company?.branches_count || 1,
        registers_count: company?.registers_count || 2,
        employees_count: company?.employees_count || 5
      });
    }
  };

  // Fetch all data
  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/v1/billing/invoices/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: ApiResponse<Invoice> = await response.json();
        setInvoices(data.results);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    }
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/v1/billing/payments/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: ApiResponse<Payment> = await response.json();
        setPayments(data.results);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
  };

  const fetchBillingPlans = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/v1/billing/plans/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: ApiResponse<BillingPlan> = await response.json();
        setBillingPlans(data.results);
      }
    } catch (err) {
      console.error('Error fetching billing plans:', err);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/v1/billing/subscription/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: Subscription = await response.json();
        setCurrentSubscription(data);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    }
  };

  const subscribeToPlan = async (planId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/v1/billing/plans/${planId}/subscribe/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to subscribe to plan');
      }

      await fetchCurrentSubscription();
      setError(null);
      alert('Successfully subscribed to the plan!');
    } catch (err) {
      console.error('Error subscribing to plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to subscribe to plan');
    }
  };

  const deletePayment = async (paymentId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/v1/billing/payments/${paymentId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setPayments(payments.filter(payment => payment.id !== paymentId));
        setError(null);
      } else {
        throw new Error('Failed to delete payment');
      }
    } catch (err) {
      console.error('Error deleting payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete payment');
    }
  };

  // Load all data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchInvoices(),
          fetchPayments(),
          fetchBillingPlans(),
          fetchCurrentSubscription(),
          fetchCompanyStats()
        ]);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calculate stats
  const totalRevenue = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount_total), 0);
  const totalPaid = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount_paid), 0);
  const outstandingBalance = totalRevenue - totalPaid;
  
  const positivePayments = payments.filter(p => parseFloat(p.amount) > 0);
  const negativePayments = payments.filter(p => parseFloat(p.amount) < 0);
  const totalIncome = positivePayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  const totalExpenses = negativePayments.reduce((sum, payment) => sum + Math.abs(parseFloat(payment.amount)), 0);

  // Company usage limits based on current plan
  const getUsageLimits = () => {
    if (!currentSubscription || !company) {
      return {
        companies: { used: 1, limit: 1 },
        branches: { used: companyStats.branches_count, limit: -1 }, // -1 means unlimited
        registers: { used: companyStats.registers_count, limit: -1 },
        employees: { used: companyStats.employees_count, limit: -1 }
      };
    }

    const currentPlan = billingPlans.find(p => p.id === currentSubscription.plan);
    
    return {
      companies: { used: 1, limit: 1 }, // Only one company per subscription
      branches: { used: companyStats.branches_count, limit: currentPlan?.seats_included || -1 },
      registers: { used: companyStats.registers_count, limit: (currentPlan?.seats_included || 1) * 2 }, // 2 registers per seat
      employees: { used: companyStats.employees_count, limit: (currentPlan?.seats_included || 1) * 5 } // 5 employees per seat
    };
  };

  const usage = getUsageLimits();

  const handlePlanSelection = (plan: BillingPlan) => {
    if (currentSubscription && currentSubscription.plan === plan.id) {
      alert('You are already subscribed to this plan.');
      return;
    }

    const isChangingPlan = currentSubscription && currentSubscription.plan !== plan.id;
    const message = isChangingPlan
      ? `You currently have an active subscription. Are you sure you want to change to the "${plan.title}" plan? This will replace your current plan.`
      : `Are you sure you want to subscribe to the "${plan.title}" plan?`;

    if (window.confirm(message)) {
      subscribeToPlan(plan.id);
    }
  };

  const getCurrentPlanDetails = () => {
    if (!currentSubscription) return null;
    return billingPlans.find(p => p.id === currentSubscription.plan);
  };

  const currentPlan = getCurrentPlanDetails();

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 25; // Show 25% for unlimited to indicate usage
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'trial':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string | boolean) => {
    if (typeof status === 'boolean') {
      return status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    }

    const statusStr = String(status).toLowerCase();
    switch (statusStr) {
      case 'paid':
      case 'completed':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
      case 'failed':
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    const methodStr = String(method).toLowerCase();
    switch (methodStr) {
      case 'credit_card':
      case 'card':
        return 'bg-blue-100 text-blue-800';
      case 'bank_transfer':
      case 'transfer':
        return 'bg-green-100 text-green-800';
      case 'cash':
        return 'bg-gray-100 text-gray-800';
      case 'online':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  const getAmountColor = (amount: string) => {
    return parseFloat(amount) >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? '∞' : limit.toString();
  };

  // Filter data based on search and filters
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.invoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;
    
    return matchesSearch && matchesMethod;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>
          <p className="text-sm text-gray-600">Manage invoices and payments</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {activeTab === 'invoices'}
          {activeTab === 'payments'}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="text-red-700">
              <span className="text-lg">×</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'plans', name: 'Plans', icon: Star },
              { id: 'invoices', name: 'Invoices', icon: FileText },
              { id: 'payments', name: 'Payments', icon: CreditCard },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={clsx(
                    'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap',
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        ${totalRevenue.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-blue-500 p-3 rounded-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Outstanding Balance</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        ${outstandingBalance.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-orange-500 p-3 rounded-lg">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Total Income</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        ${totalIncome.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-green-500 p-3 rounded-lg">
                      <Download className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Total Expenses</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        ${totalExpenses.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-red-500 p-3 rounded-lg">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Plan Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
                    {currentPlan ? (
                      <p className="text-sm text-gray-600">You are currently on the {currentPlan.title} plan</p>
                    ) : (
                      <p className="text-sm text-gray-600">No active subscription</p>
                    )}
                  </div>
                  {currentPlan && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {currentPlan.currency.symbol}{parseFloat(billingPeriod === 'monthly' ? currentPlan.price_monthly : currentPlan.price_yearly).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">per {billingPeriod === 'monthly' ? 'month' : 'year'}</div>
                      {currentSubscription && (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-2 ${getSubscriptionStatusColor(currentSubscription.status)}`}>
                          {currentSubscription.status}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {currentPlan && currentSubscription && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          Companies
                        </span>
                        <span className="text-xs text-gray-500">
                          {usage.companies.used} / {formatLimit(usage.companies.limit)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ 
                            width: `${getUsagePercentage(usage.companies.used, usage.companies.limit)}%` 
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          Branches
                        </span>
                        <span className="text-xs text-gray-500">
                          {usage.branches.used} / {formatLimit(usage.branches.limit)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ 
                            width: `${getUsagePercentage(usage.branches.used, usage.branches.limit)}%` 
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                          <Monitor className="h-4 w-4" />
                          Registers
                        </span>
                        <span className="text-xs text-gray-500">
                          {usage.registers.used} / {formatLimit(usage.registers.limit)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all"
                          style={{ 
                            width: `${getUsagePercentage(usage.registers.used, usage.registers.limit)}%` 
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Employees
                        </span>
                        <span className="text-xs text-gray-500">
                          {usage.employees.used} / {formatLimit(usage.employees.limit)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all"
                          style={{ 
                            width: `${getUsagePercentage(usage.employees.used, usage.employees.limit)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {!currentPlan && (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">You don't have an active subscription</p>
                    <button
                      onClick={() => setActiveTab('plans')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      View Plans
                    </button>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Invoices */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
                    <button 
                      onClick={() => setActiveTab('invoices')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View all
                    </button>
                  </div>
                  <div className="space-y-3">
                    {invoices.slice(0, 5).map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{invoice.title}</p>
                          <p className="text-sm text-gray-500">{invoice.customer_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">${parseFloat(invoice.amount_total).toFixed(2)}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {invoices.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No invoices found</p>
                    )}
                  </div>
                </div>

                {/* Recent Payments */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
                    <button 
                      onClick={() => setActiveTab('payments')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View all
                    </button>
                  </div>
                  <div className="space-y-3">
                    {payments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Payment #{payment.id.slice(0, 8)}</p>
                          <p className="text-sm text-gray-500">{format(new Date(payment.created_at), 'MMM dd, yyyy')}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${getAmountColor(payment.amount)}`}>
                            ${Math.abs(parseFloat(payment.amount)).toFixed(2)}
                          </p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentMethodColor(payment.method)}`}>
                            {payment.method}
                          </span>
                        </div>
                      </div>
                    ))}
                    {payments.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No payments found</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        placeholder="Search invoices..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                  <div className="text-sm text-gray-600">
                    Showing {filteredInvoices.length} of {invoices.length} invoices
                  </div>
                </div>
              </div>

              {/* Invoices Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredInvoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <span className="text-sm font-medium text-gray-900">{invoice.title}</span>
                              <div className="text-xs text-gray-500">#{invoice.id.slice(0, 8)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{invoice.customer_name}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900">${parseFloat(invoice.amount_total).toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">${parseFloat(invoice.amount_paid).toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{format(new Date(invoice.created_at), 'MMM dd, yyyy')}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end space-x-2">
                              <button className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors">
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredInvoices.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No invoices found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        placeholder="Search payments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64"
                      />
                    </div>
                    <select
                      value={methodFilter}
                      onChange={(e) => setMethodFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Methods</option>
                      {Array.from(new Set(payments.map(p => p.method))).map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                  <div className="text-sm text-gray-600">
                    Showing {filteredPayments.length} of {payments.length} payments
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">#{payment.id.slice(0, 8)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{payment.invoice.slice(0, 8)}...</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-semibold ${getAmountColor(payment.amount)}`}>
                              ${Math.abs(parseFloat(payment.amount)).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentMethodColor(payment.method)}`}>
                              {payment.method}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{format(new Date(payment.created_at), 'MMM dd, yyyy HH:mm')}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button 
                              onClick={() => deletePayment(payment.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredPayments.length === 0 && (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No payments found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Plans Tab */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              {/* Billing Period Toggle */}
              <div className="flex justify-center">
                <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                  <button
                    onClick={() => setBillingPeriod('monthly')}
                    className={clsx(
                      'px-6 py-2 rounded-md text-sm font-medium transition-colors',
                      billingPeriod === 'monthly'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingPeriod('yearly')}
                    className={clsx(
                      'px-6 py-2 rounded-md text-sm font-medium transition-colors',
                      billingPeriod === 'yearly'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    Yearly
                    <span className="ml-2 text-xs text-green-600 font-semibold">Save 20%</span>
                  </button>
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {billingPlans.map((plan) => {
                  const isCurrentPlan = currentSubscription?.plan === plan.id;
                  const price = billingPeriod === 'monthly' ? plan.price_monthly : plan.price_yearly;

                  return (
                    <div
                      key={plan.id}
                      className={clsx(
                        'bg-white rounded-xl shadow-sm border-2 p-8 relative transition-all hover:shadow-lg',
                        isCurrentPlan
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200'
                      )}
                    >
                      {isCurrentPlan && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                            Current Plan
                          </span>
                        </div>
                      )}

                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {plan.title}
                        </h3>
                        <div className="flex items-baseline justify-center mb-4">
                          <span className="text-4xl font-bold text-gray-900">
                            {plan.currency.symbol}{parseFloat(price).toFixed(2)}
                          </span>
                          <span className="text-gray-600 ml-2">
                            / {billingPeriod === 'monthly' ? 'month' : 'year'}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">
                          {plan.description || 'Perfect for growing businesses'}
                        </p>
                      </div>

                      <div className="mb-6 space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Seats Included
                          </span>
                          <span className="text-lg font-bold text-gray-900">{plan.seats_included}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Branches
                          </span>
                          <span className="text-lg font-bold text-gray-900">{plan.seats_included}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            Registers
                          </span>
                          <span className="text-lg font-bold text-gray-900">{plan.seats_included * 2}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Employees
                          </span>
                          <span className="text-lg font-bold text-gray-900">{plan.seats_included * 5}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePlanSelection(plan)}
                        disabled={isCurrentPlan}
                        className={clsx(
                          'w-full py-3 px-6 rounded-lg font-medium transition-all',
                          isCurrentPlan
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                        )}
                      >
                        {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {billingPlans.length === 0 && (
                <div className="text-center py-12">
                  <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No billing plans available</p>
                  <p className="text-gray-400 text-sm mt-2">Please contact support for more information</p>
                </div>
              )}

              {/* Current Subscription Details */}
              {currentSubscription && currentPlan && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Current Subscription Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Plan</p>
                      <p className="text-lg font-semibold text-gray-900">{currentPlan.title}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getSubscriptionStatusColor(currentSubscription.status)}`}>
                        {currentSubscription.status}
                      </span>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Start Date</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {format(new Date(currentSubscription.start_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">End Date</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {format(new Date(currentSubscription.end_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Seats Used</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {currentSubscription.seats} / {currentPlan.seats_included}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Auto Renew</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {currentSubscription.auto_renew ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Monthly Price</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {currentPlan.currency.symbol}{parseFloat(currentPlan.price_monthly).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Yearly Price</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {currentPlan.currency.symbol}{parseFloat(currentPlan.price_yearly).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}