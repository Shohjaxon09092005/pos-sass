import React, { useState, useEffect } from "react";
import { Customer } from "../types";
import {
  Plus,
  Search,
  User,
  Mail,
  Phone,
  Star,
  Gift,
  X,
  Eye,
  Edit,
  Trash2,
  Upload,
  ShoppingBag,
  CreditCard,
  Calendar,
  DollarSign,
  Package,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

// API base URL
const API_URL = import.meta.env.VITE_API_URL;

interface ApiCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address_1: string;
  address_2: string;
  is_blacklisted: boolean;
  is_customer: boolean;
  is_supplier: boolean;
  image: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface Sale {
  id: string;
  amount_total: string;
  amount_paid: string;
  amount_due: string;
  customer: string;
  created_at: string;
  items: SaleItem[];
  session?: string;
  register?: string;
  notes?: string;
}

interface SaleItem {
  id: string;
  product: string;
  quantity: string;
  product_details?: Product;
}

interface Product {
  id: string;
  title: string;
  price: string;
  image?: string;
  sku?: string;
}

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address_1: string;
  address_2: string;
  is_blacklisted: boolean;
  is_customer: boolean;
  is_supplier: boolean;
  notes: string;
}

interface CustomerStats {
  totalSpent: number;
  totalDue: number;
  totalTransactions: number;
  lastPurchase: Date | null;
  totalProducts: number;
}

export default function CustomersPage() {
  const { t } = useTranslation('customers');
  const { company } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerStats>({
    totalSpent: 0,
    totalDue: 0,
    totalTransactions: 0,
    lastPurchase: null,
    totalProducts: 0,
  });
  const [loadingSales, setLoadingSales] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    email: "",
    phone: "",
    address_1: "",
    address_2: "",
    is_blacklisted: false,
    is_customer: true,
    is_supplier: false,
    notes: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Rasmni o'zgartirish funksiyasi
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Fayl hajmini tekshirish (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(t('customers.errors.imageTooLarge'));
        return;
      }

      // Rasm formatini tekshirish
      if (!file.type.startsWith('image/')) {
        setError(t('customers.errors.invalidImageFormat'));
        return;
      }

      setImageFile(file);
      
      // Preview yaratish
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  // Rasmni o'chirish
  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    // Input qiymatini ham tozalash
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      const response = await fetch(`${API_URL}/api/v1/partners/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch customers: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Transform API data to match Customer type
      const transformedCustomers: Customer[] = data.results
        .filter((customer: ApiCustomer) => customer.is_customer)
        .map((customer: ApiCustomer) => ({
          id: customer.id,
          companyId: company?.id?.toString() || "",
          name: customer.name,
          email: customer.email || undefined,
          phone: customer.phone || undefined,
          address:
            [customer.address_1, customer.address_2]
              .filter(Boolean)
              .join(", ") || undefined,
          loyaltyPoints: 0,
          totalSpent: 0,
          lastVisit: undefined,
          createdAt: new Date(customer.created_at),
          image: customer.image || undefined,
        }));

      setCustomers(transformedCustomers);
      setError(null);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError(
        `Failed to load customers: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch products for product details
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/v1/products/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.results);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  // Fetch customer sales data with product details
  const fetchCustomerSales = async (customerId: string) => {
    try {
      setLoadingSales(true);
      const token = localStorage.getItem("access_token");

      // Fetch sales data
      const salesResponse = await fetch(`${API_URL}/api/v1/pos/sales/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!salesResponse.ok) {
        throw new Error(`Failed to fetch sales data`);
      }

      const salesData = await salesResponse.json();

      // Filter sales by customer ID
      const customerSalesData = salesData.results.filter(
        (sale: Sale) => sale.customer === customerId
      );

      // Enrich sales items with product details
      const enrichedSales = await Promise.all(
        customerSalesData.map(async (sale: Sale) => {
          const enrichedItems = await Promise.all(
            sale.items.map(async (item: SaleItem) => {
              try {
                const productResponse = await fetch(
                  `${API_URL}/api/v1/products/${item.product}/`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                  }
                );

                if (productResponse.ok) {
                  const productData = await productResponse.json();
                  return {
                    ...item,
                    product_details: {
                      id: productData.id,
                      title: productData.title,
                      price: productData.price,
                      image: productData.image,
                      sku: productData.sku,
                    },
                  };
                }
              } catch (err) {
                console.error("Error fetching product details:", err);
              }

              return item;
            })
          );

          return {
            ...sale,
            items: enrichedItems,
          };
        })
      );

      setCustomerSales(enrichedSales);

      // Calculate comprehensive customer statistics
      let totalSpent = 0;
      let totalDue = 0;
      let totalTransactions = enrichedSales.length;
      let lastPurchase: Date | null = null;
      let totalProducts = 0;

      enrichedSales.forEach((sale: Sale) => {
        totalSpent += parseFloat(sale.amount_paid);
        totalDue += parseFloat(sale.amount_due);
        totalProducts += sale.items.length;

        const saleDate = new Date(sale.created_at);
        if (!lastPurchase || saleDate > lastPurchase) {
          lastPurchase = saleDate;
        }
      });

      const stats: CustomerStats = {
        totalSpent,
        totalDue,
        totalTransactions,
        lastPurchase,
        totalProducts,
      };

      setCustomerStats(stats);

      // Update customer data with calculated stats
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === customerId
            ? {
                ...customer,
                totalSpent: stats.totalSpent,
                loyaltyPoints: Math.floor(stats.totalSpent / 10),
                lastVisit: stats.lastPurchase || undefined,
              }
            : customer
        )
      );
    } catch (err) {
      console.error("Error fetching customer sales:", err);
      setError(
        `${t('customers.errors.failedToLoadSales')}: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  // Handle customer detail view
  const handleCustomerDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
    fetchCustomerSales(customer.id);
  };

  // Create new customer - FormData bilan
  const createCustomer = async (customerData: CustomerFormData) => {
    try {
      const token = localStorage.getItem("access_token");

      // FormData yaratish
      const formDataToSend = new FormData();
      
      // Text ma'lumotlarni qo'shish
      formDataToSend.append('name', customerData.name);
      formDataToSend.append('email', customerData.email);
      formDataToSend.append('phone', customerData.phone);
      formDataToSend.append('address_1', customerData.address_1);
      formDataToSend.append('address_2', customerData.address_2);
      formDataToSend.append('is_blacklisted', customerData.is_blacklisted.toString());
      formDataToSend.append('is_customer', customerData.is_customer.toString());
      formDataToSend.append('is_supplier', customerData.is_supplier.toString());
      formDataToSend.append('notes', customerData.notes);

      // Rasmni qo'shish agar mavjud bo'lsa
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const response = await fetch(`${API_URL}/api/v1/partners/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Content-Type ni FormData uchun bermaymiz, browser avtomatik qo'shadi
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          `Failed to create customer: ${response.status} ${JSON.stringify(
            errorData
          )}`
        );
      }

      await fetchCustomers();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error("Error creating customer:", err);
      setError(
        `Failed to create customer: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  // Update customer - FormData bilan
  const updateCustomer = async (
    customerId: string,
    customerData: CustomerFormData
  ) => {
    try {
      const token = localStorage.getItem("access_token");

      // FormData yaratish
      const formDataToSend = new FormData();
      
      // Text ma'lumotlarni qo'shish
      formDataToSend.append('name', customerData.name);
      formDataToSend.append('email', customerData.email);
      formDataToSend.append('phone', customerData.phone);
      formDataToSend.append('address_1', customerData.address_1);
      formDataToSend.append('address_2', customerData.address_2);
      formDataToSend.append('is_blacklisted', customerData.is_blacklisted.toString());
      formDataToSend.append('is_customer', customerData.is_customer.toString());
      formDataToSend.append('is_supplier', customerData.is_supplier.toString());
      formDataToSend.append('notes', customerData.notes);

      // Rasmni qo'shish agar mavjud bo'lsa
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const response = await fetch(
        `${API_URL}/api/v1/partners/${customerId}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            // Content-Type ni FormData uchun bermaymiz
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          `Failed to update customer: ${response.status} ${JSON.stringify(
            errorData
          )}`
        );
      }

      await fetchCustomers();
      setShowEditModal(false);
      resetForm();
    } catch (err) {
      console.error("Error updating customer:", err);
      setError(
        `${t('customers.errors.failedToUpdate')}: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  // Delete customer
  const deleteCustomer = async (customerId: string) => {
    if (!window.confirm(t('customers.errors.deleteConfirmation'))) {
      return;
    }

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_URL}/api/v1/partners/${customerId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete customer: ${response.status}`);
      }

      await fetchCustomers();
    } catch (err) {
      console.error("Error deleting customer:", err);
      setError(
        `${t('customers.errors.failedToDelete')}: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address_1: "",
      address_2: "",
      is_blacklisted: false,
      is_customer: true,
      is_supplier: false,
      notes: "",
    });
    setImagePreview(null);
    setImageFile(null);
    setError(null);
    
    // File inputni ham tozalash
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (showEditModal && selectedCustomer) {
        await updateCustomer(selectedCustomer.id, formData);
      } else {
        await createCustomer(formData);
      }
    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  const handleEditClick = (customer: Customer) => {
    const originalCustomer = customers.find((c) => c.id === customer.id);
    if (originalCustomer) {
      setFormData({
        name: customer.name,
        email: customer.email || "",
        phone: customer.phone || "",
        address_1: customer.address?.split(", ")[0] || "",
        address_2: customer.address?.split(", ")[1] || "",
        is_blacklisted: false,
        is_customer: true,
        is_supplier: false,
        notes: "",
      });
      setImagePreview(customer.image || null);
      setImageFile(null);
      setSelectedCustomer(customer);
      setShowEditModal(true);
      
      // File inputni tozalash
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
  );

  const totalCustomers = customers.length;
  const totalLoyaltyPoints = customers.reduce(
    (sum, c) => sum + c.loyaltyPoints,
    0
  );
  const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgSpentPerCustomer =
    totalCustomers > 0 ? totalSpent / totalCustomers : 0;

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
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('customers.title')}</h1>
          <p className="text-sm text-gray-600">
            {t('customers.subtitle')}
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>{t('customers.addCustomer')}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="text-red-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stats */} 
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t('customers.stats.totalCustomers')}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {totalCustomers}
              </p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <User className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('customers.stats.totalRevenue')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {totalSpent.toFixed(2)} UZS
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <Gift className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('customers.stats.avgSpent')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {avgSpentPerCustomer.toFixed(2)} UZS
              </p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Star className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t('customers.stats.loyaltyPoints')}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {totalLoyaltyPoints}
              </p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <Star className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder={t('customers.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('customers.noCustomers')}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm
              ? t('customers.adjustSearch')
              : t('customers.getStarted')}
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            {t('customers.addCustomer')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4 mb-4">
                {customer.image ? (
                  <img
                    src={customer.image}
                    alt={customer.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {customer.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t('customers.customer.memberSince')} {format(customer.createdAt, "MMM yyyy")}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {customer.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}

                {customer.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{customer.phone}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">
                      {customer.totalSpent.toFixed(2)} UZS
                    </p>
                    <p className="text-xs text-gray-500">{t('customers.customer.totalSpent')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">
                      {customer.loyaltyPoints}
                    </p>
                    <p className="text-xs text-gray-500">{t('customers.customer.points')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">
                      {customer.lastVisit
                        ? format(customer.lastVisit, "MMM dd")
                        : "Never"}
                    </p>
                    <p className="text-xs text-gray-500">{t('customers.customer.lastVisit')}</p>
                  </div>
                </div>

                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => handleCustomerDetail(customer)}
                    className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t('customers.customer.view')}
                  </button>
                  <button
                    onClick={() => handleEditClick(customer)}
                    className="flex-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {t('customers.customer.edit')}
                  </button>
                  <button
                    onClick={() => deleteCustomer(customer.id)}
                    className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t('customers.customer.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

       {/* Customer Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto" style={{marginTop:"50px"}}>
            {/* Modal Header */}
            <div className="flex-shrink-0 p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {t('customers.details.title')} - {selectedCustomer.name}
                </h3>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedCustomer(null);
                    setCustomerSales([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Customer Info */}
              <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
                {selectedCustomer.image ? (
                  <img
                    src={selectedCustomer.image}
                    alt={selectedCustomer.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">
                    {selectedCustomer.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {t('customers.customer.memberSince')}{" "}
                    {format(selectedCustomer.createdAt, "MMMM yyyy")}
                  </p>
                </div>
              </div>

              {/* Customer Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-blue-600">
                        {t('customers.details.totalSpent')}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {customerStats.totalSpent.toFixed(2)} UZS
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CreditCard className="h-8 w-8 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-orange-600">
                        {t('customers.details.currentDue')}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(customerStats.totalDue || 0).toFixed(2)} UZS
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <ShoppingBag className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-600">
                        {t('customers.details.transactions')}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {customerStats.totalTransactions}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Package className="h-8 w-8 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-purple-600">
                        {t('customers.details.products')}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {customerStats.totalProducts}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-indigo-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-indigo-600">
                        {t('customers.details.lastPurchase')}
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {customerStats.lastPurchase
                          ? format(customerStats.lastPurchase, "MMM dd, yyyy")
                          : t('customers.customer.never')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      {t('customers.details.email')}
                    </label>
                    <p className="text-gray-900">
                      {selectedCustomer.email || t('customers.details.notProvided')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      {t('customers.details.phone')}
                    </label>
                    <p className="text-gray-900">
                      {selectedCustomer.phone || t('customers.details.notProvided')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      {t('customers.details.address')}
                    </label>
                    <p className="text-gray-900">
                      {selectedCustomer.address || t('customers.details.notProvided')}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      {t('customers.details.loyaltyPoints')}
                    </label>
                    <p className="text-xl font-semibold text-blue-600">
                      {selectedCustomer.loyaltyPoints}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('customers.details.earnedFromPurchases')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      {t('customers.details.customerSince')}
                    </label>
                    <p className="text-gray-900">
                      {format(selectedCustomer.createdAt, "MMMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Transactions with Product Details */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {t('customers.details.purchaseHistory')}
                  </h4>
                  <span className="text-sm text-gray-500">
                    {customerSales.length} {t('customers.details.transactionsCount')}
                  </span>
                </div>

                {loadingSales ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : customerSales.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">{t('customers.details.noPurchaseHistory')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customerSales.map((sale) => (
                      <div
                        key={sale.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {t('customers.details.sale')} #{sale.id.slice(0, 8)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(
                                new Date(sale.created_at),
                                "MMM dd, yyyy HH:mm"
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {(parseFloat(sale.amount_total) || 0).toFixed(2)} UZS
                            </p>
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="text-green-600">
                                {t('customers.details.paid')}: {(parseFloat(sale.amount_paid) || 0).toFixed(2)} UZS
                              </span>
                              {parseFloat(sale.amount_due) > 0 && (
                                <span className="text-orange-600">
                                  {t('customers.details.due')}: {(parseFloat(sale.amount_due) || 0).toFixed(2)} UZS
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Products in this sale */}
                        <div className="border-t border-gray-200 pt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            {t('customers.details.productsPurchased')}:
                          </p>
                          <div className="space-y-2">
                            {sale.items.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-white p-2 rounded"
                              >
                                <div className="flex items-center space-x-3">
                                  {item.product_details?.image ? (
                                    <img
                                      src={item.product_details.image}
                                      alt={item.product_details.title}
                                      className="h-8 w-8 rounded object-cover"
                                    />
                                  ) : (
                                    <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                                      <Package className="h-4 w-4 text-gray-400" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {item.product_details?.title ||
                                        t('customers.details.unknownProduct')}
                                    </p>
                                    {item.product_details?.sku && (
                                      <p className="text-xs text-gray-500">
                                        SKU: {item.product_details.sku}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900">
                                    {item.quantity} x
                                    {item.product_details
                                      ? parseFloat(
                                          item.product_details.price
                                        ).toFixed(2)
                                      : "0.00"} UZS
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    
                                    {(
                                      parseFloat(item.quantity) *
                                      (item.product_details
                                        ? parseFloat(item.product_details.price)
                                        : 0)
                                    ).toFixed(2)} UZS
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-white">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedCustomer(null);
                    setCustomerSales([]);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('customers.details.close')}
                </button>
                <button
                  onClick={() => handleEditClick(selectedCustomer)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {t('customers.details.editCustomer')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto" style={{marginTop:"50px"}}>
            {/* Modal Header */}
            <div className="flex-shrink-0 p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {showEditModal ? t('customers.form.editTitle') : t('customers.form.addTitle')}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('customers.form.profileImage')}
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                      {imagePreview ? (
                        <>
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <Upload className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {t('customers.form.uploadHint')}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customers.form.fullName')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('customers.form.fullNamePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customers.form.email')}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('customers.form.emailPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customers.form.phone')}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('customers.form.phonePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customers.form.address1')}
                  </label>
                  <input
                    type="text"
                    value={formData.address_1}
                    onChange={(e) =>
                      setFormData({ ...formData, address_1: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('customers.form.address1Placeholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customers.form.address2')}
                  </label>
                  <input
                    type="text"
                    value={formData.address_2}
                    onChange={(e) =>
                      setFormData({ ...formData, address_2: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('customers.form.address2Placeholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customers.form.notes')}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('customers.form.notesPlaceholder')}
                  />
                </div>
              </form>
            </div>

            {/* Fixed Footer */}
            <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-white">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('customers.form.cancel')}
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {showEditModal ? t('customers.form.update') : t('customers.form.add')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}