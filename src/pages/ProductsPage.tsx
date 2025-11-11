// components/ProductsPage.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Product, Category, Unit } from "../types";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Package,
  DollarSign,
  BarChart3,
  Eye,
  X,
  Upload,
  Image as ImageIcon,
  Building,
} from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "react-i18next";

interface ApiProduct {
  id: string;
  title: string;
  notes: string;
  image: string;
  price: string;
  cost: string;
  barcode: string;
  reference: string;
  sku: string;
  company: number;
  created_by: number;
  updated_by: number;
  category: string;
  unit: string;
  current_stock?: number | string;
}

interface CategoriesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Category[];
}

interface UnitsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Unit[];
}

const API_URL = import.meta.env.VITE_API_URL;
interface DashboardData {
  total_products: number;
  active_products: number;
  inactive_products: number;
  total_value: number;
  low_stock_products: number;
}

export default function ProductsPage() {
  const { t, i18n } = useTranslation("products");
  const { user, company, selectedCompanyId, companies, updateCompany } =
    useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Dashboard ma'lumotlarini olish
  const fetchDashboard = async () => {
    if (!selectedCompanyId) {
      setDashboardData(null);
      return;
    }
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/v1/products/dashboard/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data: DashboardData = await response.json();
        setDashboardData(data);
      } else {
        console.error("Failed to fetch dashboard:", response.status);
        setDashboardData(null);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
      setDashboardData(null);
    }
  };

  /// API dan ma'lumotlarni olish
  const fetchProducts = async () => {
    if (!selectedCompanyId) {
      setProducts([]);
      setLoading(false);
      return;
    }
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

        // Pagination response ni tekshirish
        if (data && data.results && Array.isArray(data.results)) {
          const apiProducts: ApiProduct[] = data.results;
          const formattedProducts: Product[] = apiProducts.map((product) => {
            const cs =
              typeof product.current_stock === "number"
                ? product.current_stock
                : parseFloat((product.current_stock as any) ?? "0") || 0;
            return {
              id: product.id,
              title: product.title,
              notes: product.notes,
              image: product.image,
              price: parseFloat(product.price) || 0,
              cost: parseFloat(product.cost) || 0,
              barcode: product.barcode,
              reference: product.reference,
              sku: product.sku,
              company: product.company,
              created_by: product.created_by,
              updated_by: product.updated_by,
              category: product.category,
              unit: product.unit,
              isActive: true,
              current_stock: cs,
              stockQuantity: cs,
            };
          });
          setProducts(formattedProducts);
        } else if (Array.isArray(data)) {
          // Agar to'g'ridan-to'g'ri array kelgan bo'lsa
          const apiProducts: ApiProduct[] = data;
          const formattedProducts: Product[] = apiProducts.map((product) => {
            const cs =
              typeof product.current_stock === "number"
                ? product.current_stock
                : parseFloat((product.current_stock as any) ?? "0") || 0;
            return {
              id: product.id,
              title: product.title,
              notes: product.notes,
              image: product.image,
              price: parseFloat(product.price) || 0,
              cost: parseFloat(product.cost) || 0,
              barcode: product.barcode,
              reference: product.reference,
              sku: product.sku,
              company: product.company,
              created_by: product.created_by,
              updated_by: product.updated_by,
              category: product.category,
              unit: product.unit,
              isActive: true,
              current_stock: cs,
              stockQuantity: cs,
            };
          });
          setProducts(formattedProducts);
        } else {
          console.error("Unexpected API response format:", data);
          setProducts([]);
        }
      } else {
        console.error("Failed to fetch products:", response.status);
        setProducts([]);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("access_token");
      // To'g'ri kategoriya endpointi
      const response = await fetch(`${API_URL}/api/v1/products/categories/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: CategoriesResponse = await response.json();
        setCategories(data.results);
      } else {
        console.error("Failed to fetch categories:", response.status);
        setCategories([]);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setCategories([]);
    }
  };

  const fetchUnits = async () => {
    try {
      const token = localStorage.getItem("access_token");
      // Units endpointi mavjud emas bo'lsa, dasturiy ravishda yaratish
      // Yoki API da units endpointi boshqa joyda bo'lishi mumkin
      const response = await fetch(`${API_URL}/api/v1/products/units/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: UnitsResponse = await response.json();
        setUnits(data.results);
      } else {
        // Agar units endpointi mavjud bo'lmasa, default units yaratish
        console.warn("Units endpoint not found, using default units");
        const defaultUnits: Unit[] = [
          { id: "1", title: "Piece", abbreviation: "pcs" },
          { id: "2", title: "Kilogram", abbreviation: "kg" },
          { id: "3", title: "Liter", abbreviation: "L" },
          { id: "4", title: "Meter", abbreviation: "m" },
          { id: "5", title: "Box", abbreviation: "box" },
        ];
        setUnits(defaultUnits);
      }
    } catch (error) {
      console.error("Failed to fetch units:", error);
      // Xatolik yuz berganda ham default units yaratish
      const defaultUnits: Unit[] = [
        { id: "1", title: "Piece", abbreviation: "pcs" },
        { id: "2", title: "Kilogram", abbreviation: "kg" },
        { id: "3", title: "Liter", abbreviation: "L" },
        { id: "4", title: "Meter", abbreviation: "m" },
        { id: "5", title: "Box", abbreviation: "box" },
      ];
      setUnits(defaultUnits);
    }
  };

  // components/ProductsPage.tsx - useEffect qo'shing
  useEffect(() => {
    console.log("Selected Company ID changed:", selectedCompanyId);
    if (selectedCompanyId) {
      fetchProducts();
      fetchCategories();
      fetchUnits();
      fetchDashboard();
    }
  }, [selectedCompanyId]);

  // Kompaniya o'zgartirilganda yuklash
  useEffect(() => {
    const handleCompanyChange = () => {
      console.log("Company changed event received");
      if (selectedCompanyId) {
        fetchProducts();
        fetchDashboard();
      }
    };

    window.addEventListener("companyChanged", handleCompanyChange);
    return () => {
      window.removeEventListener("companyChanged", handleCompanyChange);
    };
  }, [selectedCompanyId]);

  // components/ProductsPage.tsx - handleAddProduct ni soddalashtiring
  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Kompaniya tanlanganligini tekshirish
    if (!selectedCompanyId) {
      alert("Iltimos, avval kompaniya tanlang!");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();

      // Asosiy maydonlar
      formData.append(
        "title",
        (e.currentTarget.elements.namedItem("title") as HTMLInputElement).value
      );
      formData.append(
        "sku",
        (e.currentTarget.elements.namedItem("sku") as HTMLInputElement).value
      );
      formData.append(
        "price",
        (e.currentTarget.elements.namedItem("price") as HTMLInputElement).value
      );
      formData.append(
        "cost",
        (e.currentTarget.elements.namedItem("cost") as HTMLInputElement).value
      );

      // Initial/Input Stock for creation
      const inputStockValue = (
        e.currentTarget.elements.namedItem("input_stock") as HTMLInputElement
      )?.value;
      if (inputStockValue !== undefined) {
        formData.append("input_stock", inputStockValue || "0");
      }

      // Category va unit - agar mavjud bo'lsa
      const categoryValue = (
        e.currentTarget.elements.namedItem("category") as HTMLSelectElement
      ).value;
      const unitValue = (
        e.currentTarget.elements.namedItem("unit") as HTMLSelectElement
      ).value;

      if (categoryValue) formData.append("category", categoryValue);
      if (unitValue) formData.append("unit", unitValue);

      // Qo'shimcha maydonlar
      formData.append(
        "barcode",
        (e.currentTarget.elements.namedItem("barcode") as HTMLInputElement)
          .value || ""
      );
      formData.append(
        "reference",
        (e.currentTarget.elements.namedItem("reference") as HTMLInputElement)
          .value || ""
      );
      formData.append(
        "notes",
        (e.currentTarget.elements.namedItem("notes") as HTMLTextAreaElement)
          .value || ""
      );

      // KOMPANIYA - backendda foydalanuvchining selected_company si orqali avtomatik olinadi
      // Shuning uchun bu yerda company ni yuborish shart emas
      // formData.append("company", selectedCompanyId.toString()); // BU QATORNI O'CHIRISH MUMKIN

      // Rasm
      if (imageFile) {
        formData.append("image", imageFile);
      }

      console.log("FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await fetch(`${API_URL}/api/v1/products/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        await fetchProducts();
        setShowAddModal(false);
        resetForm();
        alert("Mahsulot muvaffaqiyatli qoʻshildi");
      } else {
        const errorData = await response.json();
        console.error("Failed to add product:", errorData);

        let errorMessage = "Mahsulot qoʻshish muvaffaqiyatsiz tugadi";
        if (errorData.company) {
          errorMessage += ": " + errorData.company.join(", ");
        } else if (errorData.detail) {
          errorMessage += ": " + errorData.detail;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Tarmoq xatosi yuz berdi");
    }
  };

  // Mahsulotni yangilash - FormData bilan
  const handleUpdateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();

      // Faqat o'zgartirilgan maydonlarni yuborish
      formData.append(
        "title",
        (e.currentTarget.elements.namedItem("title") as HTMLInputElement).value
      );
      formData.append(
        "notes",
        (e.currentTarget.elements.namedItem("notes") as HTMLTextAreaElement)
          .value
      );
      formData.append(
        "price",
        (e.currentTarget.elements.namedItem("price") as HTMLInputElement).value
      );
      formData.append(
        "cost",
        (e.currentTarget.elements.namedItem("cost") as HTMLInputElement).value
      );

      // Input Stock (optional for update)
      const inputStockValue = (
        e.currentTarget.elements.namedItem("input_stock") as HTMLInputElement
      )?.value;
      if (inputStockValue !== undefined) {
        formData.append("input_stock", inputStockValue || "0");
      }
      formData.append(
        "barcode",
        (e.currentTarget.elements.namedItem("barcode") as HTMLInputElement)
          .value
      );
      formData.append(
        "reference",
        (e.currentTarget.elements.namedItem("reference") as HTMLInputElement)
          .value
      );
      formData.append(
        "sku",
        (e.currentTarget.elements.namedItem("sku") as HTMLInputElement).value
      );

      formData.append(
        "category",
        (e.currentTarget.elements.namedItem("category") as HTMLSelectElement)
          .value
      );
      formData.append(
        "unit",
        (e.currentTarget.elements.namedItem("unit") as HTMLSelectElement).value
      );

      // RASM MUAMMOSINI TO'G'RILASH
      if (imageFile) {
        // Agar yangi rasm tanlangan bo'lsa
        formData.append("image", imageFile);
      } else if (editingProduct.image) {
        // Agar mavjud rasm bo'lsa, lekin uni string sifatida yubormang
        // Backend mavjud rasmni o'zi saqlab qoladi
        // Hech narsa qilmaymiz
      }

      console.log("Update FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value instanceof File ? `File: ${value.name}` : value);
      }

      // PATCH metodidan foydalaning
      const response = await fetch(
        `${API_URL}/api/v1/products/${editingProduct.id}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            // Content-Type ni O'CHIRISH - FormData bilan ishlaganda
          },
          body: formData,
        }
      );

      if (response.ok) {
        await fetchProducts();
        setEditingProduct(null);
        resetForm();
        alert("Mahsulot muvaffaqiyatli yangilandi");
      } else {
        const errorData = await response.json();
        console.error("Failed to update product:", errorData);

        let errorMessage = "Mahsulotni yangilash muvaffaqiyatsiz tugadi";
        if (errorData.image) {
          errorMessage += ": " + errorData.image.join(", ");
        } else if (errorData.detail) {
          errorMessage += ": " + errorData.detail;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Tarmoq xatosi yuz berdi");
    }
  };

  // Rasm yuklash funksiyasini yangilash
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Fayl hajmini tekshirish
      if (file.size > 5 * 1024 * 1024) {
        alert("Rasm hajmi 5MB dan katta bo'lmasligi kerak");
        return;
      }

      // Fayl turini tekshirish
      if (!file.type.startsWith("image/")) {
        alert("Faqat rasm fayllari yuklanishi mumkin");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // Agar fayl tanlanmagan bo'lsa, preview ni tozalash
      setImageFile(null);
      setImagePreview("");
    }
  };

  // Detail modal uchun rasmni ko'rsatish
  useEffect(() => {
    if (selectedProduct && selectedProduct.image) {
      // Detail modal uchun alohida state kerak emas, to'g'ridan-to'g'ri product.image dan foydalanish mumkin
    }
  }, [selectedProduct]);

  // Formni qayta tiklash funksiyasini yangilash
  const resetForm = () => {
    setImageFile(null);
    setImagePreview("");
    // Form elementlarini qayta tiklash kerak bo'lsa
    if (showAddModal) {
      setShowAddModal(false);
    }
    if (editingProduct) {
      setEditingProduct(null);
    }
  };

  // Mahsulotni ko'rish modalida rasmni ko'rsatish
  const renderProductImage = (product: Product) => {
    if (product.image) {
      return (
        <img
          src={product.image}
          alt={product.title}
          className="h-40 w-40 rounded-lg object-cover mx-auto"
          onError={(e) => {
            // Agar rasm yuklanmasa, default icon ko'rsatish
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      );
    }
    return (
      <div className="h-40 w-40 bg-gray-200 rounded-lg flex items-center justify-center mx-auto">
        <ImageIcon className="h-16 w-16 text-gray-400" />
      </div>
    );
  };

  // Mahsulotlar jadvalidagi rasmni ko'rsatish
  const renderProductTableImage = (product: Product) => {
    if (product.image) {
      return (
        <img
          src={product.image}
          alt={product.title}
          className="h-10 w-10 rounded-lg object-cover"
          onError={(e) => {
            // Agar rasm yuklanmasa, default icon ko'rsatish
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      );
    }
    return <Package className="h-5 w-5 text-gray-500" />;
  };

  // Mahsulotni o'chirish
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm(t("deleteConfirmation"))) return;
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/v1/products/${productId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchProducts();
        alert("Mahsulot muvaffaqiyatli oʻchirildi");
      } else {
        console.error("Failed to delete product");
        alert("Mahsulotni oʻchirish muvaffaqiyatsiz tugadi");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Xatolik yuz berdi");
    }
  };
  useEffect(() => {
    if (selectedCompanyId) {
      fetchProducts();
      fetchCategories();
      fetchUnits();
    }
  }, [selectedCompanyId]);
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.title : "Noma'lum";
  };

  const getUnitName = (unitId: string) => {
    const unit = units.find((unit) => unit.id === unitId);
    return unit ? `${unit.title} (${unit.abbreviation})` : "Noma'lum";
  };

  const getCurrentStockValue = (product: Product) => {
    return (product.current_stock ?? product.stockQuantity ?? 0) as number;
  };

  // Loading dan keyin kompaniya tanlanganligini tekshirish
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Agar kompaniya tanlanmagan bo'lsa
  if (!selectedCompanyId) {
    return (
      <div className="flex items-center justify-center h-64 flex-col space-y-4">
        <Building className="h-16 w-16 text-gray-400" />
        <p className="text-gray-500 text-lg">{t("pleaseSelectCompany")}</p>
        <p className="text-gray-400 text-sm">{t("selectCompany")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("products")}</h1>
          <p className="text-sm text-gray-600">{t("manageProductCatalog")}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>{t("addProduct")}</span>
        </button>
      </div>
      {/* Stats - Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {/* Total Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">
                {t("totalProducts")}
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1 md:mt-2">
                {dashboardData?.total_products ?? products.length}
              </p>
            </div>
            <div className="bg-blue-500 p-2 md:p-3 rounded-lg">
              <Package className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Active Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">
                {t("activeProducts")}
              </p>
              <p className="text-xl md:text-2xl font-bold text-green-600 mt-1 md:mt-2">
                {dashboardData?.active_products ?? 0}
              </p>
            </div>
            <div className="bg-green-500 p-2 md:p-3 rounded-lg">
              <Package className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Inactive Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">
                {t("inactiveProducts")}
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-600 mt-1 md:mt-2">
                {dashboardData?.inactive_products ?? 0}
              </p>
            </div>
            <div className="bg-gray-500 p-2 md:p-3 rounded-lg">
              <Package className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Total Value */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">
                {t("totalValue")}
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1 md:mt-2">
                {dashboardData?.total_value?.toFixed(2) ?? "0.00"} UZS
              </p>
            </div>
            <div className="bg-green-500 p-2 md:p-3 rounded-lg">
              <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">
                {t("lowStockItems")}
              </p>
              <p className="text-xl md:text-2xl font-bold text-orange-600 mt-1 md:mt-2">
                {dashboardData?.low_stock_products ?? 0}
              </p>
            </div>
            <div className="bg-orange-500 p-2 md:p-3 rounded-lg">
              <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder={t("searchProducts")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t("allCategories")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("product")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("category")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("sku")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("price")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("stock")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("status")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.title}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getUnitName(product.unit)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {getCategoryName(product.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900">
                        {product.sku}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {(product.price || 0).toFixed(2)} UZS
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getCurrentStockValue(product)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={clsx(
                          "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                          product.isActive
                            ? "text-green-800 bg-green-100"
                            : "text-gray-800 bg-gray-100"
                        )}
                      >
                        {product.isActive ? t("active") : t("inactive")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowDetailModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div
            className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
            style={{ marginTop: "50px" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {t("addNewProduct")}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {!selectedCompanyId && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <Building className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800">
                    {t("pleaseSelectCompany")}
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleAddProduct} className="space-y-4">
              {/* Rasm yuklash */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("productImage")}
                </label>
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="image"
                      className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{t("uploadImage")}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("inputStock")} ({t("initialStock")})
                  </label>
                  <input
                    type="number"
                    name="input_stock"
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("productName")} *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t("enterProductName")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("sku")} *
                  </label>
                  <input
                    type="text"
                    name="sku"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t("enterSKU")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("category")} *
                  </label>
                  <select
                    name="category"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t("selectCategory")}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("unit")} *
                  </label>
                  <select
                    name="unit"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t("selectUnit")}</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.title} ({unit.abbreviation})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("price")} *
                  </label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t("enterPrice")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("cost")} *
                  </label>
                  <input
                    type="number"
                    name="cost"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t("enterCost")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("barcode")}
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t("enterBarcode")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("reference")}
                  </label>
                  <input
                    type="text"
                    name="reference"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t("enterReference")}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("notes")}
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t("enterProductNotes")}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={!selectedCompanyId}
                  className={clsx(
                    "px-4 py-2 text-white rounded-lg font-medium transition-colors",
                    selectedCompanyId
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-400 cursor-not-allowed"
                  )}
                >
                  {selectedCompanyId ? t("addProduct") : t("companyRequired")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
            style={{ marginTop: "50px" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">{t("editProduct")}</h3>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4">
              {/* Rasm yuklash - faqat yangi rasm kerak bo'lganda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("productImage")}
                  <span className="text-gray-500 text-sm ml-1">
                    {t("optional")}
                  </span>
                </label>
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Yangi rasm"
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    ) : editingProduct.image ? (
                      <img
                        src={editingProduct.image}
                        alt={editingProduct.title}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex flex-col space-y-2">
                    <input
                      type="file"
                      id="edit-image"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="edit-image"
                      className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{t("uploadImage")}</span>
                    </label>
                    {imageFile && (
                      <p className="text-sm text-green-600">
                        {t("newImage")}: {imageFile.name}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                      }}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      {t("removeImage")}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t("existingImageKept")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("productName")} *
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingProduct.title}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("sku")} *
                  </label>
                  <input
                    type="text"
                    name="sku"
                    defaultValue={editingProduct.sku}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("category")} *
                  </label>
                  <select
                    name="category"
                    defaultValue={editingProduct.category}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("unit")} *
                  </label>
                  <select
                    name="unit"
                    defaultValue={editingProduct.unit}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t("selectUnit")}</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.title} ({unit.abbreviation})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("price")} *
                  </label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    defaultValue={editingProduct.price}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("cost")} *
                  </label>
                  <input
                    type="number"
                    name="cost"
                    step="0.01"
                    defaultValue={editingProduct.cost}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("barcode")}
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    defaultValue={editingProduct.barcode || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("reference")}
                  </label>
                  <input
                    type="text"
                    name="reference"
                    defaultValue={editingProduct.reference || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("currentStock")} (read-only)
                  </label>
                  <input
                    type="number"
                    value={
                      editingProduct.current_stock ??
                      editingProduct.stockQuantity ??
                      0
                    }
                    readOnly
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("inputStock")} (adjustment)
                  </label>
                  <input
                    type="number"
                    name="input_stock"
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("notes")}
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    defaultValue={editingProduct.notes || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {t("update")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* // Product Detail Modal - rasmni ko'rsatish qismini yangilaymiz */}
      {showDetailModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
            style={{ marginTop: "50px" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {t("productDetails")}
              </h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedProduct(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Rasmni ko'rsatish */}
            <div className="flex justify-center mb-6">
              {renderProductImage(selectedProduct)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t("productName")}
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedProduct.title}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t("sku")}
                  </label>
                  <p className="text-gray-900 font-mono">
                    {selectedProduct.sku}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t("category")}
                  </label>
                  <p className="text-gray-900">
                    {getCategoryName(selectedProduct.category)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t("unit")}
                  </label>
                  <p className="text-gray-900">
                    {getUnitName(selectedProduct.unit)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t("price")}
                  </label>
                  <p className="text-lg font-semibold text-green-600">
                    {(selectedProduct.price || 0).toFixed(2)} UZS
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t("cost")}
                  </label>
                  <p className="text-gray-900">
                    {(selectedProduct.cost || 0).toFixed(2)} UZS
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t("barcode")}
                  </label>
                  <p className="text-gray-900">
                    {selectedProduct.barcode || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t("reference")}
                  </label>
                  <p className="text-gray-900">
                    {selectedProduct.reference || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  {t("notes")}
                </label>
                <p className="text-gray-900">
                  {selectedProduct.notes || t("noNotes")}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t("status")}
                  </label>
                  <span
                    className={clsx(
                      "inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1",
                      selectedProduct.isActive
                        ? "text-green-800 bg-green-100"
                        : "text-gray-800 bg-gray-100"
                    )}
                  >
                    {selectedProduct.isActive ? t("active") : t("inactive")}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t("totalValue")}
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {(
                      (getCurrentStockValue(selectedProduct) || 0) *
                      selectedProduct.cost
                    ).toFixed(2)}{" "}
                    UZS
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedProduct(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t("close")}
              </button>
              <button
                onClick={() => {
                  setEditingProduct(selectedProduct);
                  setShowDetailModal(false);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {t("edit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
