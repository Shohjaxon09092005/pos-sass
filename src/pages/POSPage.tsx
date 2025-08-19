import { useState, useEffect } from "react";
import { mockProducts, mockCategories, mockCustomers } from "../data/mockData";
import { Product, SaleItem, Customer } from "../types";
import {
  Search,
  ShoppingCart,
  Minus,
  Plus,
  X,
  User,
  CreditCard,
  DollarSign,
  Printer,
  Check,
  Calculator,
  UserPlus,
  Edit3,
} from "lucide-react";
import { clsx } from "clsx";
import Numberpad from "../components/Numberpad";

export default function POSPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("card");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showNumberpad, setShowNumberpad] = useState(false);
  const [numberpadValue, setNumberpadValue] = useState("");
  const [numberpadMode, setNumberpadMode] = useState<
    "cash" | "quantity" | "price" | null
  >(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<any>(null);
  const [cartVisible, setCartVisible] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Ekran o'lchamini kuzatish
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const filteredProducts = mockProducts.filter((product) => {
    const matchesCategory =
      selectedCategory === "all" || product.categoryId === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && product.isActive;
  });

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const taxRate = 0.08;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id);

    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: SaleItem = {
        id: `item-${Date.now()}`,
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: 1,
        unitPrice: product.price,
        discountAmount: 0,
        total: product.price,
      };
      setCart([...cart, newItem]);
    }

    // Vizual tasdiq
    setSelectedProducts((prev) => new Set([...prev, product.id]));
    setTimeout(() => {
      setSelectedProducts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }, 300);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.id === itemId
          ? { ...item, quantity, total: item.unitPrice * quantity }
          : item
      )
    );
  };

  const updatePrice = (itemId: string, newPrice: number) => {
    setCart(
      cart.map((item) =>
        item.id === itemId
          ? { ...item, unitPrice: newPrice, total: newPrice * item.quantity }
          : item
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setShowPayment(false);
    setCashReceived("");
    setCartVisible(false);
  };

  const openQuantityPad = (itemId: string) => {
    const item = cart.find((i) => i.id === itemId);
    if (item) {
      setEditingItemId(itemId);
      setNumberpadValue(item.quantity.toString());
      setNumberpadMode("quantity");
      setShowNumberpad(true);
    }
  };

  const openPricePad = (itemId: string) => {
    const item = cart.find((i) => i.id === itemId);
    if (item) {
      setEditingItemId(itemId);
      setNumberpadValue(item.unitPrice.toFixed(2));
      setNumberpadMode("price");
      setShowNumberpad(true);
    }
  };

  const openCashPad = () => {
    setNumberpadValue(total.toFixed(2));
    setNumberpadMode("cash");
    setShowNumberpad(true);
  };

  const handleNumberpadEnter = () => {
    if (numberpadMode === "cash") {
      setCashReceived(numberpadValue);
    } else if (numberpadMode === "quantity" && editingItemId) {
      const quantity = parseFloat(numberpadValue) || 1;
      updateQuantity(editingItemId, quantity);
      setEditingItemId(null);
    } else if (numberpadMode === "price" && editingItemId) {
      const price = parseFloat(numberpadValue) || 0;
      updatePrice(editingItemId, price);
      setEditingItemId(null);
    }
    setShowNumberpad(false);
    setNumberpadValue("");
    setNumberpadMode(null);
  };

  const processSale = () => {
    const receiptNumber = `R001-${new Date().getFullYear()}${(
      new Date().getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}${new Date()
      .getDate()
      .toString()
      .padStart(2, "0")}-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`;

    const sale = {
      id: `sale-${Date.now()}`,
      receiptNumber,
      items: cart,
      subtotal,
      taxAmount,
      total,
      paymentMethod,
      cashReceived: paymentMethod === "cash" ? parseFloat(cashReceived) : total,
      change: paymentMethod === "cash" ? parseFloat(cashReceived) - total : 0,
      customer: selectedCustomer,
      timestamp: new Date(),
    };

    setLastSale(sale);
    setShowPayment(false);
    setShowReceipt(true);
    clearCart();
  };

  const change =
    paymentMethod === "cash" && cashReceived
      ? parseFloat(cashReceived) - total
      : 0;

  const getProductQuantityInCart = (productId: string) => {
    const item = cart.find((item) => item.productId === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b p-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">POS Terminali</h1>
        <button
          onClick={() => setCartVisible(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg"
        >
          <ShoppingCart className="h-5 w-5" />
          <span>{cart.length}</span>
        </button>
      </div>

      {/* Products Section */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Mahsulotlarni qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Kategoriyalar */}
          <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                selectedCategory === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              Barchasi
            </button>
            {mockCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  selectedCategory === category.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Mahsulotlar Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {filteredProducts.map((product) => {
              const quantityInCart = getProductQuantityInCart(product.id);
              const isSelected = selectedProducts.has(product.id);

              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={clsx(
                    "bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left group relative",
                    isSelected && "ring-2 ring-blue-500 bg-blue-50",
                    quantityInCart > 0 && "border-blue-300 bg-blue-50"
                  )}
                >
                  {quantityInCart > 0 && (
                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      {quantityInCart}
                    </div>
                  )}

                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <span className="text-2xl">🧃</span>
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${product.price.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Zaxira: {product.stockQuantity}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop Savat Section */}
      <div
        className={clsx("hidden lg:flex bg-white border-l flex-col", "lg:w-96")}
      >
        {/* Savat Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Savat ({cart.length})
          </h2>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Mijoz Tanlash */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Mijoz</span>
            <button
              onClick={() => setShowCustomerModal(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              {selectedCustomer ? "O'zgartirish" : "Tanlash"}
            </button>
          </div>
          {selectedCustomer && (
            <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded">
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">
                  {selectedCustomer.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Savat Elementlari */}
        <div className="flex-1 overflow-auto">
          {cart.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Sizning savatingiz bo'sh</p>
                <p className="text-sm">Mahsulot qo'shing</p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {item.name}
                    </h4>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Narx Qatori */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Birlik narxi</span>
                    <button
                      onClick={() => openPricePad(item.id)}
                      className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      ${item.unitPrice.toFixed(2)}
                      <Edit3 className="h-3 w-3 ml-1" />
                    </button>
                  </div>

                  {/* Miqdor Kontrollari */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            Math.max(0.1, item.quantity - 1)
                          )
                        }
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openQuantityPad(item.id)}
                        className="w-16 h-8 text-center text-sm font-medium bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center"
                      >
                        {item.quantity % 1 === 0
                          ? item.quantity
                          : item.quantity.toFixed(2)}
                      </button>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="font-semibold text-gray-900">
                      ${item.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Savat Xulosasi */}
        {cart.length > 0 && (
          <div className="border-t p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Jami</span>
                <span className="text-gray-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Soliq (8%)</span>
                <span className="text-gray-900">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Umumiy</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setShowPayment(true)}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
            >
              To'lovga o'tish
            </button>
          </div>
        )}
      </div>

      {/* Mobil Savat Modal */}
      {cartVisible && isMobile && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Orqa fon - yopish uchun */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setCartVisible(false)}
          ></div>

          {/* Savat oynasi - tepadan pastga siljib chiqadi */}
          <div className="bg-white rounded-t-xl shadow-lg mt-auto z-10 animate-slide-up">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Savat ({cart.length})
              </h2>
              <button
                onClick={() => setCartVisible(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Savat kontenti */}
            <div className="max-h-[60vh] overflow-auto">
              {cart.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 p-8">
                  <div className="text-center">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Sizning savatingiz bo'sh</p>
                    <p className="text-sm">Mahsulot qo'shing</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">
                          Birlik narxi
                        </span>
                        <button
                          onClick={() => openPricePad(item.id)}
                          className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          ${item.unitPrice.toFixed(2)}
                          <Edit3 className="h-3 w-3 ml-1" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Math.max(0.1, item.quantity - 1)
                              )
                            }
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openQuantityPad(item.id)}
                            className="w-16 h-8 text-center text-sm font-medium bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center"
                          >
                            {item.quantity % 1 === 0
                              ? item.quantity
                              : item.quantity.toFixed(2)}
                          </button>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="font-semibold text-gray-900">
                          ${item.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Savat yig'indisi */}
            {cart.length > 0 && (
              <div className="border-t p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jami</span>
                    <span className="text-gray-900">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Soliq (8%)</span>
                    <span className="text-gray-900">
                      ${taxAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Umumiy</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowPayment(true);
                    setCartVisible(false);
                  }}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  To'lovga o'tish
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mijoz Tanlash Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Mijozni tanlang
              </h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {mockCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerModal(false);
                  }}
                  className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="font-medium text-gray-900">
                    {customer.name}
                  </div>
                  <div className="text-sm text-gray-500">{customer.email}</div>
                  <div className="text-xs text-gray-500">
                    {customer.loyaltyPoints} ball
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* To'lov Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">To'lov</h3>

            <div className="mb-4">
              <p className="text-2xl font-bold text-gray-900">
                Umumiy: ${total.toFixed(2)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To'lov usuli
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={clsx(
                    "flex-1 flex items-center justify-center py-2 px-4 rounded-lg border-2 transition-colors",
                    paymentMethod === "card"
                      ? "border-blue-600 bg-blue-50 text-blue-600"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Karta
                </button>
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={clsx(
                    "flex-1 flex items-center justify-center py-2 px-4 rounded-lg border-2 transition-colors",
                    paymentMethod === "cash"
                      ? "border-blue-600 bg-blue-50 text-blue-600"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  <DollarSign className="h-5 w-5 mr-2" />
                  Naqd
                </button>
              </div>
            </div>

            {paymentMethod === "cash" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Naqd pul miqdori
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="0.01"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                  <button
                    onClick={openCashPad}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Calculator className="h-5 w-5" />
                  </button>
                </div>
                {change > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    Qaytim:{" "}
                    <span className="font-semibold">${change.toFixed(2)}</span>
                  </p>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={processSale}
                disabled={
                  paymentMethod === "cash" &&
                  (parseFloat(cashReceived) < total || !cashReceived)
                }
                className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
              >
                Sotuvni yakunlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chek Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Sotuv muvaffaqiyatli yakunlandi!
              </h3>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
              <div className="text-center mb-3">
                <h4 className="font-bold">Demo Restoran</h4>
                <p className="text-gray-600">Chek #{lastSale.receiptNumber}</p>
                <p className="text-gray-600">
                  {lastSale.timestamp.toLocaleString()}
                </p>
              </div>

              <div className="border-t border-gray-300 pt-3 mb-3">
                {lastSale.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between mb-1">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-300 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Jami</span>
                  <span>${lastSale.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Soliq</span>
                  <span>${lastSale.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Umumiy</span>
                  <span>${lastSale.total.toFixed(2)}</span>
                </div>
                {lastSale.paymentMethod === "cash" && (
                  <>
                    <div className="flex justify-between">
                      <span>Naqd pul</span>
                      <span>${lastSale.cashReceived.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Qaytim</span>
                      <span>${lastSale.change.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center"
              >
                <Printer className="h-4 w-4 mr-2" />
                Chek chop etish
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kalkulyator */}
      <Numberpad
        isOpen={showNumberpad}
        onClose={() => {
          setShowNumberpad(false);
          setNumberpadValue("");
          setNumberpadMode(null);
          setEditingItemId(null);
        }}
        onNumberClick={(num) => {
          if (num === ".") {
            if (!numberpadValue.includes(".")) {
              setNumberpadValue(numberpadValue + num);
            }
          } else {
            setNumberpadValue(numberpadValue + num);
          }
        }}
        onBackspace={() => {
          setNumberpadValue(numberpadValue.slice(0, -1));
        }}
        onClear={() => {
          setNumberpadValue("");
        }}
        onEnter={handleNumberpadEnter}
        title={
          numberpadMode === "cash"
            ? "Naqd pul miqdori"
            : numberpadMode === "quantity"
            ? "Miqdorni kiriting"
            : numberpadMode === "price"
            ? "Narxni kiriting"
            : "Qiymatni kiriting"
        }
        currentValue={numberpadValue}
      />

      {/* CSS Animatsiya uchun */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
