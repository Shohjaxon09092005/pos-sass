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
export default function ProductsPage() {
  const { user, company, selectedCompanyId, companies, updateCompany } =
    useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

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
          const formattedProducts: Product[] = apiProducts.map((product) => ({
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
            stockQuantity: 0,
            minStock: 5,
            maxStock: 100,
            taxRate: 0.08,
          }));
          setProducts(formattedProducts);
        } else if (Array.isArray(data)) {
          // Agar to'g'ridan-to'g'ri array kelgan bo'lsa
          const apiProducts: ApiProduct[] = data;
          const formattedProducts: Product[] = apiProducts.map((product) => ({
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
            stockQuantity: 0,
            minStock: 5,
            maxStock: 100,
            taxRate: 0.08,
          }));
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
    }
  }, [selectedCompanyId]);

  // Kompaniya o'zgartirilganda yuklash
  useEffect(() => {
    const handleCompanyChange = () => {
      console.log("Company changed event received");
      if (selectedCompanyId) {
        fetchProducts();
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
    if (!window.confirm("Haqiqatan ham ushbu mahsulotni oʻchirmoqchimisiz?"))
      return;

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

  const getStockStatus = (product: Product) => {
    if ((product.stockQuantity || 0) <= (product.minStock || 0)) return "low";
    if ((product.stockQuantity || 0) >= (product.maxStock || 0)) return "high";
    return "normal";
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case "low":
        return "text-red-600 bg-red-100";
      case "high":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
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
        <p className="text-gray-500 text-lg">
          Iltimos, avval kompaniya tanlang
        </p>
        <p className="text-gray-400 text-sm">
          Sidebar dagi kompaniya ro'yxatidan birini tanlang
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-600">Manage your product catalog</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Product</span>
        </button>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Products
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {products.length}
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
                $
                {products
                  .reduce((sum, p) => sum + (p.stockQuantity || 0) * p.cost, 0)
                  .toFixed(2)}
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
                Low Stock Items
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {
                  products.filter(
                    (p) => (p.stockQuantity || 0) <= (p.minStock || 0)
                  ).length
                }
              </p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
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
              placeholder="Search products..."
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
              <option value="all">All Categories</option>
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
                  Product
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
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
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
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
                        ${product.price.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.stockQuantity} / {product.maxStock}
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {product.minStock}
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
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                      {stockStatus !== "normal" && (
                        <span
                          className={clsx(
                            "inline-flex px-2 py-1 text-xs font-medium rounded-full ml-2",
                            getStockStatusColor(stockStatus)
                          )}
                        >
                          {stockStatus === "low" ? "Low Stock" : "Overstocked"}
                        </span>
                      )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Add New Product
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
                    Iltimos, avval kompaniya tanlang!
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleAddProduct} className="space-y-4">
              {/* Rasm yuklash */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Image
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
                      <span>Upload Image</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU *
                  </label>
                  <input
                    type="text"
                    name="sku"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter SKU"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
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
                    Unit *
                  </label>
                  <select
                    name="unit"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Unit</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.title} ({unit.abbreviation})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost *
                  </label>
                  <input
                    type="number"
                    name="cost"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barcode
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter barcode"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference
                  </label>
                  <input
                    type="text"
                    name="reference"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter reference"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter product notes"
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
                  Cancel
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
                  {selectedCompanyId ? "Add Product" : "Kompaniya Tanlang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Product</h3>
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
                  Mahsulot rasmi
                  <span className="text-gray-500 text-sm ml-1">
                    (Ixtiyoriy)
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
                      <span>Rasm yangilash</span>
                    </label>
                    {imageFile && (
                      <p className="text-sm text-green-600">
                        Yangi rasm: {imageFile.name}
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
                      Rasmni olib tashlash
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Agar yangi rasm tanlamasangiz, mavjud rasm saqlanib qoladi
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
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
                    SKU *
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
                    Category *
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
                    Unit *
                  </label>
                  <select
                    name="unit"
                    defaultValue={editingProduct.unit}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Unit</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.title} ({unit.abbreviation})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
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
                    Cost *
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
                    Barcode
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
                    Reference
                  </label>
                  <input
                    type="text"
                    name="reference"
                    defaultValue={editingProduct.reference || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
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
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Yangilash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* // Product Detail Modal - rasmni ko'rsatish qismini yangilaymiz */}
      {showDetailModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Mahsulot Tafsilotlari
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
                    Mahsulot nomi
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedProduct.title}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    SKU
                  </label>
                  <p className="text-gray-900 font-mono">
                    {selectedProduct.sku}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Kategoriya
                  </label>
                  <p className="text-gray-900">
                    {getCategoryName(selectedProduct.category)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Oʻlchov birligi
                  </label>
                  <p className="text-gray-900">
                    {getUnitName(selectedProduct.unit)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Narx
                  </label>
                  <p className="text-lg font-semibold text-green-600">
                    ${selectedProduct.price.toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Xarajat
                  </label>
                  <p className="text-gray-900">
                    ${selectedProduct.cost.toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Shtrix kod
                  </label>
                  <p className="text-gray-900">
                    {selectedProduct.barcode || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Referens
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
                  Izoh
                </label>
                <p className="text-gray-900">
                  {selectedProduct.notes || "Izoh mavjud emas"}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Holati
                  </label>
                  <span
                    className={clsx(
                      "inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1",
                      selectedProduct.isActive
                        ? "text-green-800 bg-green-100"
                        : "text-gray-800 bg-gray-100"
                    )}
                  >
                    {selectedProduct.isActive ? "Faol" : "Nofaol"}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Umumiy qiymati
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    $
                    {(
                      (selectedProduct.stockQuantity || 0) *
                      selectedProduct.cost
                    ).toFixed(2)}
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
                Yopish
              </button>
              <button
                onClick={() => {
                  setEditingProduct(selectedProduct);
                  setShowDetailModal(false);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Tahrirlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
