import React, { useState, useEffect } from "react";
import {
  Package,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Plus,
  X,
  Building,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "../context/AuthContext";

// Interfaces
interface StockQuant {
  id: number;
  location: string;
  product: string;
  quantity: string;
}

interface Location {
  id: string;
  name: string;
  code: string;
  address: string;
  created_at: string;
  updated_at: string;
  title?: string;
  notes?: string;
  is_active?: boolean;
  company?: number;
  created_by?: number;
  updated_by?: number;
  deleted_by?: null;
  deleted_at?: string | null;
}

interface StockAdjustment {
  id: string;
  product: string;
  location: string;
  quantity: string;
  reason: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface ApiProduct {
  id: string;
  title: string;
  sku: string;
  reference: string;
  cost: string;
  price: string;
  stock_quants: StockQuant[];
  created_at: string;
  updated_at: string;
}

interface StockMove {
  id: string;
  product: string;
  reserved_quantity: string;
  price: string;
  created_at: string;
  updated_at: string;
}

interface StockPicking {
  id: string;
  reference: string;
  picking_type: "incoming" | "outgoing" | "internal";
  status: string;
  scheduled_date: string;
  source_location: string;
  destination_location: string;
  moves: StockMove[];
  created_at: string;
  updated_at: string;
  state?: string;
}

interface StockPickingFormData {
  reference: string;
  picking_type: string;
  status: string;
  scheduled_date: string;
  source_location: string;
  destination_location: string;
  notes: string;
  moves: Array<{
    product: string;
    reserved_quantity: string;
    price: string;
  }>;
  state?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  minStock: number;
  maxStock: number;
  cost: number;
}

interface CreateStockAdjustmentData {
  product: string;
  location: string;
  quantity: string;
  reason: string;
  notes: string;
}

const API_URL = import.meta.env.VITE_API_URL;

// API service functions
const inventoryAPI = {
  // Stock Adjustments
  getStockAdjustments: async (): Promise<StockAdjustment[]> => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_URL}/api/v1/stock/adjustments/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Stock adjustments yuklab olinmadi");
    const data = await response.json();
    return data.results || data;
  },

  createStockAdjustment: async (data: CreateStockAdjustmentData): Promise<StockAdjustment> => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_URL}/api/v1/stock/adjustments/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Stock adjustment yaratishda xato: ${JSON.stringify(errorData)}`);
    }
    return response.json();
  },

  // Locations API
  getLocations: async (): Promise<Location[]> => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_URL}/api/v1/stock/locations/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Locations yuklab olinmadi");
    const data = await response.json();
    return data.results || data;
  },

  createLocation: async (data: {
    title: string;
    notes: string;
    code: string;
    is_active: boolean;
  }): Promise<Location> => {
    const token = localStorage.getItem("access_token");

    const requestData = {
      title: data.title,
      notes: data.notes,
      code: data.code,
      is_active: data.is_active,
    };

    console.log("Creating location with data:", requestData);

    const response = await fetch(`${API_URL}/api/v1/stock/locations/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Location creation error:", errorData);
      throw new Error(`Location yaratishda xato: ${JSON.stringify(errorData)}`);
    }
    return response.json();
  },

  // Stock Pickings API
  getStockPickings: async (): Promise<StockPicking[]> => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_URL}/api/v1/stock/pickings/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Stock pickings yuklab olinmadi:", response.status);
      throw new Error("Stock pickings yuklab olinmadi");
    }

    const data = await response.json();
    console.log("Stock pickings data:", data);
    return data.results || data || [];
  },

  createStockPicking: async (data: StockPickingFormData): Promise<StockPicking> => {
    const token = localStorage.getItem("access_token");

    const movesData = data.moves.map((move) => ({
      product: move.product,
      reserved_quantity: parseFloat(move.reserved_quantity) || 0,
      price: parseFloat(move.price) || 0,
    }));

    const requestData = {
      reference: data.reference,
      picking_type: data.picking_type,
      status: data.status,
      scheduled_date: data.scheduled_date,
      source_location: data.source_location,
      destination_location: data.destination_location,
      notes: data.notes,
      moves: movesData,
    };

    console.log("Sending stock picking data:", requestData);

    const response = await fetch(`${API_URL}/api/v1/stock/pickings/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Stock picking creation error:", errorData);

      let errorMessage = "Stock picking yaratishda xato";
      if (typeof errorData === "object") {
        Object.keys(errorData).forEach((key) => {
          errorMessage += `\n${key}: ${
            Array.isArray(errorData[key])
              ? errorData[key].join(", ")
              : errorData[key]
          }`;
        });
      } else {
        errorMessage += `: ${JSON.stringify(errorData)}`;
      }

      throw new Error(errorMessage);
    }
    return response.json();
  },

  // Products API
  getProducts: async (): Promise<Product[]> => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_URL}/api/v1/products/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn("Products API mavjud emas, mock data ishlatilmoqda");
      return [];
    }

    const data = await response.json();
    const apiProducts: ApiProduct[] = data.results || data || [];

    const formattedProducts: Product[] = apiProducts.map((apiProduct) => {
      const totalStock =
        apiProduct.stock_quants?.reduce((sum, quant) => {
          return sum + parseFloat(quant.quantity || "0");
        }, 0) || 0;

      const minStock = 5;
      const maxStock = 50;

      return {
        id: apiProduct.id,
        name: apiProduct.title,
        sku: apiProduct.sku || apiProduct.reference,
        stockQuantity: totalStock,
        minStock: minStock,
        maxStock: maxStock,
        cost: parseFloat(apiProduct.cost) || 0,
      };
    });

    return formattedProducts;
  },
};

// Type guard to check if an activity item is a stock picking
function isStockPicking(item: StockPicking | StockAdjustment): item is StockPicking {
  return 'picking_type' in item;
}

const INVENTORY_TABS = [
  { key: 'stock', label: 'Stock' },
  { key: 'transfers', label: 'Transfers' },
  { key: 'locations', label: 'Locations' },
];

function LocationsList({ locations }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
      <h3 className="text-lg font-semibold mb-4">Locations</h3>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
          </tr>
        </thead>
        <tbody>
          {locations.map(loc => (
            <tr key={loc.id} className="hover:bg-gray-50">
              <td className="px-4 py-2">{loc.name || loc.title}</td>
              <td className="px-4 py-2">{loc.code}</td>
              <td className="px-4 py-2">{loc.address}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function InventoryPage() {
  const { user, selectedCompanyId } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockPickings, setStockPickings] = useState<StockPicking[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal visibility states
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showLocationListModal, setShowLocationListModal] = useState(false);

  // Selection states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form states
  const [adjustmentForm, setAdjustmentForm] = useState<CreateStockAdjustmentData>({
    product: '',
    location: '',
    quantity: '',
    reason: '',
    notes: ''
  });

  const [transferForm, setTransferForm] = useState<StockPickingFormData>({
    reference: `TR-${Date.now()}`,
    source_location: '',
    destination_location: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    picking_type: 'internal',
    state: 'draft',
    status: 'draft',
    notes: '',
    moves: [{
      product: '',
      reserved_quantity: '0',
      price: '0'
    }]
  });

  const [stockAdjustmentForm, setStockAdjustmentForm] = useState({
    product: "",
    location: "",
    quantity: "",
    reason: "",
    notes: ""
  });

  const [locationForm, setLocationForm] = useState({
    title: "",
    notes: "",
    code: "",
    is_active: true,
  });

  const [stockPickingForm, setStockPickingForm] = useState<StockPickingFormData>({
    reference: `SM-${Date.now()}`,
    picking_type: "incoming",
    state: "draft",
    status: "draft",
    scheduled_date: new Date().toISOString().split("T")[0],
    source_location: "",
    destination_location: "",
    notes: "",
    moves: [
      {
        product: "",
        reserved_quantity: "0",
        price: "0",
      },
    ],
  });

  const [activeTab, setActiveTab] = useState<'stock' | 'transfers' | 'locations'>('stock');

  // Load data from API
  useEffect(() => {
    loadData();
  }, [selectedCompanyId]);

  // Load data from API - error tolerant version
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [locationsData, pickingsData, productsData, adjustmentsData] = await Promise.all([
        inventoryAPI.getLocations().catch((err) => {
          console.error("Locations yuklashda xato:", err);
          return [];
        }),
        inventoryAPI.getStockPickings().catch((err) => {
          console.error("Stock pickings yuklashda xato:", err);
          return [];
        }),
        inventoryAPI.getProducts().catch((err) => {
          console.error("Products yuklashda xato:", err);
          return [];
        }),
        inventoryAPI.getStockAdjustments().catch((err) => {
          console.error("Stock adjustments yuklashda xato:", err);
          return [];
        })
      ]);

      setLocations(locationsData);
      setStockPickings(pickingsData);
      setProducts(productsData);
      setStockAdjustments(adjustmentsData);

      console.log("Loaded data:", {
        locations: locationsData,
        pickings: pickingsData,
        products: productsData,
        adjustments: adjustmentsData
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ma'lumotlarni yuklashda xatolik";
      setError(errorMessage);
      console.error("Data loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!adjustmentForm.product || !adjustmentForm.location || !adjustmentForm.quantity) {
        setError('Please fill in all required fields');
        return;
      }

      await inventoryAPI.createStockAdjustment(adjustmentForm);
      setShowAdjustmentModal(false);
      setAdjustmentForm({
        product: '',
        location: '',
        quantity: '',
        reason: '',
        notes: ''
      });
      loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create stock adjustment';
      setError(errorMessage);
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!transferForm.source_location || !transferForm.destination_location || !transferForm.moves[0].product) {
        setError('Please fill in all required fields');
        return;
      }

      await inventoryAPI.createStockPicking(transferForm);
      setShowTransferModal(false);
      setTransferForm({
        reference: `TR-${Date.now()}`,
        source_location: '',
        destination_location: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        picking_type: 'internal',
        state: 'draft',
        status: 'draft',
        notes: '',
        moves: [{
          product: '',
          reserved_quantity: '0',
          price: '0'
        }]
      });
      loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create stock transfer';
      setError(errorMessage);
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inventoryAPI.createLocation({
        title: locationForm.title,
        notes: locationForm.notes,
        code: locationForm.code,
        is_active: locationForm.is_active,
      });

      setShowLocationModal(false);
      setLocationForm({
        title: "",
        notes: "",
        code: "",
        is_active: true,
      });
      setError(null);

      loadData();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Location yaratishda xatolik";
      setError(errorMessage);
    }
  };

  const handleCreateStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!stockAdjustmentForm.product) {
        alert("Please select a product!");
        return;
      }

      if (!stockAdjustmentForm.location) {
        alert("Please select a location!");
        return;
      }

      if (!stockAdjustmentForm.quantity) {
        alert("Please enter a quantity!");
        return;
      }

      await inventoryAPI.createStockAdjustment(stockAdjustmentForm);

      setShowAdjustmentModal(false);
      setStockAdjustmentForm({
        product: "",
        location: "",
        quantity: "",
        reason: "",
        notes: ""
      });
      setError(null);

      loadData();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error creating stock adjustment";
      setError(errorMessage);
    }
  };

  const handleCreateStockPicking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!stockPickingForm.moves[0].product) {
        alert("Iltimos, mahsulot tanlang!");
        return;
      }

      if (!stockPickingForm.source_location || !stockPickingForm.destination_location) {
        alert("Iltimos, manba va maqsad lokatsiyalarini tanlang!");
        return;
      }

      await inventoryAPI.createStockPicking(stockPickingForm);

      setShowAdjustmentModal(false);
      setStockPickingForm({
        reference: `SM-${Date.now()}`,
        picking_type: "incoming",
        state: "draft",
        status: "draft",
        scheduled_date: new Date().toISOString().split("T")[0],
        source_location: "",
        destination_location: "",
        notes: "",
        moves: [
          {
            product: "",
            reserved_quantity: "0",
            price: "0",
          },
        ],
      });
      setSelectedProduct(null);

      loadData();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Stock move yaratishda xatolik";
      setError(errorMessage);
      console.error("Stock picking creation error:", err);
    }
  };

  // Calculate stats from products data
  const lowStockItems = products.filter((p) => p.stockQuantity <= p.minStock);
  const overstockedItems = products.filter((p) => p.stockQuantity >= p.maxStock);
  const totalValue = products.reduce((sum, p) => sum + p.stockQuantity * p.cost, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Yuklanmoqda...</div>
      </div>
    );
  }

  // Transfers List View
  function TransfersList({ pickings, products, locations }) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
        <h3 className="text-lg font-semibold mb-4">Stock Transfers</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Moves</th>
            </tr>
          </thead>
          <tbody>
            {pickings.map((picking) => (
              <tr key={picking.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{picking.reference}</td>
                <td className="px-4 py-2">{picking.picking_type}</td>
                <td className="px-4 py-2">{picking.status}</td>
                <td className="px-4 py-2">{picking.scheduled_date ? new Date(picking.scheduled_date).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-2">{locations.find(l => l.id === picking.source_location)?.name || '-'}</td>
                <td className="px-4 py-2">{locations.find(l => l.id === picking.destination_location)?.name || '-'}</td>
                <td className="px-4 py-2">
                  <ul>
                    {picking.moves.map(move => (
                      <li key={move.id}>
                        {products.find(prod => prod.id === move.product)?.name || move.product} - Qty: {move.reserved_quantity} - Price: {move.price}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b mb-4">
        {INVENTORY_TABS.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
            onClick={() => setActiveTab(tab.key as 'stock' | 'transfers' | 'locations')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'stock' && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
              <p className="text-sm text-gray-600">
                Track and manage your stock levels
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAdjustmentModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Adjust Stock</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {products.reduce((sum, p) => sum + p.stockQuantity, 0)}
                  </p>
                </div>
                <div className="bg-blue-500 p-3 rounded-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    ${totalValue.toFixed(2)}
                  </p>
                </div>
                <div className="bg-green-500 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {lowStockItems.length}
                  </p>
                </div>
                <div className="bg-red-500 p-3 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overstocked</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {overstockedItems.length}
                  </p>
                </div>
                <div className="bg-orange-500 p-3 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stock Levels */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Stock Levels
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Current Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Min/Max
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product) => {
                      const stockPercentage = (product.stockQuantity / product.maxStock) * 100;
                      const getStatusColor = () => {
                        if (product.stockQuantity <= product.minStock)
                          return "text-red-600 bg-red-100";
                        if (product.stockQuantity >= product.maxStock)
                          return "text-orange-600 bg-orange-100";
                        return "text-green-600 bg-green-100";
                      };

                      const productValue = product.stockQuantity * product.cost;

                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.sku}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {product.stockQuantity}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className={clsx(
                                  "h-2 rounded-full transition-all",
                                  stockPercentage <= 30
                                    ? "bg-red-500"
                                    : stockPercentage >= 90
                                    ? "bg-orange-500"
                                    : "bg-green-500"
                                )}
                                style={{
                                  width: `${Math.min(stockPercentage, 100)}%`,
                                }}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {product.minStock} / {product.maxStock}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={clsx(
                                "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                                getStatusColor()
                              )}
                            >
                              {product.stockQuantity <= product.minStock
                                ? "Low"
                                : product.stockQuantity >= product.maxStock
                                ? "High"
                                : "Normal"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              ${isNaN(productValue) ? "0.00" : productValue.toFixed(2)}
                            </div>
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setStockPickingForm((prev) => ({
                                  ...prev,
                                  moves: [
                                    {
                                      ...prev.moves[0],
                                      product: product.id,
                                    },
                                  ],
                                }));
                                setShowAdjustmentModal(true);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                            >
                              Adjust
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Activity
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[...stockPickings, ...stockAdjustments]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5)
                    .map((item) => {
                      const isPicking = 'picking_type' in item;
                      const type = isPicking ? (item as StockPicking).picking_type : 'adjustment';
                      const isIncoming = isPicking ? type === 'incoming' : parseFloat((item as StockAdjustment).quantity) > 0;

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={clsx(
                                "w-8 h-8 rounded-full flex items-center justify-center",
                                isIncoming ? "bg-green-100" : "bg-red-100"
                              )}
                            >
                              {isIncoming ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {isPicking 
                                  ? (item as StockPicking).reference 
                                  : `Stock Adjustment (${(item as StockAdjustment).reason})`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {type}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={clsx(
                                "text-sm font-semibold",
                                isIncoming ? "text-green-600" : "text-red-600"
                              )}
                            >
                              {isIncoming ? "+" : "-"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {activeTab === 'transfers' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowTransferModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Stock Transfer</span>
            </button>
          </div>
          <TransfersList pickings={stockPickings} products={products} locations={locations} />
        </>
      )}
      {activeTab === 'locations' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowLocationModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add Location</span>
            </button>
          </div>
          <LocationsList locations={locations} />
        </>
      )}

      {/* Add Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Add New Location
              </h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateLocation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Code *
                </label>
                <input
                  type="text"
                  required
                  value={locationForm.code}
                  onChange={(e) =>
                    setLocationForm((prev) => ({
                      ...prev,
                      code: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter location code (e.g., WH-001)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Title *
                </label>
                <input
                  type="text"
                  required
                  value={locationForm.title}
                  onChange={(e) =>
                    setLocationForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter location title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={locationForm.notes}
                  onChange={(e) =>
                    setLocationForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={locationForm.is_active}
                  onChange={(e) =>
                    setLocationForm((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Move Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Stock Move</h3>
              <button
                onClick={() => {
                  setShowAdjustmentModal(false);
                  setSelectedProduct(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {selectedProduct && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">
                  {selectedProduct?.name}
                </h4>
                <p className="text-sm text-gray-500">
                  Current Stock: {selectedProduct?.stockQuantity}
                </p>
              </div>
            )}

            <form onSubmit={handleCreateStockPicking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <select
                  required
                  value={stockPickingForm.moves[0].product}
                  onChange={(e) =>
                    setStockPickingForm((prev) => ({
                      ...prev,
                      moves: [
                        {
                          ...prev.moves[0],
                          product: e.target.value,
                        },
                      ],
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Picking Type
                </label>
                <select
                  required
                  value={stockPickingForm.picking_type}
                  onChange={(e) =>
                    setStockPickingForm((prev) => ({
                      ...prev,
                      picking_type: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="incoming">Incoming</option>
                  <option value="outgoing">Outgoing</option>
                  <option value="internal">Internal</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Location
                  </label>
                  <select
                    required
                    value={stockPickingForm.source_location}
                    onChange={(e) =>
                      setStockPickingForm((prev) => ({
                        ...prev,
                        source_location: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination Location
                  </label>
                  <select
                    required
                    value={stockPickingForm.destination_location}
                    onChange={(e) =>
                      setStockPickingForm((prev) => ({
                        ...prev,
                        destination_location: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  value={stockPickingForm.scheduled_date}
                  onChange={(e) =>
                    setStockPickingForm((prev) => ({
                      ...prev,
                      scheduled_date: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moves
                </label>
                {stockPickingForm.moves.map((move, idx) => (
                  <div key={idx} className="flex space-x-2 mb-2">
                    <select required value={move.product} onChange={e => {
                      const moves = [...stockPickingForm.moves];
                      moves[idx].product = e.target.value;
                      setStockPickingForm(f => ({ ...f, moves }));
                    }} className="border rounded-lg px-2 py-1">
                      <option value="">Product</option>
                      {products.map(prod => <option key={prod.id} value={prod.id}>{prod.name}</option>)}
                    </select>
                    <input type="number" required min="0" value={move.reserved_quantity} onChange={e => {
                      const moves = [...stockPickingForm.moves];
                      moves[idx].reserved_quantity = e.target.value;
                      setStockPickingForm(f => ({ ...f, moves }));
                    }} placeholder="Qty" className="border rounded-lg px-2 py-1 w-20" />
                    <input type="number" required min="0" value={move.price} onChange={e => {
                      const moves = [...stockPickingForm.moves];
                      moves[idx].price = e.target.value;
                      setStockPickingForm(f => ({ ...f, moves }));
                    }} placeholder="Price" className="border rounded-lg px-2 py-1 w-20" />
                    <button type="button" onClick={() => {
                      const moves = stockPickingForm.moves.filter((_, i) => i !== idx);
                      setStockPickingForm(f => ({ ...f, moves }));
                    }} className="text-red-500">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => setStockPickingForm(f => ({ ...f, moves: [...f.moves, { product: '', reserved_quantity: '', price: '' }] }))} className="text-blue-500">Add Move</button>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Stock Adjustment</h3>
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateStockAdjustment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <select
                  required
                  value={stockAdjustmentForm.product}
                  onChange={(e) =>
                    setStockAdjustmentForm((prev) => ({
                      ...prev,
                      product: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <select
                  required
                  value={stockAdjustmentForm.location}
                  onChange={(e) =>
                    setStockAdjustmentForm((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.title || location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  required
                  value={stockAdjustmentForm.quantity}
                  onChange={(e) =>
                    setStockAdjustmentForm((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter quantity (+/-)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <select
                  required
                  value={stockAdjustmentForm.reason}
                  onChange={(e) =>
                    setStockAdjustmentForm((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Reason</option>
                  <option value="counting">Stock Counting</option>
                  <option value="damaged">Damaged/Expired</option>
                  <option value="lost">Lost/Stolen</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={stockAdjustmentForm.notes}
                  onChange={(e) =>
                    setStockAdjustmentForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Submit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location List Modal */}
      {showLocationListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Location List</h3>
              <button
                onClick={() => setShowLocationListModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {locations.map((location) => (
                    <tr key={location.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {location.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {location.title || location.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {location.notes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={clsx(
                            "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                            location.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          )}
                        >
                          {location.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Stock Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Create Stock Transfer</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreateStockPicking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                <input type="text" required value={stockPickingForm.reference} onChange={e => setStockPickingForm(f => ({ ...f, reference: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select required value={stockPickingForm.picking_type} onChange={e => setStockPickingForm(f => ({ ...f, picking_type: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
                  <option value="incoming">Incoming</option>
                  <option value="outgoing">Outgoing</option>
                  <option value="internal">Internal</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source Location</label>
                  <select required value={stockPickingForm.source_location} onChange={e => setStockPickingForm(f => ({ ...f, source_location: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
                    <option value="">Select</option>
                    {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination Location</label>
                  <select required value={stockPickingForm.destination_location} onChange={e => setStockPickingForm(f => ({ ...f, destination_location: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
                    <option value="">Select</option>
                    {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                <input type="date" value={stockPickingForm.scheduled_date} onChange={e => setStockPickingForm(f => ({ ...f, scheduled_date: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Moves</label>
                {stockPickingForm.moves.map((move, idx) => (
                  <div key={idx} className="flex space-x-2 mb-2">
                    <select required value={move.product} onChange={e => {
                      const moves = [...stockPickingForm.moves];
                      moves[idx].product = e.target.value;
                      setStockPickingForm(f => ({ ...f, moves }));
                    }} className="border rounded-lg px-2 py-1">
                      <option value="">Product</option>
                      {products.map(prod => <option key={prod.id} value={prod.id}>{prod.name}</option>)}
                    </select>
                    <input type="number" required min="0" value={move.reserved_quantity} onChange={e => {
                      const moves = [...stockPickingForm.moves];
                      moves[idx].reserved_quantity = e.target.value;
                      setStockPickingForm(f => ({ ...f, moves }));
                    }} placeholder="Qty" className="border rounded-lg px-2 py-1 w-20" />
                    <input type="number" required min="0" value={move.price} onChange={e => {
                      const moves = [...stockPickingForm.moves];
                      moves[idx].price = e.target.value;
                      setStockPickingForm(f => ({ ...f, moves }));
                    }} placeholder="Price" className="border rounded-lg px-2 py-1 w-20" />
                    <button type="button" onClick={() => {
                      const moves = stockPickingForm.moves.filter((_, i) => i !== idx);
                      setStockPickingForm(f => ({ ...f, moves }));
                    }} className="text-red-500">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => setStockPickingForm(f => ({ ...f, moves: [...f.moves, { product: '', reserved_quantity: '', price: '' }] }))} className="text-blue-500">Add Move</button>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}