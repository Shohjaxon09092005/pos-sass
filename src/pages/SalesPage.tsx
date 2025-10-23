import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Users,
  Eye,
  RefreshCw,
  X,
  Filter,
  Search,
  Calendar,
} from "lucide-react";

// Types based on API response
interface SaleItem {
  id: string;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  quantity: number;
  cost_price: string;
  company: number;
  created_by: number;
  updated_by: number;
  deleted_by: number | null;
  sale: string;
  product: string;
}

interface Sale {
  id: string;
  items: SaleItem[];
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  amount_total: string;
  amount_due: string;
  amount_paid: string;
  company: number;
  created_by: number;
  updated_by: number;
  deleted_by: number | null;
  session: string;
  register: string;
  customer: string | null;
}

interface SalesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Sale[];
}

interface Product {
  id: string;
  stock_quants: any[];
  created_at: string;
  updated_at: string;
  title: string;
  image: string;
  price: string;
  cost: string;
  barcode: string;
  reference: string;
  sku: string;
  category: string;
  unit: string;
}

interface ProductsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

interface PaymentMethod {
  id: string;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  name: string;
  is_online: boolean;
  company: number;
  created_by: number;
  updated_by: number;
  deleted_by: number | null;
}

interface PaymentMethodsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PaymentMethod[];
}

interface Session {
  id: string;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  title: string;
  start_at: string;
  end_at: string | null;
  status: string;
  opening_balance: string;
  closing_balance: string;
  total_sales: string;
  total_refunds: string;
  company: number;
  created_by: number;
  updated_by: number;
  deleted_by: number | null;
  register: string;
}

interface SessionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Session[];
}

interface Register {
  id: string;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  title: string;
  company: number;
  created_by: number;
  updated_by: number;
  deleted_by: number | null;
}

interface RegistersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Register[];
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Filters {
  customer: string;
  register: string;
  session: string;
  min_amount_total: string;
  max_amount_total: string;
  min_amount_paid: string;
  max_amount_paid: string;
  min_amount_due: string;
  max_amount_due: string;
  payment_method: string;
  date_from: string;
  date_to: string;
}
const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [registers, setRegisters] = useState<Register[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSaleDetail, setShowSaleDetail] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState<Filters>({
    customer: "",
    register: "",
    session: "",
    min_amount_total: "",
    max_amount_total: "",
    min_amount_paid: "",
    max_amount_paid: "",
    min_amount_due: "",
    max_amount_due: "",
    payment_method: "",
    date_from: "",
    date_to: "",
  });

  // Fetch all data - yangilangan versiya
  const fetchData = async (
    page: number = 1,
    filterParams: Filters = filters
  ) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("access_token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", page.toString());

      Object.entries(filterParams).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      // Har bir API ni alohida fetch qilish va xatolarni boshqarish
      const fetchPromises = [
        // Sales - agar mavjud bo'lmasa, bo'sh array qaytaradi
        fetch(`${API_BASE_URL}/api/v1/pos/sales/?${params}`, { headers })
          .then((res) => (res.ok ? res.json() : { results: [], count: 0 }))
          .catch(() => ({ results: [], count: 0 })),

        // Products
        fetch(`${API_BASE_URL}/api/v1/products/`, { headers })
          .then((res) => (res.ok ? res.json() : { results: [] }))
          .catch(() => ({ results: [] })),

        // Payment methods
        fetch(`${API_BASE_URL}/api/v1/payments/methods/`, { headers })
          .then((res) => (res.ok ? res.json() : { results: [] }))
          .catch(() => ({ results: [] })),

        // Sessions
        fetch(`${API_BASE_URL}/api/v1/pos/sessions/`, { headers })
          .then((res) => (res.ok ? res.json() : { results: [] }))
          .catch(() => ({ results: [] })),

        // Registers
        fetch(`${API_BASE_URL}/api/v1/pos/registers/`, { headers })
          .then((res) => (res.ok ? res.json() : { results: [] }))
          .catch(() => ({ results: [] })),
      ];

      const [
        salesData,
        productsData,
        paymentsData,
        sessionsData,
        registersData,
      ] = await Promise.all(fetchPromises);

      setSales(salesData.results || []);
      setProducts(productsData.results || []);
      setPaymentMethods(paymentsData.results || []);
      setSessions(sessionsData.results || []);
      setRegisters(registersData.results || []);

      // Calculate total pages
      const pageSize = 20;
      setTotalPages(Math.ceil((salesData.count || 0) / pageSize));
      setCurrentPage(page);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load some data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  // Handle filter changes
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    fetchData(1, filters);
    setShowFilters(false);
  };

  // Clear filters
  const clearFilters = () => {
    const clearedFilters: Filters = {
      customer: "",
      register: "",
      session: "",
      min_amount_total: "",
      max_amount_total: "",
      min_amount_paid: "",
      max_amount_paid: "",
      min_amount_due: "",
      max_amount_due: "",
      payment_method: "",
      date_from: "",
      date_to: "",
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
    fetchData(1, clearedFilters);
  };

  // Helper functions
  const getProductDetails = (productId: string) => {
    return products.find((p) => p.id === productId) || null;
  };

  const getProductName = (productId: string) => {
    const product = getProductDetails(productId);
    return product ? product.title : `Product (${productId.slice(0, 8)}...)`;
  };

  const getProductSKU = (productId: string) => {
    const product = getProductDetails(productId);
    return product ? product.sku : "N/A";
  };

  const getTotalQuantity = (sale: Sale) => {
    return sale.items.reduce((sum, item) => sum + Math.abs(item.quantity), 0);
  };

  const getItemTotal = (item: SaleItem) => {
    const quantity = Math.abs(item.quantity);
    const costPrice = parseFloat(item.cost_price) || 0;
    return quantity * costPrice;
  };

  // Determine payment method based on amount paid vs total
  const getPaymentMethod = (sale: Sale) => {
    const amountPaid = parseFloat(sale.amount_paid);
    const amountTotal = parseFloat(sale.amount_total);

    if (amountPaid >= amountTotal) {
      return "card";
    } else if (amountPaid > 0 && amountPaid < amountTotal) {
      return "mixed";
    } else {
      return "cash";
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return "💵";
      case "card":
        return "💳";
      case "mixed":
        return "💵💳";
      default:
        return "💳";
    }
  };

  // Calculate statistics
  const todaysSales = sales.filter((sale) => {
    const saleDate = format(parseISO(sale.created_at), "yyyy-MM-dd");
    const today = format(new Date(), "yyyy-MM-dd");
    return saleDate === today;
  });

  const totalRevenue = sales.reduce(
    (sum, sale) => sum + parseFloat(sale.amount_total),
    0
  );
  const totalOrders = sales.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const todaysRevenue = todaysSales.reduce(
    (sum, sale) => sum + parseFloat(sale.amount_total),
    0
  );

  // Pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchData(page, filters);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Hech qanday sotuv topilmadi
        </h3>
        <p className="text-gray-500 mb-6">
          Sotuvlar ro'yxati bo'sh. Birinchi sotuvni yaratish uchun POS
          terminaliga o'ting.
        </p>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Sotuvlarni ko'rish uchun quyidagilarni tekshiring:
          </p>
          <ul className="text-sm text-gray-500 space-y-2">
            <li>• Kassalar (Registers) mavjudligi</li>
            <li>• Faol sessiyalar mavjudligi</li>
            <li>• Mahsulotlar ro'yxati</li>
          </ul>
        </div>
        <div className="mt-8 space-x-4">
          <button
            onClick={() => (window.location.href = "/pos")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            POS Terminaliga o'tish
          </button>
          <button
            onClick={() => fetchData()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Yangilash
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-sm text-gray-600">
            Track and analyze your sales performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </button>
          <button
            onClick={() => fetchData()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Customer Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer
              </label>
              <input
                type="text"
                value={filters.customer}
                onChange={(e) => handleFilterChange("customer", e.target.value)}
                placeholder="Customer ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Register Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Register
              </label>
              <select
                value={filters.register}
                onChange={(e) => handleFilterChange("register", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Registers</option>
                {registers.map((register) => (
                  <option key={register.id} value={register.id}>
                    {register.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Session Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session
              </label>
              <select
                value={filters.session}
                onChange={(e) => handleFilterChange("session", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Sessions</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.title} ({session.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={filters.payment_method}
                onChange={(e) =>
                  handleFilterChange("payment_method", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Methods</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name} {method.is_online ? "(Online)" : "(Offline)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Total Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={filters.min_amount_total}
                  onChange={(e) =>
                    handleFilterChange("min_amount_total", e.target.value)
                  }
                  placeholder="Min"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  value={filters.max_amount_total}
                  onChange={(e) =>
                    handleFilterChange("max_amount_total", e.target.value)
                  }
                  placeholder="Max"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Amount Paid Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Paid Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={filters.min_amount_paid}
                  onChange={(e) =>
                    handleFilterChange("min_amount_paid", e.target.value)
                  }
                  placeholder="Min"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  value={filters.max_amount_paid}
                  onChange={(e) =>
                    handleFilterChange("max_amount_paid", e.target.value)
                  }
                  placeholder="Max"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) =>
                    handleFilterChange("date_from", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) =>
                    handleFilterChange("date_to", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Today's Revenue
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${todaysRevenue.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Today's Orders
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {todaysSales.length}
              </p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Avg Order Value
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${avgOrderValue.toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {totalOrders}
              </p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipt #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-gray-900">
                      {sale.id.slice(0, 8)}...
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(parseISO(sale.created_at), "MMM dd, yyyy")}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(parseISO(sale.created_at), "HH:mm")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {sale.items.length} items
                    </div>
                    <div className="text-sm text-gray-500">
                      {getTotalQuantity(sale)} qty
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <span className="mr-2">
                        {getPaymentMethodIcon(getPaymentMethod(sale))}
                      </span>
                      <span className="capitalize">
                        {getPaymentMethod(sale)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                      ${parseFloat(sale.amount_total).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        sale.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {sale.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedSale(sale);
                        setShowSaleDetail(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded-lg ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sale Detail Modal */}
      {showSaleDetail && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Sale Details</h3>
              <button
                onClick={() => {
                  setShowSaleDetail(false);
                  setSelectedSale(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Receipt Number
                  </label>
                  <p className="text-lg font-mono text-gray-900">
                    {selectedSale.id}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Date & Time
                  </label>
                  <p className="text-gray-900">
                    {format(
                      parseISO(selectedSale.created_at),
                      "MMM dd, yyyy HH:mm"
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Payment Method
                  </label>
                  <p className="text-gray-900 capitalize flex items-center">
                    <span className="mr-2">
                      {getPaymentMethodIcon(getPaymentMethod(selectedSale))}
                    </span>
                    {getPaymentMethod(selectedSale)}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      selectedSale.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedSale.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Total Amount
                  </label>
                  <p className="text-2xl font-bold text-green-600">
                    ${parseFloat(selectedSale.amount_total).toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Amount Paid
                  </label>
                  <p className="text-lg text-gray-900">
                    ${parseFloat(selectedSale.amount_paid).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Items
              </h4>
              <div className="space-y-3">
                {selectedSale.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">
                        {getProductName(item.product)}
                      </h5>
                      <p className="text-sm text-gray-500">
                        SKU: {getProductSKU(item.product)}
                      </p>
                      <p className="text-sm text-gray-500">
                        ${parseFloat(item.cost_price || "0").toFixed(2)} ×{" "}
                        {Math.abs(item.quantity)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${getItemTotal(item).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">
                    $
                    {(
                      parseFloat(selectedSale.amount_total) -
                      parseFloat(selectedSale.amount_due || "0")
                    ).toFixed(2)}
                  </span>
                </div>
                {parseFloat(selectedSale.amount_due || "0") !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Amount</span>
                    <span className="text-red-600">
                      ${parseFloat(selectedSale.amount_due || "0").toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>
                    ${parseFloat(selectedSale.amount_total).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                onClick={() => {
                  setShowSaleDetail(false);
                  setSelectedSale(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
