import React, { useState, useEffect } from "react";
import { Package, TrendingUp, Plus, X, Building } from "lucide-react";
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
  active?: boolean;
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
  title?: string;
  notes?: string;
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
  cost: number;
}

interface CreateStockAdjustmentData {
  product: string;
  location: string;
  quantity: string;
  reason: string;
}
interface LocationsListProps {
  locations: Location[];
  onEdit: (location: Location) => void;
  onDelete: (locationId: string) => void;
}

interface TransfersListProps {
  pickings: StockPicking[];
  products: Product[];
  locations: Location[];
  onViewDetail: (picking: StockPicking) => void;
  onEdit: (picking: StockPicking) => void;
  onConfirm: (pickingId: string) => void;
  onComplete: (pickingId: string) => void;
  onCancel: (pickingId: string) => void;
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

  createStockAdjustment: async (
    data: CreateStockAdjustmentData
  ): Promise<StockAdjustment> => {
    const token = localStorage.getItem("access_token");

    // ✅ TO'G'RILANGAN: Backend strukturasiga mos qilish
    const requestData = {
      reference: `ADJ-${Date.now()}`, // ✅ Reference qo'shildi
      location: data.location,
      status: "draft", // ✅ Status qo'shildi
      reason: data.reason,
      scheduled_date: new Date().toISOString(), // ✅ Scheduled date qo'shildi
      lines: [
        // ✅ Lines array qo'shildi
        {
          product: data.product,
          counted_quantity: parseFloat(data.quantity) || 0,
        },
      ],
    };

    console.log("Creating stock adjustment with data:", requestData);

    const response = await fetch(`${API_URL}/api/v1/stock/adjustments/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Stock adjustment creation error:", errorData);

      let errorMessage = "Stock adjustment yaratishda xato";
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

    // ✅ Company ni backendga yubormaslik, u avtomatik o'rnatiladi
    const requestData = {
      title: data.title,
      notes: data.notes,
      code: data.code,
      is_active: data.is_active,
      // Company ni olib tashlang - u backendda avtomatik o'rnatiladi
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

      // ✅ Xatolikni yaxshiroq ko'rsatish
      let errorMessage = "Location yaratishda xato";
      if (errorData.company) {
        errorMessage = `Company maydoni kerak: ${errorData.company.join(", ")}`;
      } else if (typeof errorData === "object") {
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

  createStockPicking: async (
    data: StockPickingFormData
  ): Promise<StockPicking> => {
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

  // Transfer Actions
  confirmTransfer: async (pickingId: string): Promise<{ status: string }> => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(
      `${API_URL}/api/v1/stock/pickings/${pickingId}/confirm/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || errorData.error || "Failed to confirm transfer"
      );
    }
    return response.json();
  },

  completeTransfer: async (pickingId: string): Promise<{ status: string }> => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(
      `${API_URL}/api/v1/stock/pickings/${pickingId}/done/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || errorData.error || "Failed to complete transfer"
      );
    }
    return response.json();
  },

  cancelTransfer: async (pickingId: string): Promise<{ status: string }> => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(
      `${API_URL}/api/v1/stock/pickings/${pickingId}/cancel/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || errorData.error || "Failed to cancel transfer"
      );
    }
    return response.json();
  },

  updateStockPicking: async (
    pickingId: string,
    data: StockPickingFormData
  ): Promise<StockPicking> => {
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

    const response = await fetch(
      `${API_URL}/api/v1/stock/pickings/${pickingId}/`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = "Stock picking yangilashda xato";
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

      return {
        id: apiProduct.id,
        name: apiProduct.title,
        sku: apiProduct.sku || apiProduct.reference,
        stockQuantity: totalStock,
        cost: parseFloat(apiProduct.cost) || 0,
      };
    });

    return formattedProducts;
  },
};

const INVENTORY_TABS = [
  { key: "stock", label: "Stock" },
  { key: "transfers", label: "Transfers" },
  { key: "locations", label: "Locations" },
];

function LocationsList({ locations, onEdit, onDelete }: LocationsListProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold mb-4">Storage Locations</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Notes
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {locations.map((loc) => (
              <tr key={loc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">
                    {loc.name || loc.title}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs font-mono bg-gray-100 text-gray-700 rounded">
                    {loc.code}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {loc.notes || "-"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      loc.is_active || loc.active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {loc.is_active || loc.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => onEdit(loc)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(loc.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TransfersList({
  pickings,
  products,
  locations,
  onViewDetail,
  onEdit,
  onConfirm,
  onComplete,
  onCancel,
}: TransfersListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-yellow-100 text-yellow-700";
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "done":
        return "bg-green-100 text-green-700";
      case "cancel":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "incoming":
        return "bg-green-50 text-green-700 border-green-200";
      case "outgoing":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "internal":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold mb-4">Stock Transfers</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Reference
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Route
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Products
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pickings.map((picking) => (
              <tr key={picking.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">
                    {picking.reference}
                  </div>
                  {picking.title && (
                    <div className="text-xs text-gray-500">{picking.title}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      "px-2 py-1 text-xs font-medium rounded border",
                      getTypeColor(picking.picking_type)
                    )}
                  >
                    {picking.picking_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      getStatusColor(picking.status)
                    )}
                  >
                    {picking.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {picking.scheduled_date
                    ? new Date(picking.scheduled_date).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-700">
                      {locations.find((l) => l.id === picking.source_location)
                        ?.name ||
                        locations.find((l) => l.id === picking.source_location)
                          ?.title ||
                        "-"}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="text-gray-700">
                      {locations.find(
                        (l) => l.id === picking.destination_location
                      )?.name ||
                        locations.find(
                          (l) => l.id === picking.destination_location
                        )?.title ||
                        "-"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-600">
                    {picking.moves.length} items
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onViewDetail(picking)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View
                    </button>
                    {picking.status === "new" && (
                      <>
                        <button
                          onClick={() => onEdit(picking)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onConfirm(picking.id)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Confirm
                        </button>
                      </>
                    )}
                    {picking.status === "confirmed" && (
                      <button
                        onClick={() => onComplete(picking.id)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Complete
                      </button>
                    )}
                    {(picking.status === "new" ||
                      picking.status === "confirmed") && (
                      <button
                        onClick={() => onCancel(picking.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { user, selectedCompanyId } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockPickings, setStockPickings] = useState<StockPicking[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal visibility states
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showTransferDetailModal, setShowTransferDetailModal] = useState(false);
  const [showTransferEditModal, setShowTransferEditModal] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    product: "",
    location: "",
    quantity: "",
    reason: "",
    notes: "",
  });
  // Selection states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [selectedTransfer, setSelectedTransfer] = useState<StockPicking | null>(
    null
  );
  const [editingTransfer, setEditingTransfer] = useState<StockPicking | null>(
    null
  );

  // Form states
  const [locationForm, setLocationForm] = useState({
    title: "",
    notes: "",
    code: "",
    is_active: true,
  });

  const [stockPickingForm, setStockPickingForm] =
    useState<StockPickingFormData>({
      reference: `SM-${Date.now()}`,
      picking_type: "incoming",
      state: "draft",
      status: "new",
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

  const [activeTab, setActiveTab] = useState<
    "stock" | "transfers" | "locations"
  >("stock");

  // Load data from API
  useEffect(() => {
    loadData();
  }, [selectedCompanyId]);

  // Load data from API - error tolerant version
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [locationsData, pickingsData, productsData, adjustmentsData] =
        await Promise.all([
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
          }),
        ]);

      setLocations(locationsData);
      setStockPickings(pickingsData);
      setProducts(productsData);
      setStockAdjustments(adjustmentsData);

      console.log("Loaded data:", {
        locations: locationsData,
        pickings: pickingsData,
        products: productsData,
        adjustments: adjustmentsData,
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
  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedLocation) {
        // Update existing location
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `${API_URL}/api/v1/stock/locations/${selectedLocation.id}/`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: locationForm.title,
              notes: locationForm.notes,
              code: locationForm.code,
              is_active: locationForm.is_active,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Location update failed: ${JSON.stringify(errorData)}`
          );
        }
      } else {
        // Create new location
        await inventoryAPI.createLocation({
          title: locationForm.title,
          notes: locationForm.notes,
          code: locationForm.code,
          is_active: locationForm.is_active,
        });
      }

      setShowLocationModal(false);
      setSelectedLocation(null);
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
        err instanceof Error ? err.message : "Location operation failed";
      setError(errorMessage);
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_URL}/api/v1/stock/locations/${locationId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete location");
      }

      loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Delete failed";
      setError(errorMessage);
    }
  };

  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location);
    setLocationForm({
      title: location.title || location.name,
      notes: location.notes || "",
      code: location.code,
      is_active: location.is_active ?? true,
    });
    setShowLocationModal(true);
  };

  const handleConfirmTransfer = async (pickingId: string) => {
    try {
      await inventoryAPI.confirmTransfer(pickingId);

      // Update selected transfer status if modal is open
      if (selectedTransfer && selectedTransfer.id === pickingId) {
        setSelectedTransfer({ ...selectedTransfer, status: "confirmed" });
      }

      loadData();
      alert("Transfer confirmed successfully!");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Confirm failed";
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  const handleCompleteTransfer = async (pickingId: string) => {
    try {
      await inventoryAPI.completeTransfer(pickingId);

      // Update selected transfer status if modal is open
      if (selectedTransfer && selectedTransfer.id === pickingId) {
        setSelectedTransfer({ ...selectedTransfer, status: "done" });
      }

      loadData();
      alert("Transfer completed successfully!");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Complete failed";
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  const handleCancelTransfer = async (pickingId: string) => {
    if (!confirm("Are you sure you want to cancel this transfer?")) return;

    try {
      await inventoryAPI.cancelTransfer(pickingId);

      // Update selected transfer status if modal is open
      if (selectedTransfer && selectedTransfer.id === pickingId) {
        setSelectedTransfer({ ...selectedTransfer, status: "cancel" });
      }

      loadData();
      alert("Transfer cancelled successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Cancel failed";
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  const handleEditTransfer = (picking: StockPicking) => {
    setEditingTransfer(picking);
    setStockPickingForm({
      reference: picking.reference,
      picking_type: picking.picking_type,
      state: picking.state || "draft",
      status: picking.status,
      scheduled_date: picking.scheduled_date,
      source_location: picking.source_location,
      destination_location: picking.destination_location,
      notes: picking.notes || "",
      moves: picking.moves.map((move) => ({
        product: move.product,
        reserved_quantity: move.reserved_quantity,
        price: move.price,
      })),
    });
    setShowTransferEditModal(true);
  };

  const handleUpdateStockPicking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransfer) return;

    try {
      if (!stockPickingForm.moves[0].product) {
        alert("Please select a product!");
        return;
      }

      if (
        !stockPickingForm.source_location ||
        !stockPickingForm.destination_location
      ) {
        alert("Please select source and destination locations!");
        return;
      }

      await inventoryAPI.updateStockPicking(
        editingTransfer.id,
        stockPickingForm
      );

      setShowTransferEditModal(false);
      setEditingTransfer(null);
      setStockPickingForm({
        reference: `SM-${Date.now()}`,
        picking_type: "incoming",
        state: "draft",
        status: "new",
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

      loadData();
      alert("Transfer updated successfully!");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Stock move yangilashda xatolik";
      setError(errorMessage);
      alert(errorMessage);
      console.error("Stock picking update error:", err);
    }
  };

  const handleViewTransferDetail = (picking: StockPicking) => {
    setSelectedTransfer(picking);
    setShowTransferDetailModal(true);
  };

  const handleCreateStockPicking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!stockPickingForm.moves[0].product) {
        alert("Please select a product!");
        return;
      }

      if (
        !stockPickingForm.source_location ||
        !stockPickingForm.destination_location
      ) {
        alert("Please select source and destination locations!");
        return;
      }

      await inventoryAPI.createStockPicking(stockPickingForm);

      setShowTransferModal(false);
      setStockPickingForm({
        reference: `SM-${Date.now()}`,
        picking_type: "incoming",
        state: "draft",
        status: "new",
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
      alert(errorMessage);
      console.error("Stock picking creation error:", err);
    }
  };
  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!adjustmentForm.location) {
        alert("Iltimos, lokatsiyani tanlang!");
        return;
      }

      if (!adjustmentForm.quantity) {
        alert("Iltimos, yangi miqdorni kiriting!");
        return;
      }

      if (!adjustmentForm.reason) {
        alert("Iltimos, sababni kiriting!");
        return;
      }

      await inventoryAPI.createStockAdjustment({
        product: adjustmentForm.product,
        location: adjustmentForm.location,
        quantity: adjustmentForm.quantity,
        reason: adjustmentForm.reason,
        // notes ni olib tashlash
      });

      setShowAdjustmentModal(false);
      setAdjustmentForm({
        product: "",
        location: "",
        quantity: "",
        reason: "",
        notes: "", // notes saqlansa ham, API ga yuborilmaydi
      });
      setSelectedProduct(null);

      loadData();
      alert("Stock muvaffaqiyatli yangilandi!");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Stock adjustment failed";
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  // Calculate stats from products data
  const totalValue = products.reduce(
    (sum, p) => sum + p.stockQuantity * p.cost,
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b mb-4">
        {INVENTORY_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-blue-600"
            }`}
            onClick={() =>
              setActiveTab(tab.key as "stock" | "transfers" | "locations")
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => setError(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "stock" && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
              <p className="text-sm text-gray-600">
                Track and manage your stock levels
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Items
                  </p>
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
                  <p className="text-sm font-medium text-gray-600">
                    Total Value
                  </p>
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
                  <p className="text-sm font-medium text-gray-600">Locations</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {locations.length}
                  </p>
                </div>
                <div className="bg-purple-500 p-3 rounded-lg">
                  <Building className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                      Unit Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => {
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
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ${product.cost.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            $
                            {isNaN(productValue)
                              ? "0.00"
                              : productValue.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              // ✅ TO'G'RILANGAN: Adjustment formni to'g'ri o'rnatish
                              setAdjustmentForm({
                                product: product.id,
                                location: "",
                                quantity: product.stockQuantity.toString(),
                                reason: "",
                                notes: "",
                              });
                              setShowAdjustmentModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {activeTab === "transfers" && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowTransferModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>New Transfer</span>
            </button>
          </div>
          <TransfersList
            pickings={stockPickings}
            products={products}
            locations={locations}
            onViewDetail={handleViewTransferDetail}
            onEdit={handleEditTransfer}
            onConfirm={handleConfirmTransfer}
            onComplete={handleCompleteTransfer}
            onCancel={handleCancelTransfer}
          />
        </>
      )}
      {activeTab === "locations" && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                setSelectedLocation(null);
                setLocationForm({
                  title: "",
                  notes: "",
                  code: "",
                  is_active: true,
                });
                setShowLocationModal(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add Location</span>
            </button>
          </div>
          <LocationsList
            locations={locations}
            onEdit={handleEditLocation}
            onDelete={handleDeleteLocation}
          />
        </>
      )}

      {/* Add Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto" style={{marginTop:"50px"}}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedLocation ? "Edit Location" : "Add New Location"}
              </h3>
              <button
                onClick={() => {
                  setShowLocationModal(false);
                  setSelectedLocation(null);
                }}
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
                  onClick={() => {
                    setShowLocationModal(false);
                    setSelectedLocation(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {selectedLocation ? "Update Location" : "Create Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto" style={{marginTop:"50px"}}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Create Stock Transfer
              </h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreateStockPicking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference
                </label>
                <input
                  type="text"
                  required
                  value={stockPickingForm.reference}
                  onChange={(e) =>
                    setStockPickingForm((f) => ({
                      ...f,
                      reference: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  required
                  value={stockPickingForm.picking_type}
                  onChange={(e) =>
                    setStockPickingForm((f) => ({
                      ...f,
                      picking_type: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2"
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
                      setStockPickingForm((f) => ({
                        ...f,
                        source_location: e.target.value,
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name || loc.title}
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
                      setStockPickingForm((f) => ({
                        ...f,
                        destination_location: e.target.value,
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name || loc.title}
                      </option>
                    ))}
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
                    setStockPickingForm((f) => ({
                      ...f,
                      scheduled_date: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Products
                </label>
                {stockPickingForm.moves.map((move, idx) => (
                  <div key={idx} className="flex space-x-2 mb-2">
                    <select
                      required
                      value={move.product}
                      onChange={(e) => {
                        const moves = [...stockPickingForm.moves];
                        moves[idx].product = e.target.value;
                        setStockPickingForm((f) => ({ ...f, moves }));
                      }}
                      className="flex-1 border rounded-lg px-2 py-1"
                    >
                      <option value="">Select Product</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={move.reserved_quantity}
                      onChange={(e) => {
                        const moves = [...stockPickingForm.moves];
                        moves[idx].reserved_quantity = e.target.value;
                        setStockPickingForm((f) => ({ ...f, moves }));
                      }}
                      placeholder="Qty"
                      className="w-24 border rounded-lg px-2 py-1"
                    />
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={move.price}
                      onChange={(e) => {
                        const moves = [...stockPickingForm.moves];
                        moves[idx].price = e.target.value;
                        setStockPickingForm((f) => ({ ...f, moves }));
                      }}
                      placeholder="Price"
                      className="w-24 border rounded-lg px-2 py-1"
                    />
                    {stockPickingForm.moves.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const moves = stockPickingForm.moves.filter(
                            (_, i) => i !== idx
                          );
                          setStockPickingForm((f) => ({ ...f, moves }));
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setStockPickingForm((f) => ({
                      ...f,
                      moves: [
                        ...f.moves,
                        { product: "", reserved_quantity: "", price: "" },
                      ],
                    }))
                  }
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                >
                  + Add Product
                </button>
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

      {/* Edit Transfer Modal */}
      {showTransferEditModal && editingTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto" style={{marginTop:"50px"}}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Edit Stock Transfer
              </h3>
              <button
                onClick={() => setShowTransferEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateStockPicking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference
                </label>
                <input
                  type="text"
                  required
                  value={stockPickingForm.reference}
                  onChange={(e) =>
                    setStockPickingForm((f) => ({
                      ...f,
                      reference: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  required
                  value={stockPickingForm.picking_type}
                  onChange={(e) =>
                    setStockPickingForm((f) => ({
                      ...f,
                      picking_type: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2"
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
                      setStockPickingForm((f) => ({
                        ...f,
                        source_location: e.target.value,
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name || loc.title}
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
                      setStockPickingForm((f) => ({
                        ...f,
                        destination_location: e.target.value,
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name || loc.title}
                      </option>
                    ))}
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
                    setStockPickingForm((f) => ({
                      ...f,
                      scheduled_date: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Products
                </label>
                {stockPickingForm.moves.map((move, idx) => (
                  <div key={idx} className="flex space-x-2 mb-2">
                    <select
                      required
                      value={move.product}
                      onChange={(e) => {
                        const moves = [...stockPickingForm.moves];
                        moves[idx].product = e.target.value;
                        setStockPickingForm((f) => ({ ...f, moves }));
                      }}
                      className="flex-1 border rounded-lg px-2 py-1"
                    >
                      <option value="">Select Product</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={move.reserved_quantity}
                      onChange={(e) => {
                        const moves = [...stockPickingForm.moves];
                        moves[idx].reserved_quantity = e.target.value;
                        setStockPickingForm((f) => ({ ...f, moves }));
                      }}
                      placeholder="Qty"
                      className="w-24 border rounded-lg px-2 py-1"
                    />
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={move.price}
                      onChange={(e) => {
                        const moves = [...stockPickingForm.moves];
                        moves[idx].price = e.target.value;
                        setStockPickingForm((f) => ({ ...f, moves }));
                      }}
                      placeholder="Price"
                      className="w-24 border rounded-lg px-2 py-1"
                    />
                    {stockPickingForm.moves.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const moves = stockPickingForm.moves.filter(
                            (_, i) => i !== idx
                          );
                          setStockPickingForm((f) => ({ ...f, moves }));
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setStockPickingForm((f) => ({
                      ...f,
                      moves: [
                        ...f.moves,
                        { product: "", reserved_quantity: "", price: "" },
                      ],
                    }))
                  }
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                >
                  + Add Product
                </button>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTransferEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Update Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Detail Modal */}
      {showTransferDetailModal && selectedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedTransfer.reference}
                </h3>
                {selectedTransfer.title && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedTransfer.title}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowTransferDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Transfer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Type
                  </label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">
                    {selectedTransfer.picking_type}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <p className="mt-1">
                    <span
                      className={clsx(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        selectedTransfer.status === "new"
                          ? "bg-yellow-100 text-yellow-700"
                          : selectedTransfer.status === "confirmed"
                          ? "bg-blue-100 text-blue-700"
                          : selectedTransfer.status === "done"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      )}
                    >
                      {selectedTransfer.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Source Location
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {locations.find(
                      (l) => l.id === selectedTransfer.source_location
                    )?.name ||
                      locations.find(
                        (l) => l.id === selectedTransfer.source_location
                      )?.title ||
                      "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Destination Location
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {locations.find(
                      (l) => l.id === selectedTransfer.destination_location
                    )?.name ||
                      locations.find(
                        (l) => l.id === selectedTransfer.destination_location
                      )?.title ||
                      "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Scheduled Date
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedTransfer.scheduled_date
                      ? new Date(
                          selectedTransfer.scheduled_date
                        ).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Created
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedTransfer.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Products Table */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Products
                </h4>
                <div className="border rounded-lg overflow-hidden">
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
                          Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {selectedTransfer.moves.map((move) => {
                        const product = products.find(
                          (p) => p.id === move.product
                        );
                        const total =
                          parseFloat(move.reserved_quantity || "0") *
                          parseFloat(move.price || "0");
                        return (
                          <tr key={move.id}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {product?.name || move.product}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {move.reserved_quantity}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              ${parseFloat(move.price || "0").toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              ${total.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                {selectedTransfer.status === "new" && (
                  <>
                    <button
                      onClick={() => handleEditTransfer(selectedTransfer)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Edit Transfer
                    </button>
                    <button
                      onClick={() => handleConfirmTransfer(selectedTransfer.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Confirm Transfer
                    </button>
                  </>
                )}
                {selectedTransfer.status === "confirmed" && (
                  <button
                    onClick={() => handleCompleteTransfer(selectedTransfer.id)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Complete Transfer
                  </button>
                )}
                {(selectedTransfer.status === "new" ||
                  selectedTransfer.status === "confirmed") && (
                  <button
                    onClick={() => handleCancelTransfer(selectedTransfer.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel Transfer
                  </button>
                )}
                {selectedTransfer.status === "done" && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium">
                      Transfer Completed
                    </span>
                  </div>
                )}
                {selectedTransfer.status === "cancel" && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium">
                      Transfer Cancelled
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setShowTransferDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto" style={{marginTop:"50px"}}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Adjust Stock - {selectedProduct.name}
              </h3>
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

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <input
                  type="text"
                  value={selectedProduct.name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock
                </label>
                <input
                  type="text"
                  value={selectedProduct.stockQuantity}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <select
                  required
                  value={adjustmentForm.location}
                  onChange={(e) =>
                    setAdjustmentForm((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name || loc.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={adjustmentForm.quantity}
                  onChange={(e) =>
                    setAdjustmentForm((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Adjustment *
                </label>
                <input
                  type="text"
                  required
                  value={adjustmentForm.reason}
                  onChange={(e) =>
                    setAdjustmentForm((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Stock count, Damaged goods, etc."
                />
              </div>

              {/* Notes ni olib tashlash yoki optional qilish */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={adjustmentForm.notes}
                  onChange={(e) =>
                    setAdjustmentForm((prev) => ({
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
                  Adjust Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
