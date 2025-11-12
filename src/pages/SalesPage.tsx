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
import { Printer } from "lucide-react"; // or your icon library
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
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
export default function SalesPage() {
  const { t, i18n } = useTranslation("sales");
  const { user, company } = useAuth();
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
      return t("card");
    } else if (amountPaid > 0 && amountPaid < amountTotal) {
      return t("mixed");
    } else {
      return t("cash");
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
  const handlePrintSaleDetail = () => {
    const printElement = document.getElementById("print-sale-detail");
    if (printElement) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
        <html>
          <head>
            <title>Receipt #${selectedSale ? selectedSale.id : ""}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px;
                font-size: 14px;
                color: #000;
              }
              .receipt-container { 
                max-width: 300px; 
                margin: 0 auto; 
              }
              .text-center { text-align: center; }
              .border-t { border-top: 1px solid #000; }
              .border-b { border-bottom: 1px solid #000; }
              .border-gray-400 { border-color: #666; }
              .border-gray-200 { border-color: #ddd; }
              .flex { display: flex; }
              .flex-1 { flex: 1; }
              .justify-between { justify-content: space-between; }
              .font-bold { font-weight: bold; }
              .font-medium { font-weight: 500; }
              .font-semibold { font-weight: 600; }
              .text-sm { font-size: 12px; }
              .text-xs { font-size: 10px; }
              .text-lg { font-size: 16px; }
              .text-xl { font-size: 18px; }
              .text-gray-600 { color: #666; }
              .text-red-600 { color: #dc2626; }
              .text-green-600 { color: #16a34a; }
              .mb-2 { margin-bottom: 8px; }
              .mb-4 { margin-bottom: 16px; }
              .mt-1 { margin-top: 4px; }
              .mt-3 { margin-top: 12px; }
              .mt-6 { margin-top: 24px; }
              .my-3 { margin-top: 12px; margin-bottom: 12px; }
              .py-1 { padding-top: 4px; padding-bottom: 4px; }
              .py-3 { padding-top: 12px; padding-bottom: 12px; }
              .pt-2 { padding-top: 8px; }
              .pt-4 { padding-top: 16px; }
              .pb-4 { padding-bottom: 16px; }
              .p-6 { padding: 24px; }
              .space-y-2 > * + * { margin-top: 8px; }
              .last\\:border-b-0:last-child { border-bottom: none; }
              .capitalize { text-transform: capitalize; }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              ${printElement.innerHTML}
            </div>
          </body>
        </html>
      `);
        printWindow.document.close();

        printWindow.onload = function () {
          printWindow.focus();
          printWindow.print();
          printWindow.onafterprint = function () {
            printWindow.close();
          };
        };
      }
    }
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
          {t("noSalesFound")}
        </h3>
        <p className="text-gray-500 mb-6">{t("noSalesDescription")}</p>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{t("checkFollowing")}</p>
          <ul className="text-sm text-gray-500 space-y-2">
            <li>• {t("registersAvailability")}</li>
            <li>• {t("activeSessions")}</li>
            <li>• {t("productsList")}</li>
          </ul>
        </div>
        <div className="mt-8 space-x-4">
          <button
            onClick={() => (window.location.href = "/pos")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {t("goToPos")}
          </button>
          <button
            onClick={() => fetchData()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {t("reload")}
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
          <h1 className="text-2xl font-bold text-gray-900">{t("sales")}</h1>
          <p className="text-sm text-gray-600">{t("trackAnalyzeSales")}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-5 w-5" />
            <span>{t("filters")}</span>
          </button>
          <button
            onClick={() => fetchData()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            <span>{t("refresh")}</span>
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
                {t("customer")}
              </label>
              <input
                type="text"
                value={filters.customer}
                onChange={(e) => handleFilterChange("customer", e.target.value)}
                placeholder={t("customerId")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Register Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("register")}
              </label>
              <select
                value={filters.register}
                onChange={(e) => handleFilterChange("register", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t("allRegisters")}</option>
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
                {t("session")}
              </label>
              <select
                value={filters.session}
                onChange={(e) => handleFilterChange("session", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t("allSessions")}</option>
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
                {t("paymentMethod")}
              </label>
              <select
                value={filters.payment_method}
                onChange={(e) =>
                  handleFilterChange("payment_method", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t("allMethods")}</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}{" "}
                    {method.is_online ? t("online") : t("offline")}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Total Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("totalAmountRange")}
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={filters.min_amount_total}
                  onChange={(e) =>
                    handleFilterChange("min_amount_total", e.target.value)
                  }
                  placeholder={t("min")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  value={filters.max_amount_total}
                  onChange={(e) =>
                    handleFilterChange("max_amount_total", e.target.value)
                  }
                  placeholder={t("max")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Amount Paid Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("amountPaidRange")}
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={filters.min_amount_paid}
                  onChange={(e) =>
                    handleFilterChange("min_amount_paid", e.target.value)
                  }
                  placeholder={t("min")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  value={filters.max_amount_paid}
                  onChange={(e) =>
                    handleFilterChange("max_amount_paid", e.target.value)
                  }
                  placeholder={t("max")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("dateRange")}
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
              {t("clearAll")}
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {t("applyFilters")}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-66">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t("todaysRevenue")}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {(todaysRevenue || 0).toFixed(2)} UZS
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
                {t("todaysOrders")}
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
                {t("avgOrderValue")}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {(avgOrderValue || 0).toFixed(2)} UZS
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
              <p className="text-sm font-medium text-gray-600">
                {t("totalOrders")}
              </p>
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
          <h3 className="text-lg font-semibold text-gray-900">
            {t("recentSales")}
          </h3>
          <div className="text-sm text-gray-500">
            {t("page")} {currentPage} {t("of")} {totalPages}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("receipt")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("dateTime")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("items")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("payment")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("total")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("actions")}
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
                      {sale.items.length} {t("items")}
                    </div>
                    <div className="text-sm text-gray-500">
                      {getTotalQuantity(sale)} {t("quantity")}
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
                      {(parseFloat(sale.amount_total) || 0).toFixed(2)} UZS
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
                {t("previous")}
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
                {t("next")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sale Detail Modal */}
      {showSaleDetail && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
            style={{ marginTop: "50px" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {t("saleDetails")}
              </h3>
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
                    {t("receiptNumber")}
                  </label>
                  <p className="text-lg font-mono text-gray-900">
                    {selectedSale.id}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t("dateTime")}
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
                    {t("paymentMethod")}
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
                    {t("total")}
                  </label>
                  <p className="text-2xl font-bold text-green-600">
                    {(parseFloat(selectedSale.amount_total) || 0).toFixed(2)}{" "}
                    UZS
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t("amountPaid")}
                  </label>
                  <p className="text-lg text-gray-900">
                    {(parseFloat(selectedSale.amount_paid) || 0).toFixed(2)} UZS
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                {t("items")}
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
                        {t("sku")}: {getProductSKU(item.product)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {parseFloat(item.cost_price || "0").toFixed(2)} × UZS
                        {Math.abs(item.quantity)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {(getItemTotal(item) || 0).toFixed(2)} UZS
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("subtotal")}</span>
                  <span className="text-gray-900">
                    {(
                      parseFloat(selectedSale.amount_total) -
                      parseFloat(selectedSale.amount_due || "0")
                    ).toFixed(2)}{" "}
                    UZS
                  </span>
                </div>
                {parseFloat(selectedSale.amount_due || "0") !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("dueAmount")}</span>
                    <span className="text-red-600">
                      {parseFloat(selectedSale.amount_due || "0").toFixed(2)}{" "}
                      UZS
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>{t("total")}</span>
                  <span>
                    {parseFloat(selectedSale.amount_total).toFixed(2)} UZS
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
                {t("close")}
              </button>
              <button
                onClick={handlePrintSaleDetail}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center"
              >
                <Printer className="h-4 w-4 mr-2" />
                {t("printReceipt")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print-Only Sale Detail Receipt */}
      {selectedSale && (
        <div className="hidden">
          <div id="print-sale-detail" className="p-6 max-w-xs">
            <div className="text-center mb-4 border-b pb-4">
              <h2 className="text-xl font-bold">
                {company?.title || "Store Name"}
              </h2>
              <p className="text-sm">
                {t("receipt")}
                {selectedSale.id}
              </p>
              <p className="text-xs">
                {format(
                  parseISO(selectedSale.created_at),
                  "MMM dd, yyyy HH:mm"
                )}
              </p>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">{t("paymentMethod")}:</span>
                <span className="capitalize">
                  {getPaymentMethod(selectedSale)}
                </span>
              </div>
            </div>

            <div className="border-t border-b border-gray-400 py-3 my-3">
              <h3 className="font-bold text-sm mb-2">{t("items")}:</h3>
              {selectedSale.items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm py-1 border-b border-gray-200 last:border-b-0"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {getProductName(item.product)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {t("sku")}: {getProductSKU(item.product)} |
                      {parseFloat(item.cost_price || "0").toFixed(2)} × UZS
                      {Math.abs(item.quantity)}
                    </div>
                  </div>
                  <div className="font-semibold">
                    {(getItemTotal(item) || 0).toFixed(2)} UZS
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t("subtotal")}:</span>
                <span>
                  {(
                    parseFloat(selectedSale.amount_total) -
                    parseFloat(selectedSale.amount_due || "0")
                  ).toFixed(2)}{" "}
                  UZS
                </span>
              </div>

              {parseFloat(selectedSale.amount_due || "0") !== 0 && (
                <div className="flex justify-between text-red-600">
                  <span>{t("dueAmount")}:</span>
                  <span>
                    {(parseFloat(selectedSale.amount_due || "0") || 0).toFixed(
                      2
                    )}{" "}
                    UZS
                  </span>
                </div>
              )}

              <div className="flex justify-between font-bold text-lg border-t border-gray-400 pt-2">
                <span>{t("total")}:</span>
                <span>
                  {(parseFloat(selectedSale.amount_total) || 0).toFixed(2)} UZS
                </span>
              </div>

              <div className="flex justify-between text-green-600">
                <span>{t("amountPaid")}:</span>
                <span>
                  {(parseFloat(selectedSale.amount_paid) || 0).toFixed(2)} UZS
                </span>
              </div>
            </div>

            <div className="text-center mt-6 text-xs border-t border-gray-400 pt-4">
              <p>{t("thankYou")}</p>
              <p className="mt-1">
                {format(
                  parseISO(selectedSale.created_at),
                  "MMM dd, yyyy HH:mm:ss"
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
