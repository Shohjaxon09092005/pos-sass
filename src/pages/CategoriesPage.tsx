// components/CategoriesPage.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Category, Unit } from "../types";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Folder,
  FolderOpen,
  X,
  Save,
  ChevronRight,
  ChevronDown,
  Scale,
  Ruler,
} from "lucide-react";
import { clsx } from "clsx";
const API_URL = import.meta.env.VITE_API_URL;
export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [unitSearchTerm, setUnitSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [activeTab, setActiveTab] = useState<"categories" | "units">(
    "categories"
  );

  // Kategoriyalarni yuklash
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_URL}/api/v1/products/categories/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("category_data", data);
        setCategories(data.results);
        setFilteredCategories(data.results);
      } else {
        console.error("Failed to fetch categories:", response.status);
        setCategories([]);
        setFilteredCategories([]);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setCategories([]);
      setFilteredCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Birliklarni yuklash
  const fetchUnits = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_URL}/api/v1/products/units/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("units_data", data);
        setUnits(data.results || data);
        setFilteredUnits(data.results || data);
      } else {
        console.error("Failed to fetch units:", response.status);
        setUnits([]);
        setFilteredUnits([]);
      }
    } catch (error) {
      console.error("Failed to fetch units:", error);
      setUnits([]);
      setFilteredUnits([]);
    } finally {
      setUnitsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchUnits();
  }, []);

  // Kategoriyalar qidiruvini bajarish
  useEffect(() => {
    if (!Array.isArray(categories)) {
      setFilteredCategories([]);
      return;
    }

    if (searchTerm.trim() === "") {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter((category) =>
        category?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  // Birliklar qidiruvini bajarish
  useEffect(() => {
    if (!Array.isArray(units)) {
      setFilteredUnits([]);
      return;
    }

    if (unitSearchTerm.trim() === "") {
      setFilteredUnits(units);
    } else {
      const filtered = units.filter(
        (unit) =>
          unit?.title?.toLowerCase().includes(unitSearchTerm.toLowerCase()) ||
          unit?.abbreviation
            ?.toLowerCase()
            .includes(unitSearchTerm.toLowerCase())
      );
      setFilteredUnits(filtered);
    }
  }, [unitSearchTerm, units]);

  // Kategoriya qo'shish
  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const token = localStorage.getItem("access_token");
      const categoryData = {
        title: formData.get("title") as string,
        parent: (formData.get("parent") as string) || null,
      };

      const response = await fetch(
      `${API_URL}/api/v1/products/categories/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(categoryData),
        }
      );

      if (response.ok) {
        await fetchCategories();
        setShowAddModal(false);
      } else {
        console.error("Failed to add category");
        alert("Kategoriya qoʻshish muvaffaqiyatsiz tugadi");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      alert("Xatolik yuz berdi");
    }
  };

  // Kategoriyani yangilash
  const handleUpdateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCategory) return;

    const formData = new FormData(e.currentTarget);

    try {
      const token = localStorage.getItem("access_token");
      const categoryData = {
        title: formData.get("title") as string,
        parent: (formData.get("parent") as string) || null,
      };

      const response = await fetch(
        `${API_URL}/api/v1/products/categories/${editingCategory.id}/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(categoryData),
        }
      );

      if (response.ok) {
        await fetchCategories();
        setEditingCategory(null);
      } else {
        console.error("Failed to update category");
        alert("Kategoriyani yangilash muvaffaqiyatsiz tugadi");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Xatolik yuz berdi");
    }
  };

  // Kategoriyani o'chirish
  const handleDeleteCategory = async (categoryId: string) => {
    if (
      !window.confirm(
        "Haqiqatan ham ushbu kategoriyani oʻchirmoqchimisiz? Bu amalni bekor qilib boʻlmaydi."
      )
    )
      return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_URL}/api/v1/products/categories/${categoryId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        await fetchCategories();
      } else {
        console.error("Failed to delete category");
        alert(
          "Kategoriyani oʻchirish muvaffaqiyatsiz tugadi. U bilan bogʻliq pastki kategoriyalar yoki mahsulotlar mavjud boʻlishi mumkin."
        );
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Xatolik yuz berdi");
    }
  };

  // Birlik qo'shish
  const handleAddUnit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const token = localStorage.getItem("access_token");
      const unitData = {
        title: formData.get("title") as string,
        abbreviation: formData.get("abbreviation") as string,
      };

      const response = await fetch(
        `${API_URL}/api/v1/products/units/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(unitData),
        }
      );

      if (response.ok) {
        await fetchUnits();
        setShowAddUnitModal(false);
      } else {
        console.error("Failed to add unit");
        alert("Birlik qoʻshish muvaffaqiyatsiz tugadi");
      }
    } catch (error) {
      console.error("Error adding unit:", error);
      alert("Xatolik yuz berdi");
    }
  };

  // Birlikni yangilash
  const handleUpdateUnit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUnit) return;

    const formData = new FormData(e.currentTarget);

    try {
      const token = localStorage.getItem("access_token");
      const unitData = {
        title: formData.get("title") as string,
        abbreviation: formData.get("abbreviation") as string,
      };

      const response = await fetch(
        `${API_URL}/api/v1/products/units/${editingUnit.id}/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(unitData),
        }
      );

      if (response.ok) {
        await fetchUnits();
        setEditingUnit(null);
      } else {
        console.error("Failed to update unit");
        alert("Birlikni yangilash muvaffaqiyatsiz tugadi");
      }
    } catch (error) {
      console.error("Error updating unit:", error);
      alert("Xatolik yuz berdi");
    }
  };

  // Birlikni o'chirish
  const handleDeleteUnit = async (unitId: string) => {
    if (
      !window.confirm(
        "Haqiqatan ham ushbu birlikni oʻchirmoqchimisiz? Bu amalni bekor qilib boʻlmaydi."
      )
    )
      return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_URL}/api/v1/products/units/${unitId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        await fetchUnits();
      } else {
        console.error("Failed to delete unit");
        alert(
          "Birlikni oʻchirish muvaffaqiyatsiz tugadi. U bilan bogʻliq mahsulotlar mavjud boʻlishi mumkin."
        );
      }
    } catch (error) {
      console.error("Error deleting unit:", error);
      alert("Xatolik yuz berdi");
    }
  };

  // Kategoriya nomini olish
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId || !Array.isArray(categories)) return "Asosiy kategoriya";
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.title : "Noma'lum";
  };

  // Pastki kategoriyalarni olish
  const getSubcategories = (categoryId: string) => {
    if (!Array.isArray(categories)) return [];
    return categories.filter((cat) => cat.parent === categoryId);
  };

  // Kategoriyani kengaytirish/yig'ish
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Daraxt strukturasini ko'rsatish
  const renderCategoryTree = (parentId: string | null = null, level = 0) => {
    if (!Array.isArray(categories)) return null;

    const subcategories = categories.filter((cat) => cat.parent === parentId);

    return subcategories.map((category) => {
      const hasChildren = categories.some((cat) => cat.parent === category.id);
      const isExpanded = expandedCategories.has(category.id);

      return (
        <div key={category.id}>
          <div
            className={clsx(
              "flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50",
              level > 0 && "ml-6"
            )}
            style={{ paddingLeft: `${level * 20 + 12}px` }}
          >
            <div className="flex items-center space-x-3">
              {hasChildren ? (
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <div className="w-4" />
              )}
              {hasChildren ? (
                <FolderOpen className="h-5 w-5 text-blue-500" />
              ) : (
                <Folder className="h-5 w-5 text-gray-400" />
              )}
              <span className="font-medium text-gray-900">
                {category.title}
              </span>
              {category.parent && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {getCategoryName(category.parent)}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setEditingCategory(category)}
                className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                title="Tahrirlash"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                className="text-red-600 hover:text-red-900 transition-colors p-1"
                title="O'chirish"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {isExpanded &&
            hasChildren &&
            renderCategoryTree(category.id, level + 1)}
        </div>
      );
    });
  };

  // Array tekshiruvlari statistikalar uchun
  const totalCategories = Array.isArray(categories) ? categories.length : 0;
  const mainCategories = Array.isArray(categories)
    ? categories.filter((cat) => !cat.parent).length
    : 0;
  const subcategories = Array.isArray(categories)
    ? categories.filter((cat) => cat.parent).length
    : 0;
  const totalUnits = Array.isArray(units) ? units.length : 0;

  if (loading && activeTab === "categories") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (unitsLoading && activeTab === "units") {
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
            Kategoriyalar va Birliklar
          </h1>
          <p className="text-sm text-gray-600">
            Mahsulot kategoriyalari va o'lchov birliklarini boshqaring
          </p>
        </div>
        <button
          onClick={() =>
            activeTab === "categories"
              ? setShowAddModal(true)
              : setShowAddUnitModal(true)
          }
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>
            {activeTab === "categories"
              ? "Kategoriya qo'shish"
              : "Birlik qo'shish"}
          </span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab("categories")}
            className={clsx(
              "flex-1 py-2 px-4 rounded-lg font-medium transition-colors",
              activeTab === "categories"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            Kategoriyalar
          </button>
          <button
            onClick={() => setActiveTab("units")}
            className={clsx(
              "flex-1 py-2 px-4 rounded-lg font-medium transition-colors",
              activeTab === "units"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            O'lchov Birliklari
          </button>
        </div>
      </div>

      {activeTab === "categories" ? (
        <>
          {/* Categories Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Jami kategoriyalar
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {totalCategories}
                  </p>
                </div>
                <div className="bg-blue-500 p-3 rounded-lg">
                  <Folder className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Asosiy kategoriyalar
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {mainCategories}
                  </p>
                </div>
                <div className="bg-green-500 p-3 rounded-lg">
                  <FolderOpen className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Pastki kategoriyalar
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {subcategories}
                  </p>
                </div>
                <div className="bg-purple-500 p-3 rounded-lg">
                  <Folder className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Categories Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Kategoriyalarni qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Categories List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Kategoriya tuzilishi
              </h3>
            </div>

            {searchTerm ? (
              // Qidiruv natijalari
              <div>
                {Array.isArray(filteredCategories) &&
                filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <Folder className="h-5 w-5 text-blue-500" />
                        <div>
                          <span className="font-medium text-gray-900">
                            {category.title}
                          </span>
                          {category.parent && (
                            <div className="text-sm text-gray-500">
                              Ota-kategoriya: {getCategoryName(category.parent)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingCategory(category)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-900 transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    Sizning qidiruvingizga mos kategoriyalar topilmadi.
                  </div>
                )}
              </div>
            ) : (
              // Daraxt strukturası
              <div>
                {Array.isArray(categories) &&
                categories.filter((cat) => !cat.parent).length > 0 ? (
                  renderCategoryTree()
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    Kategoriyalar topilmadi. Birinchi kategoriyani yaratishni
                    boshlang.
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Units Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Jami birliklar
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {totalUnits}
                  </p>
                </div>
                <div className="bg-blue-500 p-3 rounded-lg">
                  <Scale className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    O'lchov birliklari
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {totalUnits}
                  </p>
                </div>
                <div className="bg-green-500 p-3 rounded-lg">
                  <Ruler className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Faol birliklar
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {totalUnits}
                  </p>
                </div>
                <div className="bg-purple-500 p-3 rounded-lg">
                  <Scale className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Units Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Birliklarni qidirish..."
                value={unitSearchTerm}
                onChange={(e) => setUnitSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Units List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
              <h3 className="text-lg font-semibold text-gray-900">
                O'lchov Birliklari
              </h3>
            </div>

            <div>
              {Array.isArray(filteredUnits) && filteredUnits.length > 0 ? (
                filteredUnits.map((unit) => (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Scale className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 block">
                          {unit.title}
                        </span>
                        <span className="text-sm text-gray-500">
                          {unit.abbreviation}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingUnit(unit)}
                        className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUnit(unit.id)}
                        className="text-red-600 hover:text-red-900 transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  {unitSearchTerm
                    ? "Sizning qidiruvingizga mos birliklar topilmadi."
                    : "Birliklar topilmadi. Birinchi birlikni yaratishni boshlang."}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Yangi kategoriya qo'shish
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategoriya nomi *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Kategoriya nomini kiriting"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ota-kategoriya
                </label>
                <select
                  name="parent"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">
                    Asosiy kategoriya (ota-kategoriyasiz)
                  </option>
                  {Array.isArray(categories) &&
                    categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.title}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Kategoriya qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Kategoriyani tahrirlash
              </h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategoriya nomi *
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingCategory.title}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ota-kategoriya
                </label>
                <select
                  name="parent"
                  defaultValue={editingCategory.parent || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">
                    Asosiy kategoriya (ota-kategoriyasiz)
                  </option>
                  {Array.isArray(categories) &&
                    categories
                      .filter((cat) => cat.id !== editingCategory.id)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.title}
                        </option>
                      ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
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

      {/* Add Unit Modal */}
      {showAddUnitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Yangi birlik qo'shish
              </h3>
              <button
                onClick={() => setShowAddUnitModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddUnit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Birlik nomi *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masalan: Kilogramm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qisqartma *
                </label>
                <input
                  type="text"
                  name="abbreviation"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masalan: kg"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddUnitModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Birlik qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Unit Modal */}
      {editingUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Birlikni tahrirlash
              </h3>
              <button
                onClick={() => setEditingUnit(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateUnit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Birlik nomi *
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingUnit.title}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qisqartma *
                </label>
                <input
                  type="text"
                  name="abbreviation"
                  defaultValue={editingUnit.abbreviation}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUnit(null)}
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
