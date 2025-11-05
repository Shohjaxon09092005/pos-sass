// components/PaymentsPage.tsx
import React, { useState, useEffect } from "react";
import { Payment, PaymentMethod, Currency } from "../types";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  CreditCard,
  Wallet,
  Coins,
  X,
  Save,
  DollarSign,
} from "lucide-react";
import { clsx } from "clsx";

const API_URL = import.meta.env.VITE_API_URL;

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<"payments" | "methods" | "currency">("payments");
  
  // Payments state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentSearchTerm, setPaymentSearchTerm] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  // Payment Methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [filteredMethods, setFilteredMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [methodSearchTerm, setMethodSearchTerm] = useState("");
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  // Currency state
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [filteredCurrencies, setFilteredCurrencies] = useState<Currency[]>([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(true);
  const [currencySearchTerm, setCurrencySearchTerm] = useState("");
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);

  // Fetch payments
  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_URL}/api/v1/payments/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPayments(data.results || data);
        setFilteredPayments(data.results || data);
      } else {
        console.error("Failed to fetch payments:", response.status);
        setPayments([]);
        setFilteredPayments([]);
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      setPayments([]);
      setFilteredPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  };

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_URL}/api/v1/payments/methods/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.results || data);
        setFilteredMethods(data.results || data);
      } else {
        console.error("Failed to fetch payment methods:", response.status);
        setPaymentMethods([]);
        setFilteredMethods([]);
      }
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
      setPaymentMethods([]);
      setFilteredMethods([]);
    } finally {
      setMethodsLoading(false);
    }
  };

  // Fetch currencies
  const fetchCurrencies = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_URL}/api/v1/payments/currency/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCurrencies(data.results || data);
        setFilteredCurrencies(data.results || data);
      } else {
        console.error("Failed to fetch currencies:", response.status);
        setCurrencies([]);
        setFilteredCurrencies([]);
      }
    } catch (error) {
      console.error("Failed to fetch currencies:", error);
      setCurrencies([]);
      setFilteredCurrencies([]);
    } finally {
      setCurrenciesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "payments") {
      fetchPayments();
    } else if (activeTab === "methods") {
      fetchPaymentMethods();
    } else if (activeTab === "currency") {
      fetchCurrencies();
    }
  }, [activeTab]);

  // Search effects
  useEffect(() => {
    if (paymentSearchTerm.trim() === "") {
      setFilteredPayments(payments);
    } else {
      const filtered = payments.filter(payment =>
        payment?.name?.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
        payment?.description?.toLowerCase().includes(paymentSearchTerm.toLowerCase())
      );
      setFilteredPayments(filtered);
    }
  }, [paymentSearchTerm, payments]);

  useEffect(() => {
    if (methodSearchTerm.trim() === "") {
      setFilteredMethods(paymentMethods);
    } else {
      const filtered = paymentMethods.filter(method =>
        method?.name?.toLowerCase().includes(methodSearchTerm.toLowerCase()) ||
        method?.type?.toLowerCase().includes(methodSearchTerm.toLowerCase())
      );
      setFilteredMethods(filtered);
    }
  }, [methodSearchTerm, paymentMethods]);

  useEffect(() => {
    if (currencySearchTerm.trim() === "") {
      setFilteredCurrencies(currencies);
    } else {
      const filtered = currencies.filter(currency =>
        currency?.code?.toLowerCase().includes(currencySearchTerm.toLowerCase()) ||
        currency?.name?.toLowerCase().includes(currencySearchTerm.toLowerCase())
      );
      setFilteredCurrencies(filtered);
    }
  }, [currencySearchTerm, currencies]);

  // Payment CRUD operations
  const handleAddPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const token = localStorage.getItem("access_token");
      const paymentData = {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        is_active: true,
      };

      const response = await fetch(
        `${API_URL}/api/v1/payments/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentData),
        }
      );

      if (response.ok) {
        await fetchPayments();
        setShowPaymentModal(false);
      } else {
        console.error("Failed to add payment");
        alert("To'lov qo'shish muvaffaqiyatsiz tugadi");
      }
    } catch (error) {
      console.error("Error adding payment:", error);
      alert("Xatolik yuz berdi");
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPayment) return;

    const formData = new FormData(e.currentTarget);

    try {
      const token = localStorage.getItem("access_token");
      const paymentData = {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        is_active: formData.get("is_active") === "true",
      };

      const response = await fetch(
        `${API_URL}/api/v1/payments/${editingPayment.id}/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentData),
        }
      );

      if (response.ok) {
        await fetchPayments();
        setEditingPayment(null);
      } else {
        console.error("Failed to update payment");
        alert("To'lovni yangilash muvaffaqiyatsiz tugadi");
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      alert("Xatolik yuz berdi");
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm("Haqiqatan ham ushbu to'lovni oʻchirmoqchimisiz?")) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_URL}/api/v1/payments/${paymentId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        await fetchPayments();
      } else {
        console.error("Failed to delete payment");
        alert("To'lovni oʻchirish muvaffaqiyatsiz tugadi");
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      alert("Xatolik yuz berdi");
    }
  };

  // Payment Method CRUD operations
  const handleAddMethod = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const token = localStorage.getItem("access_token");
      const methodData = {
        name: formData.get("name") as string,
        type: formData.get("type") as string,
        description: formData.get("description") as string,
        is_active: true,
      };

      const response = await fetch(
        `${API_URL}/api/v1/payments/methods/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(methodData),
        }
      );

      if (response.ok) {
        await fetchPaymentMethods();
        setShowMethodModal(false);
      } else {
        console.error("Failed to add payment method");
        alert("To'lov usuli qo'shish muvaffaqiyatsiz tugadi");
      }
    } catch (error) {
      console.error("Error adding payment method:", error);
      alert("Xatolik yuz berdi");
    }
  };

  const handleUpdateMethod = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMethod) return;

    const formData = new FormData(e.currentTarget);

    try {
      const token = localStorage.getItem("access_token");
      const methodData = {
        name: formData.get("name") as string,
        type: formData.get("type") as string,
        description: formData.get("description") as string,
        is_active: formData.get("is_active") === "true",
      };

      const response = await fetch(
        `${API_URL}/api/v1/payments/methods/${editingMethod.id}/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(methodData),
        }
      );

      if (response.ok) {
        await fetchPaymentMethods();
        setEditingMethod(null);
      } else {
        console.error("Failed to update payment method");
        alert("To'lov usulini yangilash muvaffaqiyatsiz tugadi");
      }
    } catch (error) {
      console.error("Error updating payment method:", error);
      alert("Xatolik yuz berdi");
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    if (!window.confirm("Haqiqatan ham ushbu to'lov usulini oʻchirmoqchimisiz?")) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_URL}/api/v1/payments/methods/${methodId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        await fetchPaymentMethods();
      } else {
        console.error("Failed to delete payment method");
        alert("To'lov usulini oʻchirish muvaffaqiyatsiz tugadi");
      }
    } catch (error) {
      console.error("Error deleting payment method:", error);
      alert("Xatolik yuz berdi");
    }
  };

  // Currency CRUD operations
  const handleAddCurrency = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const token = localStorage.getItem("access_token");
      const currencyData = {
        code: formData.get("code") as string,
        name: formData.get("name") as string,
        symbol: formData.get("symbol") as string,
        exchange_rate: parseFloat(formData.get("exchange_rate") as string),
        is_active: true,
      };

      const response = await fetch(
        `${API_URL}/api/v1/payments/currency/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(currencyData),
        }
      );

      if (response.ok) {
        await fetchCurrencies();
        setShowCurrencyModal(false);
      } else {
        console.error("Failed to add currency");
        alert("Valyuta qo'shish muvaffaqiyatsiz tugadi");
      }
    } catch (error) {
      console.error("Error adding currency:", error);
      alert("Xatolik yuz berdi");
    }
  };

  const handleUpdateCurrency = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCurrency) return;

    const formData = new FormData(e.currentTarget);

    try {
      const token = localStorage.getItem("access_token");
      const currencyData = {
        code: formData.get("code") as string,
        name: formData.get("name") as string,
        symbol: formData.get("symbol") as string,
        exchange_rate: parseFloat(formData.get("exchange_rate") as string),
        is_active: formData.get("is_active") === "true",
      };

      const response = await fetch(
        `${API_URL}/api/v1/payments/currency/${editingCurrency.id}/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(currencyData),
        }
      );

      if (response.ok) {
        await fetchCurrencies();
        setEditingCurrency(null);
      } else {
        console.error("Failed to update currency");
        alert("Valyutani yangilash muvaffaqiyatsiz tugadi");
      }
    } catch (error) {
      console.error("Error updating currency:", error);
      alert("Xatolik yuz berdi");
    }
  };

  const handleDeleteCurrency = async (currencyId: string) => {
    if (!window.confirm("Haqiqatan ham ushbu valyutani oʻchirmoqchimisiz?")) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_URL}/api/v1/payments/currency/${currencyId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        await fetchCurrencies();
      } else {
        console.error("Failed to delete currency");
        alert("Valyutani oʻchirish muvaffaqiyatsiz tugadi");
      }
    } catch (error) {
      console.error("Error deleting currency:", error);
      alert("Xatolik yuz berdi");
    }
  };

  // Stats calculations
  const totalPayments = payments.length;
  const activePayments = payments.filter(p => p.is_active).length;
  const totalMethods = paymentMethods.length;
  const activeMethods = paymentMethods.filter(m => m.is_active).length;
  const totalCurrencies = currencies.length;
  const activeCurrencies = currencies.filter(c => c.is_active).length;

  // Loading states
  if (
    (activeTab === "payments" && paymentsLoading) ||
    (activeTab === "methods" && methodsLoading) ||
    (activeTab === "currency" && currenciesLoading)
  ) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            To'lov Tizimi
          </h1>
          <p className="text-sm text-gray-600">
            To'lovlar, to'lov usullari va valyutalarni boshqaring
          </p>
        </div>
        <button
          onClick={() => {
            if (activeTab === "payments") setShowPaymentModal(true);
            if (activeTab === "methods") setShowMethodModal(true);
            if (activeTab === "currency") setShowCurrencyModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>
            {activeTab === "payments" && "To'lov qo'shish"}
            {activeTab === "methods" && "To'lov usuli qo'shish"}
            {activeTab === "currency" && "Valyuta qo'shish"}
          </span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab("payments")}
            className={clsx(
              "flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2",
              activeTab === "payments"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <CreditCard className="h-4 w-4" />
            <span>To'lovlar</span>
          </button>
          <button
            onClick={() => setActiveTab("methods")}
            className={clsx(
              "flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2",
              activeTab === "methods"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Wallet className="h-4 w-4" />
            <span>To'lov Usullari</span>
          </button>
          <button
            onClick={() => setActiveTab("currency")}
            className={clsx(
              "flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2",
              activeTab === "currency"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Coins className="h-4 w-4" />
            <span>Valyuta</span>
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === "payments" && (
        <>
          {/* Payments Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Jami to'lovlar
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {totalPayments}
                  </p>
                </div>
                <div className="bg-blue-500 p-3 rounded-lg">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Faol to'lovlar
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {activePayments}
                  </p>
                </div>
                <div className="bg-green-500 p-3 rounded-lg">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Nofaol to'lovlar
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {totalPayments - activePayments}
                  </p>
                </div>
                <div className="bg-gray-500 p-3 rounded-lg">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Payments Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="To'lovlarni qidirish..."
                value={paymentSearchTerm}
                onChange={(e) => setPaymentSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Payments List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
              <h3 className="text-lg font-semibold text-gray-900">
                To'lovlar Ro'yxati
              </h3>
            </div>

            <div>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={clsx(
                        "p-2 rounded-lg",
                        payment.is_active ? "bg-green-100" : "bg-gray-100"
                      )}>
                        <CreditCard className={clsx(
                          "h-5 w-5",
                          payment.is_active ? "text-green-600" : "text-gray-400"
                        )} />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 block">
                          {payment.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {payment.description}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={clsx(
                        "px-2 py-1 text-xs rounded-full",
                        payment.is_active 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      )}>
                        {payment.is_active ? "Faol" : "Nofaol"}
                      </span>
                      <button
                        onClick={() => setEditingPayment(payment)}
                        className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePayment(payment.id)}
                        className="text-red-600 hover:text-red-900 transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  {paymentSearchTerm
                    ? "Sizning qidiruvingizga mos to'lovlar topilmadi."
                    : "To'lovlar topilmadi. Birinchi to'lovni yaratishni boshlang."}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "methods" && (
        <>
          {/* Methods Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Jami to'lov usullari
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {totalMethods}
                  </p>
                </div>
                <div className="bg-blue-500 p-3 rounded-lg">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Faol to'lov usullari
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {activeMethods}
                  </p>
                </div>
                <div className="bg-green-500 p-3 rounded-lg">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Nofaol to'lov usullari
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {totalMethods - activeMethods}
                  </p>
                </div>
                <div className="bg-gray-500 p-3 rounded-lg">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Methods Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="To'lov usullarini qidirish..."
                value={methodSearchTerm}
                onChange={(e) => setMethodSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Methods List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
              <h3 className="text-lg font-semibold text-gray-900">
                To'lov Usullari
              </h3>
            </div>

            <div>
              {filteredMethods.length > 0 ? (
                filteredMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={clsx(
                        "p-2 rounded-lg",
                        method.is_active ? "bg-green-100" : "bg-gray-100"
                      )}>
                        <Wallet className={clsx(
                          "h-5 w-5",
                          method.is_active ? "text-green-600" : "text-gray-400"
                        )} />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 block">
                          {method.name}
                        </span>
                        <div className="text-sm text-gray-500 space-y-1">
                          <div>Turi: {method.type}</div>
                          {method.description && (
                            <div>{method.description}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={clsx(
                        "px-2 py-1 text-xs rounded-full",
                        method.is_active 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      )}>
                        {method.is_active ? "Faol" : "Nofaol"}
                      </span>
                      <button
                        onClick={() => setEditingMethod(method)}
                        className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMethod(method.id)}
                        className="text-red-600 hover:text-red-900 transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  {methodSearchTerm
                    ? "Sizning qidiruvingizga mos to'lov usullari topilmadi."
                    : "To'lov usullari topilmadi. Birinchi to'lov usulini yaratishni boshlang."}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "currency" && (
        <>
          {/* Currency Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Jami valyutalar
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {totalCurrencies}
                  </p>
                </div>
                <div className="bg-blue-500 p-3 rounded-lg">
                  <Coins className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Faol valyutalar
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {activeCurrencies}
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
                    Nofaol valyutalar
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {totalCurrencies - activeCurrencies}
                  </p>
                </div>
                <div className="bg-gray-500 p-3 rounded-lg">
                  <Coins className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Currency Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Valyutalarni qidirish..."
                value={currencySearchTerm}
                onChange={(e) => setCurrencySearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Currency List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Valyuta Ro'yxati
              </h3>
            </div>

            <div>
              {filteredCurrencies.length > 0 ? (
                filteredCurrencies.map((currency) => (
                  <div
                    key={currency.id}
                    className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={clsx(
                        "p-2 rounded-lg",
                        currency.is_active ? "bg-green-100" : "bg-gray-100"
                      )}>
                        <DollarSign className={clsx(
                          "h-5 w-5",
                          currency.is_active ? "text-green-600" : "text-gray-400"
                        )} />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 block">
                          {currency.name} ({currency.code})
                        </span>
                        <div className="text-sm text-gray-500 space-y-1">
                          <div>Belgi: {currency.symbol}</div>
                          <div>Kurs: {currency.exchange_rate}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={clsx(
                        "px-2 py-1 text-xs rounded-full",
                        currency.is_active 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      )}>
                        {currency.is_active ? "Faol" : "Nofaol"}
                      </span>
                      <button
                        onClick={() => setEditingCurrency(currency)}
                        className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCurrency(currency.id)}
                        className="text-red-600 hover:text-red-900 transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  {currencySearchTerm
                    ? "Sizning qidiruvingizga mos valyutalar topilmadi."
                    : "Valyutalar topilmadi. Birinchi valyutani yaratishni boshlang."}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Yangi to'lov qo'shish
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To'lov nomi *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="To'lov nomini kiriting"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tavsif
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="To'lov haqida qisqacha tavsif"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  To'lov qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                To'lovni tahrirlash
              </h3>
              <button
                onClick={() => setEditingPayment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdatePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To'lov nomi *
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingPayment.name}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tavsif
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingPayment.description || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Holati
                </label>
                <select
                  name="is_active"
                  defaultValue={editingPayment.is_active ? "true" : "false"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="true">Faol</option>
                  <option value="false">Nofaol</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Save className="h-4 w-4 inline mr-2" />
                  Yangilash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Payment Method Modal */}
      {showMethodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Yangi to'lov usuli qo'shish
              </h3>
              <button
                onClick={() => setShowMethodModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddMethod} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To'lov usuli nomi *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="To'lov usuli nomini kiriting"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To'lov turi *
                </label>
                <select
                  name="type"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Turi tanlang</option>
                  <option value="cash">Naqd</option>
                  <option value="card">Karta</option>
                  <option value="transfer">O'tkazma</option>
                  <option value="digital">Raqamli</option>
                  <option value="other">Boshqa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tavsif
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="To'lov usuli haqida qisqacha tavsif"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMethodModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  To'lov usuli qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingMethod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-xl mx-4 max-h-[80vh] overflow-y-auto" style={{marginTop:"50px"}}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                To'lov usulini tahrirlash
              </h3>
              <button
                onClick={() => setEditingMethod(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateMethod} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To'lov usuli nomi *
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingMethod.name}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To'lov turi *
                </label>
                <select
                  name="type"
                  defaultValue={editingMethod.type}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Naqd</option>
                  <option value="card">Karta</option>
                  <option value="transfer">O'tkazma</option>
                  <option value="digital">Raqamli</option>
                  <option value="other">Boshqa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tavsif
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingMethod.description || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Holati
                </label>
                <select
                  name="is_active"
                  defaultValue={editingMethod.is_active ? "true" : "false"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="true">Faol</option>
                  <option value="false">Nofaol</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingMethod(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Save className="h-4 w-4 inline mr-2" />
                  Yangilash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Currency Modal */}
      {showCurrencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Yangi valyuta qo'shish
              </h3>
              <button
                onClick={() => setShowCurrencyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddCurrency} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valyuta kodi *
                </label>
                <input
                  type="text"
                  name="code"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masalan: USD"
                  maxLength={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valyuta nomi *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masalan: AQSH dollari"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valyuta belgisi *
                </label>
                <input
                  type="text"
                  name="symbol"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masalan: $"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ayirboshlash kursi *
                </label>
                <input
                  type="number"
                  name="exchange_rate"
                  required
                  step="0.0001"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masalan: 1.0"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCurrencyModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Valyuta qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingCurrency && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-xl mx-4 max-h-[80vh] overflow-y-auto" style={{marginTop:"50px"}}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Valyutani tahrirlash
              </h3>
              <button
                onClick={() => setEditingCurrency(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateCurrency} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valyuta kodi *
                </label>
                <input
                  type="text"
                  name="code"
                  defaultValue={editingCurrency.code}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valyuta nomi *
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingCurrency.name}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valyuta belgisi *
                </label>
                <input
                  type="text"
                  name="symbol"
                  defaultValue={editingCurrency.symbol}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ayirboshlash kursi *
                </label>
                <input
                  type="number"
                  name="exchange_rate"
                  defaultValue={editingCurrency.exchange_rate}
                  required
                  step="0.0001"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Holati
                </label>
                <select
                  name="is_active"
                  defaultValue={editingCurrency.is_active ? "true" : "false"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="true">Faol</option>
                  <option value="false">Nofaol</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingCurrency(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Save className="h-4 w-4 inline mr-2" />
                  Yangilash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}