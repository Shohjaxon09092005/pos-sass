import React, { useState, useEffect } from "react";
import {
  Truck,
  Plus,
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  X,
  Building,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  UserPlus,
  List,
  Users,
} from "lucide-react";
import { format, parseISO } from "date-fns";

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Types based on API response
interface PurchaseItem {
  id: string;
  is_active: boolean;
  notes: string;
  deleted_at: string | null;
  quantity: number;
  cost_price: string;
  company: number;
  created_by: number;
  updated_by: number;
  deleted_by: number;
  purchase: string;
  product: string;
}

interface Purchase {
  id: string;
  items: PurchaseItem[];
  is_active: boolean;
  notes: string;
  deleted_at: string | null;
  amount_paid: string;
  company: number;
  created_by: number;
  updated_by: number;
  deleted_by: number;
  supplier: string;
  created_at?: string;
  updated_at?: string;
}

interface PurchasesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Purchase[];
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

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address_1: string;
  address_2: string;
  created_at: string;
  updated_at: string;
  is_blacklisted: boolean;
  is_customer: boolean;
  is_supplier: boolean;
  image: string;
  notes: string;
}

interface SuppliersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Supplier[];
}

interface Category {
  id: string;
  title: string;
  parent: string | null;
}

interface CategoriesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Category[];
}

interface Unit {
  id: string;
  title: string;
  abbreviation: string;
}

interface UnitsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Unit[];
}

interface PurchaseOrderFormData {
  supplier: string;
  items: {
    product: string;
    quantity: number;
    cost_price: string;
    notes?: string;
  }[];
  scheduled_date?: string;
}

interface SupplierFormData {
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
}

type TabType = "purchase-orders" | "manage-suppliers";

export default function PurchasesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("purchase-orders");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );
  const [showPurchaseDetail, setShowPurchaseDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [purchaseItems, setPurchaseItems] = useState([
    { product: "", quantity: 1, cost_price: "0.00", notes: "" },
  ]);

  // Supplier management states
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierFormData, setSupplierFormData] = useState<SupplierFormData>({
    name: "",
    email: "",
    phone: "",
    address_1: "",
    address_2: "",
    is_blacklisted: false,
    is_customer: false,
    is_supplier: true,
    image: null,
    notes: "",
  });

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("access_token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Fetch all data in parallel
      const [
        purchasesResponse,
        productsResponse,
        suppliersResponse,
        categoriesResponse,
        unitsResponse,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/purchases/`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/products/`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/partners/`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/products/categories/`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/products/units/`, { headers }),
      ]);

      if (!purchasesResponse.ok || !suppliersResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const purchasesData: PurchasesResponse = await purchasesResponse.json();
      const productsData: ProductsResponse = await productsResponse.json();
      const suppliersData: SuppliersResponse = await suppliersResponse.json();
      const categoriesData: CategoriesResponse =
        await categoriesResponse.json();
      const unitsData: UnitsResponse = await unitsResponse.json();

      setPurchases(purchasesData.results);
      setProducts(productsData.results);
      // Filter only suppliers (is_supplier: true)
      const supplierList = suppliersData.results.filter(
        (supplier) => supplier.is_supplier
      );
      setSuppliers(supplierList);
      setCategories(categoriesData.results);
      setUnits(unitsData.results);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load purchases data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Add new item to purchase order
  const addPurchaseItem = () => {
    setPurchaseItems([
      ...purchaseItems,
      { product: "", quantity: 1, cost_price: "0.00", notes: "" },
    ]);
  };

  // Remove item from purchase order
  const removePurchaseItem = (index: number) => {
    if (purchaseItems.length > 1) {
      const newItems = purchaseItems.filter((_, i) => i !== index);
      setPurchaseItems(newItems);
    }
  };

  // Update purchase item
  const updatePurchaseItem = (index: number, field: string, value: any) => {
    const newItems = purchaseItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setPurchaseItems(newItems);
  };

  // Calculate total amount
  const calculateTotalAmount = () => {
    return purchaseItems.reduce((total, item) => {
      const quantity = parseInt(item.quantity.toString()) || 0;
      const costPrice = parseFloat(item.cost_price) || 0;
      return total + quantity * costPrice;
    }, 0);
  };

  // Calculate item total
  const calculateItemTotal = (item: (typeof purchaseItems)[0]) => {
    const quantity = parseInt(item.quantity.toString()) || 0;
    const costPrice = parseFloat(item.cost_price) || 0;
    return (quantity * costPrice).toFixed(2);
  };

  // Create new purchase order
  const createPurchaseOrder = async (purchaseData: PurchaseOrderFormData) => {
    try {
      const token = localStorage.getItem("access_token");

      // Normalize supplier to a plain UUID string per API schema
      let supplierId = purchaseData.supplier as unknown as string;
      try {
        // Handle accidental JSON-stringified or array-wrapped values
        if (typeof supplierId === "string" && supplierId.startsWith("[")) {
          const parsed = JSON.parse(supplierId);
          if (Array.isArray(parsed) && parsed.length > 0)
            supplierId = String(parsed[0]);
        } else if (
          typeof supplierId === "string" &&
          supplierId.startsWith("{")
        ) {
          const parsed = JSON.parse(supplierId);
          if (parsed?.id) supplierId = String(parsed.id);
        }
      } catch {}

      // Coerce scheduled_date to ISO datetime (backend expects date-time)
      const sched = purchaseData.scheduled_date
        ? new Date(purchaseData.scheduled_date).toISOString()
        : new Date().toISOString();

      // Prepare the data according to API requirements
      const requestData = {
        supplier: supplierId,
        items: purchaseData.items.map((item) => ({
          product: String(item.product),
          quantity: parseInt(item.quantity.toString(), 10) || 0,
          cost_price: String(item.cost_price ?? "0"),
          notes: item.notes || "",
        })),
        scheduled_date: sched,
      };

      console.log("Sending purchase order data:", requestData);

      const response = await fetch(`${API_BASE_URL}/api/v1/purchases/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", errorText);
        throw new Error(
          `Failed to create purchase order: ${response.status} ${response.statusText}`
        );
      }

      const newPurchase = await response.json();
      setPurchases((prev) => [newPurchase, ...prev]);
      setShowPOModal(false);
      setPurchaseItems([
        { product: "", quantity: 1, cost_price: "0.00", notes: "" },
      ]);
      return newPurchase;
    } catch (err) {
      console.error("Error creating purchase order:", err);
      alert(
        "Failed to create purchase order. Please check the data and try again."
      );
    }
  };

  // Supplier Management Functions
  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE_URL}/api/v1/partners/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch suppliers");
      }

      const data: SuppliersResponse = await response.json();
      const supplierList = data.results.filter(
        (supplier) => supplier.is_supplier
      );
      setSuppliers(supplierList);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      alert("Failed to load suppliers");
    }
  };

  const createSupplier = async (formData: SupplierFormData) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE_URL}/api/v1/partners/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create supplier: ${errorText}`);
      }

      const newSupplier = await response.json();
      setSuppliers((prev) => [newSupplier, ...prev]);
      setShowAddSupplierModal(false);
      resetSupplierForm();
      alert("Supplier created successfully!");
    } catch (err) {
      console.error("Error creating supplier:", err);
      alert("Failed to create supplier. Please check the data and try again.");
    }
  };

  const updateSupplier = async (id: string, formData: SupplierFormData) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE_URL}/api/v1/partners/${id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update supplier: ${errorText}`);
      }

      const updatedSupplier = await response.json();
      setSuppliers((prev) =>
        prev.map((s) => (s.id === id ? updatedSupplier : s))
      );
      setEditingSupplier(null);
      resetSupplierForm();
      alert("Supplier updated successfully!");
    } catch (err) {
      console.error("Error updating supplier:", err);
      alert("Failed to update supplier. Please check the data and try again.");
    }
  };

  const deleteSupplier = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE_URL}/api/v1/partners/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete supplier");
      }

      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      alert("Supplier deleted successfully!");
    } catch (err) {
      console.error("Error deleting supplier:", err);
      alert("Failed to delete supplier");
    }
  };

  const resetSupplierForm = () => {
    setSupplierFormData({
      name: "",
      email: "",
      phone: "",
      address_1: "",
      address_2: "",
      is_blacklisted: false,
      is_customer: false,
      is_supplier: true,
      image: null,
      notes: "",
    });
    setEditingSupplier(null);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierFormData({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address_1: supplier.address_1,
      address_2: supplier.address_2,
      is_blacklisted: supplier.is_blacklisted,
      is_customer: supplier.is_customer,
      is_supplier: supplier.is_supplier,
      image: supplier.image,
      notes: supplier.notes,
    });
    setShowAddSupplierModal(true);
  };

  const handleSubmitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, supplierFormData);
    } else {
      await createSupplier(supplierFormData);
    }
  };

  // Helper functions
  const getProductDetails = (productId: string) => {
    return products.find((p) => p.id === productId) || null;
  };

  const getProductName = (productId: string) => {
    const product = getProductDetails(productId);
    return product ? product.title : `Product (${productId.slice(0, 8)}...)`;
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    return supplier ? supplier.name : `Supplier (${supplierId.slice(0, 8)}...)`;
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? "Active" : "Inactive";
  };

  // Calculate purchase total
  const getPurchaseTotal = (purchase: Purchase) => {
    return purchase.items.reduce((sum, item) => {
      const quantity = Math.abs(item.quantity);
      const costPrice = parseFloat(item.cost_price) || 0;
      return sum + quantity * costPrice;
    }, 0);
  };

  // Calculate statistics
  const activePurchases = purchases.filter((p) => p.is_active);
  const totalThisMonth = purchases.reduce(
    (sum, purchase) => sum + getPurchaseTotal(purchase),
    0
  );
  const pendingPurchases = purchases.filter(
    (p) => parseFloat(p.amount_paid || "0") < getPurchaseTotal(p)
  );
  const totalPending = pendingPurchases.reduce((sum, purchase) => {
    const total = getPurchaseTotal(purchase);
    const paid = parseFloat(purchase.amount_paid || "0");
    return sum + (total - paid);
  }, 0);

  // Filter purchases based on search and status
  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      searchTerm === "" ||
      getSupplierName(purchase.supplier)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      purchase.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && purchase.is_active) ||
      (statusFilter === "inactive" && !purchase.is_active);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <button
            onClick={fetchData}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
          >
            Try Again
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
          <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
          <p className="text-sm text-gray-600">
            Manage suppliers and purchase orders
          </p>
        </div>
        <div className="flex space-x-3">
          {activeTab === "purchase-orders" && (
            <button
              onClick={() => setShowPOModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>New Purchase Order</span>
            </button>
          )}
          {activeTab === "manage-suppliers" && (
            <button
              onClick={() => {
                resetSupplierForm();
                setShowAddSupplierModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <UserPlus className="h-5 w-5" />
              <span>Add Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("purchase-orders")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === "purchase-orders"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <List className="h-5 w-5" />
              <span>Purchase Orders</span>
            </button>
            <button
              onClick={() => setActiveTab("manage-suppliers")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === "manage-suppliers"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Manage Suppliers</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Purchase Orders Tab Content */}
          {activeTab === "purchase-orders" && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Suppliers
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {suppliers.length}
                      </p>
                    </div>
                    <div className="bg-blue-500 p-3 rounded-lg">
                      <Truck className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Pending Payments
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {pendingPurchases.length}
                      </p>
                    </div>
                    <div className="bg-orange-500 p-3 rounded-lg">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Pending Value
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {totalPending.toFixed(2)} UZS
                      </p>
                    </div>
                    <div className="bg-yellow-500 p-3 rounded-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Purchases
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {totalThisMonth.toFixed(2)} UZS
                      </p>
                    </div>
                    <div className="bg-green-500 p-3 rounded-lg">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        placeholder="Search by supplier or purchase ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Purchase Orders Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Purchase Orders
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Purchase ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Supplier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredPurchases.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {purchase.id.slice(0, 8)}...
                            </div>
                            {purchase.created_at && (
                              <div className="text-sm text-gray-500">
                                {format(
                                  parseISO(purchase.created_at),
                                  "MMM dd, yyyy"
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {getSupplierName(purchase.supplier)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {purchase.items.length} items
                            </div>
                            <div className="text-sm text-gray-500">
                              {purchase.items.reduce(
                                (sum, item) => sum + Math.abs(item.quantity),
                                0
                              )}{" "}
                              qty
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {getPurchaseTotal(purchase).toFixed(2)} UZS
                            </div>
                            {parseFloat(purchase.amount_paid || "0") > 0 && (
                              <div className="text-xs text-gray-500">
                                Paid: {(parseFloat(purchase.amount_paid) || 0).toFixed(2)} UZS
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                purchase.is_active
                              )}`}
                            >
                              {getStatusText(purchase.is_active)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedPurchase(purchase);
                                setShowPurchaseDetail(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Manage Suppliers Tab Content */}
          {activeTab === "manage-suppliers" && (
            <div className="space-y-6">
              {/* Suppliers Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Suppliers
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {suppliers.length}
                      </p>
                    </div>
                    <div className="bg-blue-500 p-3 rounded-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Active Suppliers
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {
                          suppliers.filter(
                            (s) => s.is_supplier && !s.is_blacklisted
                          ).length
                        }
                      </p>
                    </div>
                    <div className="bg-green-500 p-3 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Blacklisted
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {suppliers.filter((s) => s.is_blacklisted).length}
                      </p>
                    </div>
                    <div className="bg-red-500 p-3 rounded-lg">
                      <X className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Suppliers Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    All Suppliers
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Supplier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {suppliers.map((supplier) => (
                        <tr key={supplier.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                                <Building className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {supplier.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {supplier.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {supplier.phone || "No phone"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {supplier.address_1 || "No address"}
                              {supplier.address_2 && `, ${supplier.address_2}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  supplier.is_supplier
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {supplier.is_supplier ? "Active" : "Inactive"}
                              </span>
                              {supplier.is_blacklisted && (
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                  Blacklisted
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleEditSupplier(supplier)}
                                className="text-blue-600 hover:text-blue-900 transition-colors flex items-center space-x-1"
                              >
                                <Edit className="h-4 w-4" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() =>
                                  deleteSupplier(supplier.id, supplier.name)
                                }
                                className="text-red-600 hover:text-red-900 transition-colors flex items-center space-x-1"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Purchase Order Modal */}
      {showPOModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto"
            style={{ marginTop: "50px" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Create Purchase Order
              </h3>
              <button
                onClick={() => {
                  setShowPOModal(false);
                  setPurchaseItems([
                    { product: "", quantity: 1, cost_price: "0.00", notes: "" },
                  ]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);

                const supplierRaw = formData.get("supplier");
                const purchaseData: PurchaseOrderFormData = {
                  supplier: (supplierRaw ?? "") as string,
                  items: purchaseItems,
                  scheduled_date:
                    (formData.get("expectedDate") as string) ||
                    new Date().toISOString(),
                };

                await createPurchaseOrder(purchaseData);
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier *
                  </label>
                  <select
                    name="supplier"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    name="expectedDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Order Items
                  </h4>
                  <button
                    type="button"
                    onClick={addPurchaseItem}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                  >
                    Add Item
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Unit Cost (UZS)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total (UZS)
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {purchaseItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <select
                              value={item.product}
                              onChange={(e) =>
                                updatePurchaseItem(
                                  index,
                                  "product",
                                  e.target.value
                                )
                              }
                              required
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="">Select Product</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.title} - 
                                  {parseFloat(product.cost).toFixed(2)} UZS
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updatePurchaseItem(
                                  index,
                                  "quantity",
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              required
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.cost_price}
                              onChange={(e) =>
                                updatePurchaseItem(
                                  index,
                                  "cost_price",
                                  e.target.value
                                )
                              }
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                              required
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold">
                              {calculateItemTotal(item)} UZS
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {purchaseItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePurchaseItem(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    Total Amount:
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {calculateTotalAmount().toFixed(2)} UZS
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes for this purchase order..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPOModal(false);
                    setPurchaseItems([
                      {
                        product: "",
                        quantity: 1,
                        cost_price: "0.00",
                        notes: "",
                      },
                    ]);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Detail Modal */}
      {showPurchaseDetail && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" style={{marginTop:"50px"}}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Purchase Details
              </h3>
              <button
                onClick={() => {
                  setShowPurchaseDetail(false);
                  setSelectedPurchase(null);
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
                    Purchase ID
                  </label>
                  <p className="text-lg font-mono text-gray-900">
                    {selectedPurchase.id}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Supplier
                  </label>
                  <p className="text-gray-900">
                    {getSupplierName(selectedPurchase.supplier)}
                  </p>
                </div>
                {selectedPurchase.created_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Created Date
                    </label>
                    <p className="text-gray-900">
                      {format(
                        parseISO(selectedPurchase.created_at),
                        "MMM dd, yyyy HH:mm"
                      )}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      selectedPurchase.is_active
                    )}`}
                  >
                    {getStatusText(selectedPurchase.is_active)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Total Amount
                  </label>
                  <p className="text-2xl font-bold text-green-600">
                    {getPurchaseTotal(selectedPurchase).toFixed(2)} UZS
                  </p>
                </div>
                {parseFloat(selectedPurchase.amount_paid || "0") > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Amount Paid
                    </label>
                    <p className="text-lg text-gray-900">
                      {(parseFloat(selectedPurchase.amount_paid) || 0).toFixed(2)} UZS
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Items
              </h4>
              <div className="space-y-3">
                {selectedPurchase.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">
                        {getProductName(item.product)}
                      </h5>
                      <p className="text-sm text-gray-500">
                        {parseFloat(item.cost_price || "0").toFixed(2)} UZS ×{" "}
                        {Math.abs(item.quantity)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        
                        {(
                          Math.abs(item.quantity) *
                          parseFloat(item.cost_price || "0")
                        ).toFixed(2)} UZS
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedPurchase.notes && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Notes
                </h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {selectedPurchase.notes}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6">
              <button
                onClick={() => {
                  setShowPurchaseDetail(false);
                  setSelectedPurchase(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Suppliers Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-xl p-6 w-full max-w-6xl max-h-[80vh] overflow-y-auto" 
            style={{ marginTop: "50px" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Manage Suppliers
              </h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    resetSupplierForm();
                    setShowAddSupplierModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center space-x-2 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add Supplier</span>
                </button>
                <button
                  onClick={() => setShowSupplierModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                            <Building className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {supplier.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {supplier.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {supplier.phone || "No phone"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {supplier.address_1 || "No address"}
                          {supplier.address_2 && `, ${supplier.address_2}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            supplier.is_supplier
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {supplier.is_supplier ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditSupplier(supplier)}
                            className="text-blue-600 hover:text-blue-900 transition-colors flex items-center space-x-1"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() =>
                              deleteSupplier(supplier.id, supplier.name)
                            }
                            className="text-red-600 hover:text-red-900 transition-colors flex items-center space-x-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
              </h3>
              <button
                onClick={() => {
                  setShowAddSupplierModal(false);
                  resetSupplierForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitSupplier} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierFormData.name}
                    onChange={(e) =>
                      setSupplierFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Supplier name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={supplierFormData.email}
                    onChange={(e) =>
                      setSupplierFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="supplier@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={supplierFormData.phone}
                    onChange={(e) =>
                      setSupplierFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={supplierFormData.is_supplier.toString()}
                    onChange={(e) =>
                      setSupplierFormData((prev) => ({
                        ...prev,
                        is_supplier: e.target.value === "true",
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    value={supplierFormData.address_1}
                    onChange={(e) =>
                      setSupplierFormData((prev) => ({
                        ...prev,
                        address_1: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Street address, P.O. box"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={supplierFormData.address_2}
                    onChange={(e) =>
                      setSupplierFormData((prev) => ({
                        ...prev,
                        address_2: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Apartment, suite, unit, building, floor, etc."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={supplierFormData.notes}
                    onChange={(e) =>
                      setSupplierFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes about this supplier..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSupplierModal(false);
                    resetSupplierForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {editingSupplier ? "Update Supplier" : "Create Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
