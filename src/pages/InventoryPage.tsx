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

// Yangilangan Interfacelar
interface StockQuant {
  id: number;
  location: string;
  product: string;
  quantity: string;
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

interface Product {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  minStock: number;
  maxStock: number;
  cost: number;
}

interface Location {
  id: string;
  title: string;
  notes: string;
  code: string; // YANGI: code maydoni
  is_active: boolean;
  company: number;
  created_by: number;
  updated_by: number;
  deleted_by: null;
  deleted_at: string | null;
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
    // picking ni OLIB TASHLANG
  }>;
}
const API_URL = import.meta.env.VITE_API_URL;

// API service functions - getStockPickings qo'shing
const inventoryAPI = {
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

  // InventoryPage.tsx - createLocation ni yangilang
  createLocation: async (data: {
    title: string;
    notes: string;
    code: string;
    is_active: boolean;
  }): Promise<Location> => {
    const token = localStorage.getItem("access_token");

    // FAQAT kerakli maydonlarni yuborish
    const requestData = {
      title: data.title,
      notes: data.notes,
      code: data.code,
      is_active: data.is_active,
      // company, created_by, updated_by ni YUBORMANG
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

  // Stock Pickings API - YANGI: getStockPickings qo'shildi
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

  // InventoryPage.tsx - createStockPicking API ni yangilang
  createStockPicking: async (
    data: StockPickingFormData
  ): Promise<StockPicking> => {
    const token = localStorage.getItem("access_token");

    // Moves arrayidan PICKING ni OLIB TASHLANG
    const movesData = data.moves.map((move) => ({
      product: move.product,
      reserved_quantity: parseFloat(move.reserved_quantity) || 0,
      price: parseFloat(move.price) || 0,
      // picking ni YUBORMANG - backend avtomatik to'ldiradi
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

  // Products API - yangilangan
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

    // API dan kelgan ma'lumotlarni komponent uchun formatlaymiz
    const formattedProducts: Product[] = apiProducts.map((apiProduct) => {
      // Stock miqdorini hisoblaymiz (barcha locationlardagi quantlarni yig'amiz)
      const totalStock =
        apiProduct.stock_quants?.reduce((sum, quant) => {
          return sum + parseFloat(quant.quantity || "0");
        }, 0) || 0;

      // Agar MIN/MAX qiymatlari API da mavjud bo'lmasa, default qiymatlar beramiz
      const minStock = 5; // Default qiymat
      const maxStock = 50; // Default qiymat

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

export default function InventoryPage() {
  const { user, selectedCompanyId } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockPickings, setStockPickings] = useState<StockPicking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form states - soddalashtirilgan
  const [locationForm, setLocationForm] = useState({
    title: "",
    notes: "",
    code: "", // YANGI: code maydoni
    is_active: true,
  });

  const [stockPickingForm, setStockPickingForm] =
    useState<StockPickingFormData>({
      reference: `SM-${Date.now()}`,
      picking_type: "incoming",
      status: "done",
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

  // Load data from API
  useEffect(() => {
    loadData();
  }, [selectedCompanyId]);

  // Load data from API - xatolarga chidamli versiya
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Har bir API chaqiruvi alohida bajariladi, agar biri xato bersa boshqalari ishlaydi
      const locationsData = await inventoryAPI.getLocations().catch((err) => {
        console.error("Locations yuklashda xato:", err);
        return [];
      });

      const pickingsData = await inventoryAPI
        .getStockPickings()
        .catch((err) => {
          console.error("Stock pickings yuklashda xato:", err);
          return [];
        });

      const productsData = await inventoryAPI.getProducts().catch((err) => {
        console.error("Products yuklashda xato:", err);
        return [];
      });

      setLocations(locationsData);
      setStockPickings(pickingsData);
      setProducts(productsData);

      console.log("Loaded locations:", locationsData);
      console.log("Loaded products:", productsData);
      console.log("Loaded pickings:", pickingsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ma'lumotlarni yuklashda xatolik";
      setError(errorMessage);
      console.error("Data loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  // InventoryPage.tsx - handleCreateLocation ni yangilang
  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // FAQAT kerakli maydonlarni yuborish
      await inventoryAPI.createLocation({
        title: locationForm.title,
        notes: locationForm.notes,
        code: locationForm.code,
        is_active: locationForm.is_active,
      });

      setShowLocationModal(false);
      // Formni reset qilish
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

  // Stock Picking handlers - yangilangan
  const handleCreateStockPicking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Form ma'lumotlarini tekshirish
      if (!stockPickingForm.moves[0].product) {
        alert("Iltimos, mahsulot tanlang!");
        return;
      }

      if (
        !stockPickingForm.source_location ||
        !stockPickingForm.destination_location
      ) {
        alert("Iltimos, manba va maqsad lokatsiyalarini tanlang!");
        return;
      }

      await inventoryAPI.createStockPicking(stockPickingForm);

      setShowAdjustmentModal(false);
      setStockPickingForm({
        reference: `SM-${Date.now()}`,
        picking_type: "incoming",
        status: "done",
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
  const overstockedItems = products.filter(
    (p) => p.stockQuantity >= p.maxStock
  );
  const totalValue = products.reduce(
    (sum, p) => sum + p.stockQuantity * p.cost,
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            onClick={() => setShowLocationModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <Building className="h-5 w-5" />
            <span>Add Location</span>
          </button>
          <button
            onClick={() => setShowAdjustmentModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Stock Move</span>
          </button>
        </div>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}
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
                  const stockPercentage =
                    (product.stockQuantity / product.maxStock) * 100;
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
                          $
                          {isNaN(productValue)
                            ? "0.00"
                            : productValue.toFixed(2)}
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

        {/* Recent Movements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Movements
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stockPickings.slice(0, 5).map((picking) => (
                <div
                  key={picking.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        picking.picking_type === "incoming"
                          ? "bg-green-100"
                          : "bg-red-100"
                      )}
                    >
                      {picking.picking_type === "incoming" ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {picking.reference}
                      </p>
                      <p className="text-xs text-gray-500">
                        {picking.picking_type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={clsx(
                        "text-sm font-semibold",
                        picking.picking_type === "incoming"
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      {picking.picking_type === "incoming" ? "+" : "-"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(picking.scheduled_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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
              {/* YANGI: Code maydoni */}
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
      {/* Stock Move Modal - yangilangan */}
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
                  {selectedProduct.name}
                </h4>
                <p className="text-sm text-gray-500">
                  Current Stock: {selectedProduct.stockQuantity}
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
                  <option value="">Select Source Location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.title}
                    </option>
                  ))}
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
                  <option value="">Select Destination Location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.title}
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
                  step="0.01"
                  required
                  value={stockPickingForm.moves[0].reserved_quantity}
                  onChange={(e) =>
                    setStockPickingForm((prev) => ({
                      ...prev,
                      moves: [
                        {
                          ...prev.moves[0],
                          reserved_quantity: e.target.value,
                        },
                      ],
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={stockPickingForm.moves[0].price}
                  onChange={(e) =>
                    setStockPickingForm((prev) => ({
                      ...prev,
                      moves: [
                        {
                          ...prev.moves[0],
                          price: e.target.value,
                        },
                      ],
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter price"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={stockPickingForm.notes}
                  onChange={(e) =>
                    setStockPickingForm((prev) => ({
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
                  onClick={() => {
                    setShowAdjustmentModal(false);
                    setSelectedProduct(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create Stock Move
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
