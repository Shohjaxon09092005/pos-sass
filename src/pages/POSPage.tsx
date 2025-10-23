import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Product, SaleItem, Customer, Category, Register, Session, PaymentMethod, Currency } from "../types";
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
  Store,
  PlusCircle,
  Save,
  Package,
} from "lucide-react";
import { clsx } from "clsx";

const API_URL = import.meta.env.VITE_API_URL;

// Helper function to safely parse numbers
const safeParseFloat = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

export default function POSPage() {
  const { user, company } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showNumberpad, setShowNumberpad] = useState(false);
  const [numberpadValue, setNumberpadValue] = useState("");
  const [numberpadMode, setNumberpadMode] = useState<"cash" | "quantity" | "price" | "amount_paid" | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<any>(null);
  const [cartVisible, setCartVisible] = useState(false);

  // API data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [registers, setRegisters] = useState<Register[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedRegister, setSelectedRegister] = useState<Register | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(true);
  const [showNewRegisterModal, setShowNewRegisterModal] = useState(false);
  const [newRegisterTitle, setNewRegisterTitle] = useState("");
  const [newRegisterNotes, setNewRegisterNotes] = useState("");
  const [openingBalance, setOpeningBalance] = useState<string>("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const [
        productsResponse,
        categoriesResponse,
        registersResponse,
        sessionsResponse,
        customersResponse,
        paymentMethodsResponse,
        currenciesResponse
      ] = await Promise.all([
        fetch(`${API_URL}/api/v1/products/`, { headers }),
        fetch(`${API_URL}/api/v1/products/categories/`, { headers }),
        fetch(`${API_URL}/api/v1/pos/registers/`, { headers }),
        fetch(`${API_URL}/api/v1/pos/sessions/`, { headers }),
        fetch(`${API_URL}/api/v1/partners/`, { headers }),
        fetch(`${API_URL}/api/v1/payments/methods/`, { headers }),
        fetch(`${API_URL}/api/v1/payments/currency/`, { headers })
      ]);

      // Handle responses with error checking
      const productsData = productsResponse.ok ? await productsResponse.json() : { results: [] };
      const categoriesData = categoriesResponse.ok ? await categoriesResponse.json() : { results: [] };
      const registersData = registersResponse.ok ? await registersResponse.json() : { results: [] };
      const sessionsData = sessionsResponse.ok ? await sessionsResponse.json() : { results: [] };
      const customersData = customersResponse.ok ? await customersResponse.json() : { results: [] };
      const paymentMethodsData = paymentMethodsResponse.ok ? await paymentMethodsResponse.json() : { results: [] };
      const currenciesData = currenciesResponse.ok ? await currenciesResponse.json() : { results: [] };

      // Transform data with safe number parsing
      const transformedProducts: Product[] = (productsData.results || []).map((product: any) => ({
        id: product.id,
        title: product.title || 'Noma\'lum mahsulot',
        image: product.image,
        price: safeParseFloat(product.price),
        cost: safeParseFloat(product.cost),
        barcode: product.barcode,
        reference: product.reference,
        sku: product.sku,
        category: product.category,
        company: product.company,
        stockQuantity: safeParseFloat(product.stock_quantity || product.stock_quants?.[0]?.quantity || 0),
      }));

      const transformedCategories: Category[] = (categoriesData.results || []).map((category: any) => ({
        id: category.id,
        title: category.title || 'Noma\'lum kategoriya',
        parent: category.parent,
      }));

      const transformedRegisters: Register[] = (registersData.results || []).map((register: any) => ({
        id: register.id,
        title: register.title || 'Noma\'lum kassa',
        notes: register.notes,
        is_active: register.is_active !== false,
        company: register.company,
        created_by: register.created_by,
        updated_by: register.updated_by,
      }));

      const transformedSessions: Session[] = (sessionsData.results || []).map((session: any) => ({
        id: session.id,
        title: session.title || 'Noma\'lum session',
        start_at: session.start_at,
        end_at: session.end_at,
        status: session.status,
        opening_balance: safeParseFloat(session.opening_balance),
        closing_balance: safeParseFloat(session.closing_balance),
        total_sales: safeParseFloat(session.total_sales),
        total_refunds: safeParseFloat(session.total_refunds),
        register: session.register,
        company: session.company,
      }));

      const transformedCustomers: Customer[] = (customersData.results || []).map((customer: any) => ({
        id: customer.id,
        name: customer.name || 'Noma\'lum mijoz',
        email: customer.email,
        phone: customer.phone,
        address: customer.address_1 || customer.address_2 || '',
      }));

      const transformedPaymentMethods: PaymentMethod[] = (paymentMethodsData.results || []).map((method: any) => ({
        id: method.id,
        name: method.name || 'Noma\'lum usul',
        is_online: method.is_online,
      }));

      const transformedCurrencies: Currency[] = (currenciesData.results || []).map((currency: any) => ({
        id: currency.id,
        title: currency.title || 'Noma\'lum valyuta',
        symbol: currency.symbol,
        code: currency.code,
        is_default: currency.is_default,
      }));

      setProducts(transformedProducts);
      setCategories(transformedCategories);
      setRegisters(transformedRegisters);
      setSessions(transformedSessions);
      setCustomers(transformedCustomers);
      setPaymentMethods(transformedPaymentMethods);
      setCurrencies(transformedCurrencies);

      // Auto-select first register and active session
      if (transformedRegisters.length > 0) {
        const firstRegister = transformedRegisters[0];
        setSelectedRegister(firstRegister);
        
        // Find active session for this register
        const activeSession = transformedSessions.find(
          (session: Session) => session.register === firstRegister.id && session.status === 'opened'
        );
        setActiveSession(activeSession || null);
      }

      // Set default payment method
      if (transformedPaymentMethods.length > 0) {
        setPaymentMethod(transformedPaymentMethods[0].id);
      }

    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // Register functions
  const handleSelectRegister = (register: Register) => {
    setSelectedRegister(register);
    // Find active session for selected register
    const sessionForRegister = sessions.find(
      session => session.register === register.id && session.status === 'opened'
    );
    setActiveSession(sessionForRegister || null);
    setShowRegisterModal(false);
  };

  const createNewRegister = async () => {
    if (!newRegisterTitle.trim()) {
      alert("Iltimos, kassa nomini kiriting");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/v1/pos/registers/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newRegisterTitle,
          notes: newRegisterNotes,
        }),
      });

      if (!response.ok) throw new Error("Kassa yaratishda xatolik");

      const newRegister = await response.json();
      
      // Type-safe register creation
      const createdRegister: Register = {
        id: newRegister.id,
        title: newRegister.title,
        notes: newRegister.notes,
        is_active: newRegister.is_active !== false,
        company: newRegister.company,
        created_by: newRegister.created_by,
        updated_by: newRegister.updated_by,
      };

      setRegisters(prev => [...prev, createdRegister]);
      setSelectedRegister(createdRegister);
      setNewRegisterTitle("");
      setNewRegisterNotes("");
      setShowNewRegisterModal(false);
      
      alert("Yangi kassa muvaffaqiyatli yaratildi!");
    } catch (err) {
      console.error("Error creating register:", err);
      alert("Kassa yaratishda xatolik yuz berdi");
    }
  };

  // Session functions
  const startNewSession = async () => {
    if (!selectedRegister) {
      alert("Iltimos, avval kassani tanlang");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/v1/pos/sessions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_active: true,
          title: `Session ${new Date().toLocaleDateString()}`,
          start_at: new Date().toISOString(),
          status: "opened",
          opening_balance: safeParseFloat(openingBalance),
          register: selectedRegister.id,
          company: company?.id || 1,
        }),
      });

      if (!response.ok) throw new Error("Session ochishda xatolik");

      const newSession = await response.json();
      setActiveSession({
        id: newSession.id,
        title: newSession.title,
        start_at: newSession.start_at,
        end_at: newSession.end_at,
        status: newSession.status,
        opening_balance: safeParseFloat(newSession.opening_balance),
        closing_balance: safeParseFloat(newSession.closing_balance),
        total_sales: safeParseFloat(newSession.total_sales),
        total_refunds: safeParseFloat(newSession.total_refunds),
        register: newSession.register,
        company: newSession.company,
      });
      setShowSessionModal(false);
      setOpeningBalance("0");
      
      alert("Session muvaffaqiyatli ochildi!");
    } catch (err) {
      console.error("Error starting session:", err);
      alert("Session ochishda xatolik yuz berdi");
    }
  };

  const closeSession = async () => {
    if (!activeSession) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/v1/pos/sessions/${activeSession.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          end_at: new Date().toISOString(),
          status: "closed",
          closing_balance: (activeSession.opening_balance || 0) + (activeSession.total_sales || 0),
        }),
      });

      if (!response.ok) throw new Error("Session yopishda xatolik");

      setActiveSession(null);
      alert("Session muvaffaqiyatli yopildi!");
    } catch (err) {
      console.error("Error closing session:", err);
      alert("Session yopishda xatolik yuz berdi");
    }
  };

  // Customer functions
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
  };

  // Cart functions
  const addToCart = (product: Product) => {
    if (!activeSession) {
      alert("Iltimos, avval session oching");
      return;
    }

    // Check if product is in stock
    const currentStock = product.stockQuantity || 0;
    const currentInCart = getProductQuantityInCart(product.id);
    
    if (currentInCart >= currentStock) {
      alert(`Uzr, omborda faqat ${currentStock} dona qolgan!`);
      return;
    }

    const existingItem = cart.find((item) => item.productId === product.id);

    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: SaleItem = {
        id: `item-${Date.now()}`,
        productId: product.id,
        name: product.title,
        sku: product.sku,
        quantity: 1,
        unitPrice: product.price,
        discountAmount: 0,
        total: product.price,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    // Check stock before updating quantity
    const item = cart.find(item => item.id === itemId);
    if (item) {
      const product = products.find(p => p.id === item.productId);
      if (product && quantity > (product.stockQuantity || 0)) {
        alert(`Uzr, omborda faqat ${product.stockQuantity} dona qolgan!`);
        return;
      }
    }

    setCart(cart.map((item) =>
      item.id === itemId
        ? { ...item, quantity, total: item.unitPrice * quantity }
        : item
    ));
  };

  const updatePrice = (itemId: string, newPrice: number) => {
    setCart(cart.map((item) =>
      item.id === itemId
        ? { ...item, unitPrice: newPrice, total: newPrice * item.quantity }
        : item
    ));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setShowPayment(false);
    setCashReceived("");
    setAmountPaid("");
    setCartVisible(false);
  };

  // Numberpad functions
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
    setNumberpadValue(amountPaid || total.toFixed(2));
    setNumberpadMode("cash");
    setShowNumberpad(true);
  };

  const openAmountPaidPad = () => {
    setNumberpadValue(amountPaid || total.toFixed(2));
    setNumberpadMode("amount_paid");
    setShowNumberpad(true);
  };

  const handleNumberpadEnter = () => {
    if (numberpadMode === "cash") {
      setCashReceived(numberpadValue);
    } else if (numberpadMode === "amount_paid") {
      setAmountPaid(numberpadValue);
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

  // Process sale
  const processSale = async () => {
    if (!activeSession || !selectedRegister) {
      alert("Iltimos, session va kassani tekshiring");
      return;
    }

    if (cart.length === 0) {
      alert("Savat bo'sh");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      
      const saleData = {
        items: cart.map(item => ({
          product: item.productId,
          quantity: item.quantity,
          cost_price: item.unitPrice.toString(),
        })),
        notes: `POS sale - ${new Date().toLocaleString()}`,
        session: activeSession.id,
        register: selectedRegister.id,
        customer: selectedCustomer?.id || null,
        amount_total: total.toFixed(2),
        amount_paid: amountPaid || total.toFixed(2),
        amount_due: (total - parseFloat(amountPaid || total.toString())).toFixed(2),
      };

      console.log('Sending sale data:', saleData);

      const response = await fetch(`${API_URL}/api/v1/pos/sales/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sotuvni amalga oshirishda xatolik: ${response.status} - ${errorText}`);
      }

      const saleResult = await response.json();

      // Create receipt
      const receiptNumber = `R${saleResult.id?.slice(-4) || '0000'}-${Date.now().toString().slice(-6)}`;
      const sale = {
        id: saleResult.id,
        receiptNumber,
        items: cart,
        subtotal,
        taxAmount,
        total,
        amountPaid: parseFloat(amountPaid || total.toString()),
        amountDue: total - parseFloat(amountPaid || total.toString()),
        customer: selectedCustomer,
        timestamp: new Date(),
      };

      setLastSale(sale);
      setShowPayment(false);
      setShowReceipt(true);
      clearCart();
      fetchData();

    } catch (err) {
      console.error("Error processing sale:", err);
      alert("Sotuvni amalga oshirishda xatolik yuz berdi: " + (err as Error).message);
    }
  };

  // Helper functions
  const getProductQuantityInCart = (productId: string): number => {
    const item = cart.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const taxRate = 0.08;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  const change = parseFloat(cashReceived) - total;
  const amountDue = total - parseFloat(amountPaid || "0");

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">POS Terminali</h1>
              
              {/* Register Selector */}
              <button
                onClick={() => setShowRegisterModal(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100"
              >
                <Store className="h-4 w-4" />
                <span>{selectedRegister?.title || "Kassa tanlanmagan"}</span>
              </button>

              {/* Session Status */}
              {activeSession ? (
                <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-200">
                  <span>Session ochiq</span>
                  <span className="font-bold">
                    ${(activeSession.total_sales || 0).toFixed(2)}
                  </span>
                  <button
                    onClick={closeSession}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Yopish
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSessionModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  Session ochish
                </button>
              )}
            </div>

            {/* Customer and Cart Buttons */}
            <div className="flex items-center space-x-3">
              {/* Customer Button */}
              <button
                onClick={() => setShowCustomerModal(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100"
              >
                <User className="h-4 w-4" />
                <span>{selectedCustomer?.name || "Mijoz tanlanmagan"}</span>
              </button>

              {/* Cart Button */}
              <button
                onClick={() => setCartVisible(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg relative"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>{cart.length}</span>
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search and Categories */}
          <div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-3 lg:space-y-0">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Mahsulotlarni qidirish (nomi, SKU)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap",
                  selectedCategory === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                Barchasi
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap",
                    selectedCategory === category.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {category.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6">
        {!activeSession ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">🛒</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Session ochilmagan</h3>
            <p className="text-gray-500 mb-4">Sotuvni boshlash uchun session oching</p>
            <button
              onClick={() => setShowSessionModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              Session ochish
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mahsulot topilmadi</h3>
            <p className="text-gray-500">Qidiruv so'rovingizga mos mahsulot topilmadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => {
              const quantityInCart = getProductQuantityInCart(product.id);
              const stockQuantity = product.stockQuantity || 0;
              const isOutOfStock = stockQuantity <= 0;
              const canAddMore = quantityInCart < stockQuantity;

              return (
                <button
                  key={product.id}
                  onClick={() => !isOutOfStock && canAddMore && addToCart(product)}
                  disabled={isOutOfStock || !canAddMore}
                  className={clsx(
                    "bg-white p-4 rounded-lg shadow-sm border-2 transition-all text-left relative group",
                    isOutOfStock 
                      ? "border-gray-200 opacity-50 cursor-not-allowed" 
                      : canAddMore
                        ? "border-gray-200 hover:border-blue-500 hover:shadow-md"
                        : "border-orange-300 bg-orange-50"
                  )}
                >
                  {/* Quantity in cart badge */}
                  {quantityInCart > 0 && (
                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-lg z-10">
                      {quantityInCart}
                    </div>
                  )}

                  {/* Out of stock overlay */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-gray-100 bg-opacity-90 rounded-lg flex items-center justify-center z-20">
                      <span className="bg-red-500 text-white px-3 py-1 rounded text-sm font-bold">
                        Tugagan
                      </span>
                    </div>
                  )}

                  {/* Stock limit warning */}
                  {!isOutOfStock && !canAddMore && (
                    <div className="absolute inset-0 bg-orange-100 bg-opacity-80 rounded-lg flex items-center justify-center z-20">
                      <span className="bg-orange-500 text-white px-3 py-1 rounded text-sm font-bold">
                        Limit: {stockQuantity}
                      </span>
                    </div>
                  )}

                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  
                  <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                    {product.title}
                  </h3>
                  
                  <p className="text-xs text-gray-500 mb-2 font-mono">{product.sku}</p>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-gray-900">
                      ${product.price.toFixed(2)}
                    </p>
                    
                    {/* Stock information */}
                    <div className="flex items-center space-x-1 text-xs">
                      <Package className="h-3 w-3 text-gray-400" />
                      <span className={clsx(
                        "font-medium",
                        stockQuantity === 0 ? "text-red-600" :
                        stockQuantity < 10 ? "text-orange-600" : "text-green-600"
                      )}>
                        {stockQuantity}
                      </span>
                    </div>
                  </div>

                  {/* Stock progress bar */}
                  {!isOutOfStock && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className={clsx(
                          "h-1 rounded-full",
                          stockQuantity === 0 ? "bg-red-500" :
                          stockQuantity < 10 ? "bg-orange-500" : "bg-green-500"
                        )}
                        style={{ 
                          width: `${Math.min((stockQuantity / Math.max(stockQuantity, 10)) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Mijozi tanlang</h3>
              <button onClick={() => setShowCustomerModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-auto">
              {customers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Hech qanday mijoz topilmadi</p>
                </div>
              ) : (
                customers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className={clsx(
                      "w-full text-left p-4 rounded-lg border-2 transition-colors",
                      selectedCustomer?.id === customer.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="font-medium">{customer.name}</div>
                    {(customer.phone || customer.email) && (
                      <div className="text-sm text-gray-500 mt-1">
                        {customer.phone && <div>📞 {customer.phone}</div>}
                        {customer.email && <div>✉️ {customer.email}</div>}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Yopish
              </button>
              {selectedCustomer && (
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Mijozni olib tashlash
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      {cartVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Savat ({cart.length})</h2>
              <button onClick={() => setCartVisible(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Savat bo'sh</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => {
                    const product = products.find(p => p.id === item.productId);
                    const stockQuantity = product?.stockQuantity || 0;
                    const isLowStock = item.quantity >= stockQuantity;

                    return (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-xs text-gray-500">{item.sku}</p>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-400 hover:text-gray-600 ml-2"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {isLowStock && (
                          <div className="mb-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                            ⚠️ Omborda faqat {stockQuantity} dona qolgan
                          </div>
                        )}

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

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openQuantityPad(item.id)}
                              className="w-16 h-8 text-center text-sm font-medium bg-white border border-gray-300 rounded hover:bg-gray-50"
                            >
                              {item.quantity}
                            </button>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={isLowStock}
                              className={clsx(
                                "w-8 h-8 rounded flex items-center justify-center",
                                isLowStock
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-200 hover:bg-gray-300"
                              )}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <span className="font-bold text-lg">${item.total.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Cart summary */}
                  <div className="border-t pt-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Jami:</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Soliq (8%):</span>
                        <span>${taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
                        <span>Umumiy:</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    {/* Customer info in cart */}
                    {selectedCustomer && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">
                              {selectedCustomer.name}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedCustomer(null)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={clearCart}
                        className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Tozalash
                      </button>
                      <button
                        onClick={() => {
                          setShowPayment(true);
                          setCartVisible(false);
                        }}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        To'lovga o'tish
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Register Modal - existing code remains the same */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Kassani tanlang</h3>
              <button onClick={() => setShowRegisterModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-auto">
              {registers.map((register) => (
                <button
                  key={register.id}
                  onClick={() => handleSelectRegister(register)}
                  className={clsx(
                    "w-full text-left p-4 rounded-lg border-2 transition-colors",
                    selectedRegister?.id === register.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="font-medium">{register.title}</div>
                  {register.notes && (
                    <div className="text-sm text-gray-500 mt-1">{register.notes}</div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowRegisterModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg"
              >
                Yopish
              </button>
              <button
                onClick={() => {
                  setShowRegisterModal(false);
                  setShowNewRegisterModal(true);
                }}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold"
              >
                Yangi kassa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Register Modal - existing code remains the same */}
      {showNewRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Yangi kassa</h3>
              <button onClick={() => setShowNewRegisterModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Kassa nomi</label>
                <input
                  type="text"
                  value={newRegisterTitle}
                  onChange={(e) => setNewRegisterTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Kassa nomi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Izoh</label>
                <textarea
                  value={newRegisterNotes}
                  onChange={(e) => setNewRegisterNotes(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Qo'shimcha ma'lumot"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowNewRegisterModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg"
              >
                Bekor qilish
              </button>
              <button
                onClick={createNewRegister}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold"
              >
                Yaratish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Modal - existing code remains the same */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Session ochish</h3>
            
            {!selectedRegister ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Avval kassani tanlang</p>
                <button
                  onClick={() => {
                    setShowSessionModal(false);
                    setShowRegisterModal(true);
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg"
                >
                  Kassani tanlash
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Kassa:</p>
                  <p className="font-medium text-lg">{selectedRegister.title}</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Boshlang'ich balans</label>
                  <input
                    type="number"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowSessionModal(false)}
                    className="flex-1 py-3 border border-gray-300 rounded-lg"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={startNewSession}
                    className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold"
                  >
                    Session ochish
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal - existing code remains the same */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">To'lov</h3>

            <div className="mb-4">
              <p className="text-2xl font-bold text-blue-600">${total.toFixed(2)}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">To'lov usuli</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">To'lanadigan summa</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg"
                  placeholder={total.toFixed(2)}
                />
                <button
                  onClick={openAmountPaidPad}
                  className="p-3 bg-gray-100 rounded-lg"
                >
                  <Calculator className="h-5 w-5" />
                </button>
              </div>
              {amountDue > 0 && (
                <p className="text-red-600 text-sm mt-2">
                  Qarz qoldi: ${amountDue.toFixed(2)}
                </p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg"
              >
                Bekor qilish
              </button>
              <button
                onClick={processSale}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold"
              >
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal - existing code remains the same */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Sotuv muvaffaqiyatli yakunlandi!
              </h3>
              <p className="text-gray-600">Chek raqami: {lastSale.receiptNumber}</p>
            </div>

            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-6">
              <div className="text-center mb-4 pb-3 border-b border-gray-300">
                <h4 className="font-bold text-lg text-gray-900">Demo Restoran</h4>
                <p className="text-gray-600 text-sm">{lastSale.timestamp.toLocaleString()}</p>
              </div>

              <div className="space-y-2 mb-4">
                {lastSale.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <span className="font-medium">{item.quantity}x {item.name}</span>
                    </div>
                    <span className="font-medium">${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-300 pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Jami</span>
                  <span>${lastSale.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Soliq (8%)</span>
                  <span>${lastSale.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
                  <span>Umumiy</span>
                  <span>${lastSale.total.toFixed(2)}</span>
                </div>
                {lastSale.amountDue > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Qarz qoldi</span>
                    <span>${lastSale.amountDue.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  // Print functionality would go here
                  window.print();
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span>Chek chop etish</span>
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Numberpad Component - existing code remains the same */}
      {showNumberpad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">
              {numberpadMode === "cash" ? "Naqd pul" : 
               numberpadMode === "amount_paid" ? "To'lanadigan summa" :
               numberpadMode === "quantity" ? "Miqdor" : "Narx"}
            </h3>
            
            <div className="text-2xl font-bold text-center mb-6 p-4 bg-gray-100 rounded-lg">
              {numberpadValue || "0"}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[1,2,3,4,5,6,7,8,9,".",0,"C"].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    if (num === "C") {
                      setNumberpadValue("");
                    } else if (num === ".") {
                      if (!numberpadValue.includes(".")) {
                        setNumberpadValue(prev => prev + ".");
                      }
                    } else {
                      setNumberpadValue(prev => prev + num);
                    }
                  }}
                  className="p-4 bg-gray-100 rounded-lg text-lg font-medium hover:bg-gray-200"
                >
                  {num}
                </button>
              ))}
            </div>

            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => setShowNumberpad(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleNumberpadEnter}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}