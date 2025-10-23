import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Check, Star, ArrowRight, Download, Plus, Search, Filter, Trash2, Edit, FileText, DollarSign, Users, BarChart3 } from 'lucide-react';
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

interface Currency {
  id: string;
  title: string;
  symbol: string;
  code: string;
  is_default: boolean;
  is_active: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  is_online: boolean;
  is_active: boolean;
}

interface InvoiceCreateData {
  title: string;
  customer_name: string;
  amount_total: string;
}

interface PaymentCreateData {
  invoice: string;
  amount: string;
  method: string;
}

interface CurrencyCreateData {
  title: string;
  symbol: string;
  code: string;
  is_default: boolean;
  is_active: boolean;
}

interface PaymentMethodCreateData {
  name: string;
  is_online: boolean;
  is_active: boolean;
}

interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Mock plans data
const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    features: [
      'Up to 2 branches',
      '5 employees',
      '1,000 orders/month',
      'Basic reporting',
      'Email support'
    ],
    limits: {
      branches: 2,
      registers: 3,
      employees: 5,
      ordersPerMonth: 1000
    }
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 79,
    features: [
      'Up to 10 branches',
      '25 employees',
      '10,000 orders/month',
      'Advanced reporting',
      'Priority support',
      'Custom branding'
    ],
    limits: {
      branches: 10,
      registers: 15,
      employees: 25,
      ordersPerMonth: 10000
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    features: [
      'Unlimited branches',
      'Unlimited employees',
      'Unlimited orders',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee'
    ],
    limits: {
      branches: -1,
      registers: -1,
      employees: -1,
      ordersPerMonth: -1
    }
  }
];

type ActiveTab = 'overview' | 'invoices' | 'payments' | 'currencies' | 'methods';

export default function BillingPage() {
  const { company, user } = useAuth(); // user ni qo'shdik
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  
  // Data states
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showCreatePayment, setShowCreatePayment] = useState(false);
  const [showCreateCurrency, setShowCreateCurrency] = useState(false);
  const [showCreatePaymentMethod, setShowCreatePaymentMethod] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  
  // Form states
  const [newInvoice, setNewInvoice] = useState<InvoiceCreateData>({
    title: '',
    customer_name: '',
    amount_total: ''
  });

  const [newPayment, setNewPayment] = useState<PaymentCreateData>({
    invoice: '',
    amount: '',
    method: ''
  });

  const [newCurrency, setNewCurrency] = useState<CurrencyCreateData>({
    title: '',
    symbol: '',
    code: '',
    is_default: false,
    is_active: true
  });

  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethodCreateData>({
    name: '',
    is_online: false,
    is_active: true
  });

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
      const response = await fetch(`${API_URL}/api/v1/payments/`, {
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

  const fetchCurrencies = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/v1/payments/currency/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: ApiResponse<Currency> = await response.json();
        setCurrencies(data.results);
      }
    } catch (err) {
      console.error('Error fetching currencies:', err);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/v1/payments/methods/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: ApiResponse<PaymentMethod> = await response.json();
        setPaymentMethods(data.results);
      }
    } catch (err) {
      console.error('Error fetching payment methods:', err);
    }
  };

  // Create operations
  const createInvoice = async (invoiceData: InvoiceCreateData) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/v1/billing/invoices/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create invoice');
      }

      await fetchInvoices();
      setShowCreateInvoice(false);
      setNewInvoice({ title: '', customer_name: '', amount_total: '' });
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    }
  };

  const createPayment = async (paymentData: PaymentCreateData) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/v1/payments/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create payment');
      }

      await fetchPayments();
      setShowCreatePayment(false);
      setNewPayment({ invoice: '', amount: '', method: '' });
    } catch (err) {
      console.error('Error creating payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to create payment');
    }
  };

  // To'g'rilangan createCurrency funksiyasi
  const createCurrency = async (currencyData: CurrencyCreateData) => {
    try {
      const token = localStorage.getItem('access_token');
      
      // Backendga kerakli maydonlarni yuboramiz
      const requestData: any = {
        title: currencyData.title,
        symbol: currencyData.symbol,
        code: currencyData.code,
        is_default: currencyData.is_default,
        is_active: currencyData.is_active,
        company: company?.id,
        notes: "Created from billing page"
      };

      // Faqat mavjud bo'lsa user ID sini qo'shamiz
      if (user?.id) {
        requestData.created_by = user.id;
        requestData.updated_by = user.id;
      }

      const response = await fetch(`${API_URL}/api/v1/payments/currency/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create currency');
      }

      await fetchCurrencies();
      setShowCreateCurrency(false);
      setNewCurrency({ title: '', symbol: '', code: '', is_default: false, is_active: true });
    } catch (err) {
      console.error('Error creating currency:', err);
      setError(err instanceof Error ? err.message : 'Failed to create currency');
    }
  };

  // To'g'rilangan createPaymentMethod funksiyasi
  const createPaymentMethod = async (methodData: PaymentMethodCreateData) => {
    try {
      const token = localStorage.getItem('access_token');
      
      // Backendga kerakli maydonlarni yuboramiz
      const requestData: any = {
        name: methodData.name,
        is_online: methodData.is_online,
        is_active: methodData.is_active,
        company: company?.id,
        notes: "Created from billing page"
      };

      // Faqat mavjud bo'lsa user ID sini qo'shamiz
      if (user?.id) {
        requestData.created_by = user.id;
        requestData.updated_by = user.id;
      }

      const response = await fetch(`${API_URL}/api/v1/payments/methods/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create payment method');
      }

      await fetchPaymentMethods();
      setShowCreatePaymentMethod(false);
      setNewPaymentMethod({ name: '', is_online: false, is_active: true });
    } catch (err) {
      console.error('Error creating payment method:', err);
      setError(err instanceof Error ? err.message : 'Failed to create payment method');
    }
  };

  // Delete operations
  const deleteInvoice = async (invoiceId: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/v1/billing/invoices/${invoiceId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }

      await fetchInvoices();
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError('Failed to delete invoice');
    }
  };

  const deletePayment = async (paymentId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/v1/payments/${paymentId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete payment');
      }

      await fetchPayments();
    } catch (err) {
      console.error('Error deleting payment:', err);
      setError('Failed to delete payment');
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
          fetchCurrencies(),
          fetchPaymentMethods()
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
  
  const totalPaymentAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  const positivePayments = payments.filter(p => parseFloat(p.amount) > 0);
  const negativePayments = payments.filter(p => parseFloat(p.amount) < 0);
  const totalIncome = positivePayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  const totalExpenses = negativePayments.reduce((sum, payment) => sum + Math.abs(parseFloat(payment.amount)), 0);

  // Mock usage data
  const currentPlan = plans.find(p => p.id === company?.title) || plans[1];
  const usage = {
    companies: 1,
    branches: 2,
    registers: 4,
    employees: 8,
    ordersThisMonth: 1247,
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  // To'g'rilangan getStatusColor funksiyasi
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
          <p className="text-sm text-gray-600">Manage invoices, payments, currencies and payment methods</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {activeTab === 'invoices' && (
            <button 
              onClick={() => setShowCreateInvoice(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create Invoice</span>
            </button>
          )}
          {activeTab === 'payments' && (
            <button 
              onClick={() => setShowCreatePayment(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create Payment</span>
            </button>
          )}
          <button 
            onClick={() => setShowCreateCurrency(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Currency</span>
          </button>
          <button 
            onClick={() => setShowCreatePaymentMethod(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Payment Method</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'invoices', name: 'Invoices', icon: FileText },
              { id: 'payments', name: 'Payments', icon: CreditCard },
              { id: 'currencies', name: 'Currencies', icon: DollarSign },
              { id: 'methods', name: 'Payment Methods', icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={clsx(
                    'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
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
                    <p className="text-sm text-gray-600">You are currently on the {currentPlan.name} plan</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">${currentPlan.price}</div>
                    <div className="text-sm text-gray-600">per month</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Branches</span>
                      <span className="text-xs text-gray-500">
                        {usage.branches} / {currentPlan.limits.branches === -1 ? '∞' : currentPlan.limits.branches}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ 
                          width: currentPlan.limits.branches === -1 ? '20%' : 
                            `${getUsagePercentage(usage.branches, currentPlan.limits.branches)}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Employees</span>
                      <span className="text-xs text-gray-500">
                        {usage.employees} / {currentPlan.limits.employees === -1 ? '∞' : currentPlan.limits.employees}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ 
                          width: currentPlan.limits.employees === -1 ? '20%' : 
                            `${getUsagePercentage(usage.employees, currentPlan.limits.employees)}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Orders</span>
                      <span className="text-xs text-gray-500">
                        {usage.ordersThisMonth.toLocaleString()} / {currentPlan.limits.ordersPerMonth === -1 ? '∞' : currentPlan.limits.ordersPerMonth.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all"
                        style={{ 
                          width: currentPlan.limits.ordersPerMonth === -1 ? '20%' : 
                            `${getUsagePercentage(usage.ordersThisMonth, currentPlan.limits.ordersPerMonth)}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Registers</span>
                      <span className="text-xs text-gray-500">
                        {usage.registers} / {currentPlan.limits.registers === -1 ? '∞' : currentPlan.limits.registers}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all"
                        style={{ 
                          width: currentPlan.limits.registers === -1 ? '20%' : 
                            `${getUsagePercentage(usage.registers, currentPlan.limits.registers)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
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
                            ${parseFloat(payment.amount).toFixed(2)}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paid Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredInvoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {invoice.title}
                              </span>
                              <div className="text-xs text-gray-500">#{invoice.id.slice(0, 8)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {invoice.customer_name}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900">
                              ${parseFloat(invoice.amount_total).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              ${parseFloat(invoice.amount_paid).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end space-x-2">
                              <button className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors">
                                <Download className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => deleteInvoice(invoice.id)}
                                className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
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
              {/* Search and Filter */}
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

              {/* Payments Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              #{payment.id.slice(0, 8)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {payment.invoice.slice(0, 8)}...
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-semibold ${getAmountColor(payment.amount)}`}>
                              ${parseFloat(payment.amount).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentMethodColor(payment.method)}`}>
                              {payment.method}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {format(new Date(payment.created_at), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => deletePayment(payment.id)}
                                className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
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

          {/* Currencies Tab */}
          {activeTab === 'currencies' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Currency
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Symbol
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Default
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currencies.map((currency) => (
                        <tr key={currency.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {currency.title}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {currency.code}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {currency.symbol}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(currency.is_active)}`}>
                              {currency.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {currency.is_default ? 'Yes' : 'No'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {currencies.length === 0 && (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No currencies found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment Methods Tab */}
          {activeTab === 'methods' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paymentMethods.map((method) => (
                        <tr key={method.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {method.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              method.is_online ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {method.is_online ? 'Online' : 'Offline'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(method.is_active)}`}>
                              {method.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {paymentMethods.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No payment methods found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* All Modals */}
      {/* Create Invoice Modal */}
      {showCreateInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Create New Invoice</h3>
              <button
                onClick={() => setShowCreateInvoice(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                createInvoice(newInvoice);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newInvoice.title}
                    onChange={(e) => setNewInvoice({...newInvoice, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Invoice title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newInvoice.customer_name}
                    onChange={(e) => setNewInvoice({...newInvoice, customer_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newInvoice.amount_total}
                    onChange={(e) => setNewInvoice({...newInvoice, amount_total: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateInvoice(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Create Invoice
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Payment Modal */}
      {showCreatePayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Create New Payment</h3>
              <button
                onClick={() => setShowCreatePayment(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                createPayment(newPayment);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPayment.invoice}
                    onChange={(e) => setNewPayment({...newPayment, invoice: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter invoice UUID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Method *
                  </label>
                  <select
                    required
                    value={newPayment.method}
                    onChange={(e) => setNewPayment({...newPayment, method: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select method</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="online">Online</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreatePayment(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Create Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Currency Modal */}
      {showCreateCurrency && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Add New Currency</h3>
              <button
                onClick={() => setShowCreateCurrency(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                createCurrency(newCurrency);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCurrency.title}
                    onChange={(e) => setNewCurrency({...newCurrency, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="US Dollar"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={newCurrency.code}
                    onChange={(e) => setNewCurrency({...newCurrency, code: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="USD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Symbol *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={newCurrency.symbol}
                    onChange={(e) => setNewCurrency({...newCurrency, symbol: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="$"
                  />
                </div>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newCurrency.is_default}
                      onChange={(e) => setNewCurrency({...newCurrency, is_default: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Default currency</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newCurrency.is_active}
                      onChange={(e) => setNewCurrency({...newCurrency, is_active: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateCurrency(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Add Currency
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Payment Method Modal */}
      {showCreatePaymentMethod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Add Payment Method</h3>
              <button
                onClick={() => setShowCreatePaymentMethod(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                createPaymentMethod(newPaymentMethod);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPaymentMethod.name}
                    onChange={(e) => setNewPaymentMethod({...newPaymentMethod, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Credit Card"
                  />
                </div>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newPaymentMethod.is_online}
                      onChange={(e) => setNewPaymentMethod({...newPaymentMethod, is_online: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Online payment</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newPaymentMethod.is_active}
                      onChange={(e) => setNewPaymentMethod({...newPaymentMethod, is_active: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreatePaymentMethod(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Add Method
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}