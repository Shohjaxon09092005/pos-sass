import { useState, useEffect } from "react";
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
  Store,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lock,
  Unlock,
  TrendingUp,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { clsx } from "clsx";
import { Menu } from "lucide-react";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Types (o'zgarmadi)
interface Product {
  id: string;
  title: string;
  image?: string;
  price: number;
  cost: number;
  barcode?: string;
  reference?: string;
  sku?: string;
  category: string;
  company: string;
  stockQuantity: number;
}

interface SaleItem {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  total: number;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface Category {
  id: string;
  title: string;
  parent?: string;
}

interface Register {
  id: string;
  title: string;
  notes?: string;
  active: boolean;
  status: string;
  location?: string;
  location_title?: string;
  company: string;
  created_by?: string;
  updated_by?: string;
}

interface Session {
  id: string;
  title: string;
  start_at: string;
  end_at?: string;
  status: string;
  opening_balance: number;
  closing_balance?: number;
  total_sales: number;
  total_refunds: number;
  register: string;
  register_title?: string;
  company: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  is_online: boolean;
}

interface Currency {
  id: string;
  title: string;
  symbol: string;
  code: string;
  is_default: boolean;
}

// Safe number parser
const safeParseFloat = (value: any): number => {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

// Mock auth context
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function POSPage() {
  const { user, company } = useAuth();
  const { t } = useTranslation("pos");
  // State management
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState<string>("0");
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showNumberpad, setShowNumberpad] = useState(false);
  const [numberpadValue, setNumberpadValue] = useState("");
  const [numberpadMode, setNumberpadMode] = useState<
    "quantity" | "price" | "amount_paid" | null
  >(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<any>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // API data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [registers, setRegisters] = useState<Register[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedRegister, setSelectedRegister] = useState<Register | null>(
    null
  );
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  // Modal states
  const [showRegisterSelection, setShowRegisterSelection] = useState(true);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showNewRegisterModal, setShowNewRegisterModal] = useState(false);
  const [newRegisterTitle, setNewRegisterTitle] = useState("");
  const [newRegisterNotes, setNewRegisterNotes] = useState("");
  const [openingBalance, setOpeningBalance] = useState<string>("0");
  const [closingBalance, setClosingBalance] = useState<string>("0");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [showCustomerModalInPayment, setShowCustomerModalInPayment] =
    useState(false);
  const [paymentAmounts, setPaymentAmounts] = useState<{
    [key: string]: number;
  }>({});
  const [activePaymentMethod, setActivePaymentMethod] = useState<string>("");
  const [numberpadFor, setNumberpadFor] = useState<string>("");
  const [touchedMethods, setTouchedMethods] = useState<{
    [key: string]: boolean;
  }>({});
  const [isCreditSale, setIsCreditSale] = useState(false);
  const [showCreditConfirmation, setShowCreditConfirmation] = useState(false);
  // Alert/Notification state
  const [alertModal, setAlertModal] = useState<{
    show: boolean;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    show: false,
    type: "info",
    title: "",
    message: "",
  });

  // Input prompt state
  const [inputPrompt, setInputPrompt] = useState<{
    show: boolean;
    title: string;
    message: string;
    placeholder: string;
    defaultValue: string;
    inputType: "text" | "number";
    onConfirm: (value: string) => void;
    onCancel?: () => void;
  }>({
    show: false,
    title: "",
    message: "",
    placeholder: "",
    defaultValue: "",
    inputType: "text",
    onConfirm: () => {},
  });

  const [promptInputValue, setPromptInputValue] = useState("");

  // Helper functions for alerts
  const showAlert = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message: string,
    onConfirm?: () => void
  ) => {
    setAlertModal({
      show: true,
      type,
      title,
      message,
      onConfirm,
      confirmText: "OK",
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    setAlertModal({
      show: true,
      type: "warning",
      title,
      message,
      onConfirm,
      onCancel,
      confirmText: "Confirm",
      cancelText: "Cancel",
    });
  };

  const closeAlert = () => {
    setAlertModal({
      show: false,
      type: "info",
      title: "",
      message: "",
    });
  };

  const showPrompt = (
    title: string,
    message: string,
    defaultValue: string,
    placeholder: string,
    inputType: "text" | "number",
    onConfirm: (value: string) => void,
    onCancel?: () => void
  ) => {
    setPromptInputValue(defaultValue);
    setInputPrompt({
      show: true,
      title,
      message,
      placeholder,
      defaultValue,
      inputType,
      onConfirm,
      onCancel,
    });
  };

  const closePrompt = () => {
    setInputPrompt({
      show: false,
      title: "",
      message: "",
      placeholder: "",
      defaultValue: "",
      inputType: "text",
      onConfirm: () => {},
    });
    setPromptInputValue("");
  };

  // Fetch data on mount
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
        currenciesResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/api/v1/products/`, { headers }),
        fetch(`${API_URL}/api/v1/products/categories/`, { headers }),
        fetch(`${API_URL}/api/v1/pos/registers/`, { headers }),
        fetch(`${API_URL}/api/v1/pos/sessions/`, { headers }),
        fetch(`${API_URL}/api/v1/partners/`, { headers }),
        fetch(`${API_URL}/api/v1/payments/methods/`, { headers }),
        fetch(`${API_URL}/api/v1/payments/currency/`, { headers }),
      ]);

      const productsData = productsResponse.ok
        ? await productsResponse.json()
        : { results: [] };
      const categoriesData = categoriesResponse.ok
        ? await categoriesResponse.json()
        : { results: [] };
      const registersData = registersResponse.ok
        ? await registersResponse.json()
        : { results: [] };
      const sessionsData = sessionsResponse.ok
        ? await sessionsResponse.json()
        : { results: [] };
      const customersData = customersResponse.ok
        ? await customersResponse.json()
        : { results: [] };
      const paymentMethodsData = paymentMethodsResponse.ok
        ? await paymentMethodsResponse.json()
        : { results: [] };
      const currenciesData = currenciesResponse.ok
        ? await currenciesResponse.json()
        : { results: [] };

      const transformedProducts: Product[] = (productsData.results || []).map(
        (product: any) => ({
          id: product.id,
          title: product.title || "Unknown Product",
          image: product.image,
          price: safeParseFloat(product.price),
          cost: safeParseFloat(product.cost),
          barcode: product.barcode,
          reference: product.reference,
          sku: product.sku,
          category: product.category,
          company: product.company,
          stockQuantity: safeParseFloat(
            product.current_stock || product.stock_quantity || 0
          ),
        })
      );

      const transformedCategories: Category[] = (
        categoriesData.results || []
      ).map((category: any) => ({
        id: category.id,
        title: category.title || "Unknown Category",
        parent: category.parent,
      }));

      const transformedRegisters: Register[] = (
        registersData.results || []
      ).map((register: any) => ({
        id: register.id,
        title: register.title || "Unknown Register",
        notes: register.notes,
        active: register.active !== false,
        status: register.status || "closed",
        location: register.location,
        location_title: register.location_title,
        company: register.company,
        created_by: register.created_by,
        updated_by: register.updated_by,
      }));

      const transformedSessions: Session[] = (sessionsData.results || []).map(
        (session: any) => ({
          id: session.id,
          title: session.title || "Unknown Session",
          start_at: session.start_at,
          end_at: session.end_at,
          status: session.status,
          opening_balance: safeParseFloat(session.opening_balance),
          closing_balance: safeParseFloat(session.closing_balance),
          total_sales: safeParseFloat(session.total_sales),
          total_refunds: safeParseFloat(session.total_refunds),
          register: session.register,
          register_title: session.register_title,
          company: session.company,
        })
      );

      const transformedCustomers: Customer[] = (
        customersData.results || []
      ).map((customer: any) => ({
        id: customer.id,
        name: customer.name || "Unknown Customer",
        email: customer.email,
        phone: customer.phone,
        address: customer.address_1 || customer.address_2 || "",
      }));

      const transformedPaymentMethods: PaymentMethod[] = (
        paymentMethodsData.results || []
      ).map((method: any) => ({
        id: method.id,
        name: method.name || "Unknown Method",
        is_online: method.is_online,
      }));

      const transformedCurrencies: Currency[] = (
        currenciesData.results || []
      ).map((currency: any) => ({
        id: currency.id,
        title: currency.title || "Unknown Currency",
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

      // Update active session if we have one selected
      if (activeSession) {
        const updatedSession = transformedSessions.find(
          (s) => s.id === activeSession.id
        );
        if (updatedSession && updatedSession.status === "opened") {
          setActiveSession(updatedSession);
        } else {
          // Session was closed, clear it
          setActiveSession(null);
          setSelectedRegister(null);
        }
      }

      if (transformedPaymentMethods.length > 0 && !paymentMethod) {
        setPaymentMethod(transformedPaymentMethods[0].id);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  // Get active session for a register
  const getActiveSessionForRegister = (registerId: string): Session | null => {
    return (
      sessions.find(
        (session) =>
          session.register === registerId && session.status === "opened"
      ) || null
    );
  };

  // Register selection handler
  const handleSelectRegister = (register: Register) => {
    setSelectedRegister(register);
    const sessionForRegister = getActiveSessionForRegister(register.id);
    setActiveSession(sessionForRegister);

    // Only show session modal if NO active session exists
    if (!sessionForRegister) {
      setShowRegisterSelection(false);
      setShowSessionModal(true);
    } else {
      // Session exists, go directly to POS
      setShowRegisterSelection(false);
    }
  };

  // Create new register
  const createNewRegister = async () => {
    if (!newRegisterTitle.trim()) {
      showAlert("error", "Validation Error", "Please enter register name");
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
          active: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to create register");

      const newRegister = await response.json();
      await fetchData();
      setNewRegisterTitle("");
      setNewRegisterNotes("");
      setShowNewRegisterModal(false);

      showAlert("success", "Success", "Register created successfully!");
    } catch (err) {
      console.error("Error creating register:", err);
      showAlert("error", "Error", "Failed to create register");
    }
  };

  // Start new session
  const startNewSession = async () => {
    if (!selectedRegister) {
      showAlert("error", "Error", "Please select a register first");
      return;
    }

    // Check if there's already an active session for this register
    const existingSession = getActiveSessionForRegister(selectedRegister.id);
    if (existingSession) {
      showAlert(
        "warning",
        "Session Already Active",
        "This register already has an active session!"
      );
      setActiveSession(existingSession);
      setShowSessionModal(false);
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
          title: `Session ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
          start_at: new Date().toISOString(),
          status: "opened",
          opening_balance: safeParseFloat(openingBalance),
          register: selectedRegister.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to start session");
      }

      const newSession = await response.json();

      // Refresh data to get updated register status
      await fetchData();

      // Set the new active session
      const createdSession: Session = {
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
        register_title: newSession.register_title,
        company: newSession.company,
      };

      setActiveSession(createdSession);
      setShowSessionModal(false);
      setOpeningBalance("0");

      showAlert("success", "Session Opened", "Session opened successfully!");
    } catch (err) {
      console.error("Error starting session:", err);
      showAlert(
        "error",
        "Error",
        "Failed to start session: " + (err as Error).message
      );
    }
  };

  // Close session
  const closeSession = async () => {
    if (!activeSession) return;

    // Prompt for closing balance
    const suggestedBalance = (
      activeSession.opening_balance + activeSession.total_sales
    ).toFixed(2);
    const enteredBalance = prompt(
      `Enter closing balance:\n\nSuggested: ${suggestedBalance}\nOpening: ${activeSession.opening_balance.toFixed(
        2
      )}\nSales: ${activeSession.total_sales.toFixed(2)}`,
      suggestedBalance
    );

    if (enteredBalance === null) return; // User cancelled

    const finalBalance = safeParseFloat(enteredBalance);
    if (finalBalance < 0) {
      alert("Closing balance cannot be negative");
      return;
    }

    const confirmed = window.confirm(
      `Close session with balance ${finalBalance.toFixed(
        2
      )}?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_URL}/api/v1/pos/sessions/${activeSession.id}/close/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            closing_balance: finalBalance,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to close session");
      }

      const closedSession = await response.json();

      // Show success message with session summary
      alert(
        `Session closed successfully!\n\n` +
          `Opening: ${activeSession.opening_balance.toFixed(2)}\n` +
          `Sales: ${activeSession.total_sales.toFixed(2)}\n` +
          `Closing: ${finalBalance.toFixed(2)}\n` +
          `Difference: ${(
            finalBalance -
            activeSession.opening_balance -
            activeSession.total_sales
          ).toFixed(2)}`
      );

      // Refresh data and reset state
      await fetchData();
      setActiveSession(null);
      setSelectedRegister(null);
      setShowRegisterSelection(true);
      setClosingBalance("0");
      clearCart();
    } catch (err) {
      console.error("Error closing session:", err);
      alert("Failed to close session: " + (err as Error).message);
    }
  };

  // Cart functions
  const addToCart = (product: Product) => {
    if (!activeSession) {
      showAlert("warning", "No Active Session", "Please start a session first");
      return;
    }

    const currentStock = product.stockQuantity || 0;
    const currentInCart = getProductQuantityInCart(product.id);

    if (currentInCart >= currentStock) {
      showAlert(
        "error",
        "Out of Stock",
        `Sorry, only ${currentStock} items in stock!`
      );
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

    const item = cart.find((item) => item.id === itemId);
    if (item) {
      const product = products.find((p) => p.id === item.productId);
      if (product && quantity > (product.stockQuantity || 0)) {
        showAlert(
          "error",
          "Insufficient Stock",
          `Sorry, only ${product.stockQuantity} items in stock!`
        );
        return;
      }
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

  // Cartni tozalash - YANGILANGAN
  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setShowPayment(false);
    setAmountPaid("");
    setIsCreditSale(false);
    resetPaymentAmounts();
  };

  const getProductQuantityInCart = (productId: string): number => {
    const item = cart.find((item) => item.productId === productId);
    return item ? item.quantity : 0;
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

  const openAmountPaidPad = () => {
    setNumberpadValue(amountPaid || total.toFixed(2));
    setNumberpadMode("amount_paid");
    setShowNumberpad(true);
  };

  const handleNumberpadEnter = () => {
    if (numberpadMode === "amount_paid") {
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

  // processSale funksiyasini to'g'rilash
  const processSale = async () => {
    if (!activeSession || !selectedRegister) {
      showAlert("error", "Error", "Please check session and register");
      return;
    }

    if (cart.length === 0) {
      showAlert("warning", "Empty Cart", "Cart is empty");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");

      // Sale payments ma'lumotlarini to'g'ri formatda tayyorlash
      const sale_payments = paymentMethods
        .filter((method) => (paymentAmounts[method.id] || 0) > 0)
        .map((method) => ({
          notes: `Payment via ${method.name}`,
          amount: (paymentAmounts[method.id] || 0).toString(),
          method: method.id,
        }));

      // Qarzga savdo bo'lsa, qoldiqni qo'shish
      const remainingAmount = total - totalPaid;
      if (remainingAmount > 0 && selectedCustomer) {
        // Credit payment methodini topish
        const creditMethod =
          paymentMethods.find(
            (m) =>
              m.name.toLowerCase().includes("credit") ||
              m.name.toLowerCase().includes("balance")
          ) || paymentMethods[0];

        sale_payments.push({
          notes: `Credit balance - Customer: ${selectedCustomer.name}`,
          amount: remainingAmount.toFixed(2),
          method: creditMethod.id,
        });
      }

      // Items ma'lumotlarini to'g'ri formatda tayyorlash
      const items = cart.map((item) => ({
        product: item.productId,
        quantity: item.quantity.toString(),
        cost_price: (item.unitPrice || 0).toString(),
        source_location: selectedRegister?.location || "",
      }));

      const saleData = {
        items: items,
        notes: `POS sale - ${new Date().toLocaleString()}${
          remainingAmount > 0 ? " (CREDIT)" : ""
        }`,
        session: activeSession.id,
        register: selectedRegister.id,
        customer: selectedCustomer?.id || null,
        company: company?.id || 0,
        source_location: selectedRegister?.location || "",
        sale_payments: sale_payments,
        status: remainingAmount > 0 ? "credit" : "paid",
      };

      console.log("Sending sale data:", JSON.stringify(saleData, null, 2));

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
        console.error("Sale error response:", errorText);
        throw new Error(`Failed to process sale: ${errorText}`);
      }

      const saleResult = await response.json();

      const receiptNumber = `R${saleResult.id?.slice(-4) || "0000"}-${Date.now()
        .toString()
        .slice(-6)}`;

      // To'liq lastSale obyektini yaratish
      const sale = {
        id: saleResult.id,
        receiptNumber,
        items: cart,
        subtotal: subtotal || 0,
        total: total || 0,
        paymentAmounts: { ...paymentAmounts },
        totalPaid: totalPaid || 0,
        change: change || 0,
        customer: selectedCustomer,
        timestamp: new Date(),
        isCredit: remainingAmount > 0,
        amountDue: Math.max(0, remainingAmount),
        // Yangi qo'shimcha maydonlar
        amountPaid: totalPaid || 0,
        taxAmount: 0, // Agar soliq bo'lsa, hisoblang
      };

      console.log("Last sale object:", sale);

      setLastSale(sale);
      setShowPayment(false);
      setShowReceipt(true);
      clearCart();
      await fetchData();

      // Reset payment states
      resetPaymentAmounts();
      setShowCreditConfirmation(false);
    } catch (err) {
      console.error("Error processing sale:", err);
      showAlert(
        "error",
        "Sale Failed",
        "Failed to process sale: " + (err as Error).message
      );
    }
  };

  // Calculations - XATOLARNI TO'G'IRLASH
  const subtotal = cart.reduce((sum, item) => sum + (item.total || 0), 0);
  const total = subtotal;
  const totalPaid = Object.values(paymentAmounts || {}).reduce(
    (sum, amount) => sum + (amount || 0),
    0
  );
  const change = Math.max(0, (totalPaid || 0) - (total || 0));
  const amountDue = Math.max(0, (total || 0) - (totalPaid || 0));

  // Payment modalini ochish - YANGILANGAN
  const handleOpenPayment = () => {
    setShowPayment(true);
    resetPaymentAmounts();

    // Birinchi to'lov usulini active qilish
    if (paymentMethods.length > 0) {
      setActivePaymentMethod(paymentMethods[0].id);
      setNumberpadFor(paymentMethods[0].id);
    }
  };
  // To'lov usuli tanlanganda avtomatik qolgan summani yozish
  useEffect(() => {
    if (activePaymentMethod && !touchedMethods[activePaymentMethod]) {
      const alreadyPaid = Object.entries(paymentAmounts)
        .filter(([methodId]) => methodId !== activePaymentMethod)
        .reduce((sum, [_, amount]) => sum + (amount || 0), 0);

      const remaining = Math.max(0, total - alreadyPaid);

      setPaymentAmounts((prev) => ({
        ...prev,
        [activePaymentMethod]: remaining,
      }));

      setTouchedMethods((prev) => ({
        ...prev,
        [activePaymentMethod]: true,
      }));
    }
  }, [activePaymentMethod, total]);

  // Customer modalini payment ichida ochish
  const handleOpenCustomerModalInPayment = () => {
    setShowCustomerModalInPayment(true);
  };

  // Tezkor tugmalar uchun funksiya - TO'G'IRLANGAN
  const handleQuickAmount = (amount: number) => {
    if (activePaymentMethod) {
      const currentAmount = paymentAmounts[activePaymentMethod] || 0;
      const newAmount = currentAmount + amount;
      setPaymentAmounts((prev) => ({
        ...prev,
        [activePaymentMethod]: newAmount,
      }));
      setTouchedMethods((prev) => ({
        ...prev,
        [activePaymentMethod]: true,
      }));
    }
  };
  // To'lov ma'lumotlarini reset qilish - yangi funksiya
  const resetPaymentAmounts = () => {
    const resetAmounts: { [key: string]: number } = {};
    paymentMethods.forEach((method) => {
      resetAmounts[method.id] = 0;
    });
    setPaymentAmounts(resetAmounts);
    setTouchedMethods({});
  };

  const handleNumberpadClick = (value: string) => {
    if (!activePaymentMethod) return;

    let currentAmount = paymentAmounts[activePaymentMethod] || 0;
    let currentString = currentAmount === 0 ? "" : currentAmount.toString();

    if (value === "⌫") {
      // Backspace
      const newString = currentString.slice(0, -1);
      const newAmount = parseFloat(newString.replace(",", "."));
      setPaymentAmounts((prev) => ({
        ...prev,
        [activePaymentMethod]: isNaN(newAmount) ? 0 : newAmount,
      }));
    } else if (value === "C") {
      // Clear
      setPaymentAmounts((prev) => ({
        ...prev,
        [activePaymentMethod]: 0,
      }));
    } else if (value === ".") {
      // faqat bitta nuqta
      if (!currentString.includes(".")) {
        currentString = currentString === "" ? "0." : currentString + ".";
        setPaymentAmounts((prev) => ({
          ...prev,
          [activePaymentMethod]: parseFloat(currentString) || 0,
        }));
      }
    } else {
      // raqam qo‘shish
      const newString = currentString + value;
      const newAmount = parseFloat(newString.replace(",", "."));
      setPaymentAmounts((prev) => ({
        ...prev,
        [activePaymentMethod]: isNaN(newAmount) ? 0 : newAmount,
      }));
    }
  };

  // Validate tugmasi muammosini to'g'rilash
  const handleValidatePayment = () => {
    if (!total || total === 0) {
      showAlert("error", "Empty Cart", "Please add items to cart first");
      return;
    }

    // Hech qanday to'lov kiritilmaganligini tekshirish
    const hasAnyPayment = Object.values(paymentAmounts).some(
      (amount) => amount > 0
    );
    if (!hasAnyPayment) {
      showAlert("error", "No Payment", "Please enter payment amount");
      return;
    }

    // Qarzga savdo tekshiruvi - customer tanlanmagan bo'lsa
    if (totalPaid < total && !selectedCustomer) {
      showAlert(
        "error",
        "Customer Required",
        "Please select a customer for credit sales when payment is less than total amount"
      );
      return;
    }

    // Qarzga savdo tasdiqlash
    if (totalPaid < total && selectedCustomer) {
      setShowCreditConfirmation(true);
      return;
    }

    // Normal to'lovni davom ettirish
    processPayment();
  };

  // Qarzga savdoni tasdiqlash
  const confirmCreditSale = () => {
    setShowCreditConfirmation(false);
    setIsCreditSale(true);
    processPayment();
  };
  // To'lovni amalga oshirish
  const processPayment = async () => {
    try {
      setAmountPaid(totalPaid.toFixed(2));
      await processSale();
    } catch (error) {
      console.error("Payment processing error:", error);
      showAlert("error", "Payment Error", "Failed to process payment");
    }
  };

  // Change hisoblash

  // Faol to'lov usuli nomini olish
  const getActivePaymentMethodName = () => {
    const method = paymentMethods.find((m) => m.id === activePaymentMethod);
    return method ? method.name : "";
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch =
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  // Print qilish funksiyasini to'g'rilash
  const handlePrintReceipt = () => {
    if (!lastSale) return;

    const printElement = document.getElementById("print-receipt");
    if (printElement) {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        console.error("Failed to open print window");
        showAlert("error", "Print Error", "Failed to open print window");
        return;
      }

      // To'liq chek HTML ni yaratish
      printWindow.document.write(`
       <!DOCTYPE html>
      <html>
        <head>
          <title>${t("pos.receipt")} #${lastSale.receiptNumber}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              margin: 0; 
              padding: 15px;
              font-size: 14px;
              line-height: 1.3;
            }
            .receipt-container { 
              max-width: 280px; 
              margin: 0 auto; 
            }
            .text-center { text-align: center; }
            .border-t { border-top: 1px dashed #000; }
            .border-b { border-bottom: 1px dashed #000; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .font-bold { font-weight: bold; }
            .text-sm { font-size: 12px; }
            .text-xs { font-size: 10px; }
            .my-2 { margin-top: 8px; margin-bottom: 8px; }
            .py-2 { padding-top: 8px; padding-bottom: 8px; }
            .pt-2 { padding-top: 8px; }
            .mt-4 { margin-top: 16px; }
            .mt-6 { margin-top: 24px; }
            .space-y-1 > * + * { margin-top: 4px; }
            .w-full { width: 100%; }
            .credit-notice { 
              background: #fff3cd; 
              border: 1px solid #ffeaa7; 
              padding: 8px; 
              margin: 10px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="text-center">
              <h2 class="font-bold text-lg">${
                company?.title || "Store Name"
              }</h2>
              <p class="text-sm">${t("pos.receipt")} #${
        lastSale.receiptNumber
      }</p>
              <p class="text-xs">${lastSale.timestamp.toLocaleString()}</p>
              ${
                selectedRegister
                  ? `<p class="text-xs">${t("pos.register")}: ${
                      selectedRegister.title
                    }</p>`
                  : ""
              }
            </div>
            
            <div class="border-t border-b py-2 my-2">
              ${lastSale.items
                .map(
                  (item: any) => `
                <div class="flex justify-between text-sm py-1">
                  <div class="flex-1">
                    <div>${item.quantity}x ${item.name}</div>
                    <div class="text-xs">@ $${item.unitPrice.toFixed(2)}</div>
                  </div>
                  <span class="font-bold">$${item.total.toFixed(2)}</span>
                </div>
              `
                )
                .join("")}
            </div>

            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span>${t("pos.total")}:</span>
                <span>$${lastSale.total.toFixed(2)}</span>
              </div>
              
              ${Object.entries(lastSale.paymentAmounts || {})
                .filter(([_, amount]) => (Number(amount) || 0) > 0)
                .map(([methodId, amount]) => {
                  const method = paymentMethods.find((m) => m.id === methodId);
                  return `
                    <div class="flex justify-between text-xs">
                      <span>${method?.name || t("pos.payment")}:</span>
                      <span>$${(Number(amount) || 0).toFixed(2)}</span>
                    </div>
                  `;
                })
                .join("")}
              
              <div class="flex justify-between font-bold border-t border-gray-400 pt-1">
                <span>${t("pos.totalPaid")}:</span>
                <span>$${lastSale.totalPaid.toFixed(2)}</span>
              </div>
              
              ${
                lastSale.change > 0
                  ? `
                <div class="flex justify-between text-green-600 font-bold">
                  <span>${t("pos.change")}:</span>
                  <span>$${lastSale.change.toFixed(2)}</span>
                </div>
              `
                  : ""
              }
              
              ${
                lastSale.amountDue > 0
                  ? `
                <div class="flex justify-between text-red-600 font-bold">
                  <span>${t("pos.amountDue")}:</span>
                  <span>$${lastSale.amountDue.toFixed(2)}</span>
                </div>
              `
                  : ""
              }
            </div>

            ${
              lastSale.customer
                ? `
              <div class="mt-4 pt-2 border-t border-gray-400">
                <p class="text-xs">${t("pos.customer")}: ${
                    lastSale.customer.name
                  }</p>
                ${
                  lastSale.customer.phone
                    ? `<p class="text-xs">${t("pos.phone")}: ${
                        lastSale.customer.phone
                      }</p>`
                    : ""
                }
              </div>
            `
                : ""
            }

            ${
              lastSale.isCredit
                ? `
              <div class="credit-notice text-center mt-4">
                <p class="font-bold text-sm">${t("pos.creditSale")}</p>
                <p class="text-xs">${t(
                  "pos.balance"
                )}: $${lastSale.amountDue.toFixed(2)}</p>
              </div>
            `
                : ""
            }

            <div class="text-center mt-6 text-xs">
              <p>${t("pos.thankYou")}</p>
            </div>
          </div>
        </body>
      </html>
    `);

      printWindow.document.close();

      // Print va yopish
      setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }, 500);
    }
  };

  // Get register status badge
  const getRegisterStatusBadge = (register: Register) => {
    const session = getActiveSessionForRegister(register.id);

    if (!register.active) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircle className="w-3 h-3 mr-1" />
          {t("pos.status.inactive")}
        </span>
      );
    }

    if (session) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          {t("pos.sessionActive")}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Lock className="w-3 h-3 mr-1" />
        {t("pos.status.closed")}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading POS...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading POS...</p>
        </div>
      </div>
    );
  }

  // Register Selection View
  if (showRegisterSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          {/* Register Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {registers.map((register) => {
              const session = getActiveSessionForRegister(register.id);

              return (
                <button
                  key={register.id}
                  onClick={() => handleSelectRegister(register)}
                  disabled={!register.active}
                  className={clsx(
                    "bg-white rounded-2xl p-6 text-left transition-all border-2",
                    register.active
                      ? "hover:shadow-xl hover:scale-105 border-transparent hover:border-blue-500 cursor-pointer"
                      : "opacity-50 cursor-not-allowed border-gray-200"
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={clsx(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          session ? "bg-green-100" : "bg-gray-100"
                        )}
                      >
                        <Store
                          className={clsx(
                            "w-6 h-6",
                            session ? "text-green-600" : "text-gray-600"
                          )}
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">
                          {register.title}
                        </h3>
                        {register.location_title && (
                          <p className="text-sm text-gray-500">
                            {register.location_title}
                          </p>
                        )}
                      </div>
                    </div>
                    {getRegisterStatusBadge(register)}
                  </div>

                  {session && (
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-900">
                          {t("pos.sessionActive")}
                        </span>
                        <span className="text-xs text-green-600">
                          {new Date(session.start_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-green-700">
                          {t("pos.totalSales")}
                        </span>
                        <span className="text-lg font-bold text-green-900">
                          {session.total_sales.toFixed(2)} UZS
                        </span>
                      </div>
                    </div>
                  )}

                  {!session && register.active && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-sm text-gray-600 text-center">
                        {t("pos.clickToOpenSession")}
                      </p>
                    </div>
                  )}

                  {register.notes && (
                    <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                      {register.notes}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Create New Register Button */}
          <div className="text-center">
            <button
              onClick={() => setShowNewRegisterModal(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t("pos.createNewRegister")}
            </button>
          </div>
        </div>

        {/* New Register Modal */}
        {showNewRegisterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">
                  {t("pos.createNewRegister")}
                </h3>
                <button onClick={() => setShowNewRegisterModal(false)}>
                  <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    {t("pos.registerName")} *
                  </label>
                  <input
                    type="text"
                    value={newRegisterTitle}
                    onChange={(e) => setNewRegisterTitle(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Front Counter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    {t("pos.notes")}
                  </label>
                  <textarea
                    value={newRegisterNotes}
                    onChange={(e) => setNewRegisterNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder={t("pos.additionalInfo")}
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowNewRegisterModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  {t("pos.cancel")}
                </button>
                <button
                  onClick={createNewRegister}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  {t("pos.create")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main POS View - BU YERDA ASOSIY O'ZGARISHLAR
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Header */}
        <div className="bg-white border-b shadow-sm sticky top-0 z-50 lg:z-40">
          <div className="container mx-auto px-3 lg:px-4 py-3">
            {/* Mobil Header */}
            <div className="lg:hidden">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center space-x-2 flex-1">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-lg bg-gray-100"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <h1 className="text-lg font-bold text-gray-900 truncate">
                    {t("pos.title")}
                  </h1>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Customer Button */}
                  <button
                    onClick={() => setShowCustomerModal(true)}
                    className="flex items-center space-x-1 px-2 py-1.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors text-xs max-w-[80px]"
                  >
                    <User className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      {selectedCustomer?.name || t("pos.customer")}
                    </span>
                  </button>

                  {/* Cart Button */}
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className="flex items-center space-x-1 bg-blue-600 text-white px-2 py-1.5 rounded-lg relative hover:bg-blue-700 transition-colors text-xs"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span className="font-bold">{cart.length}</span>
                  </button>
                </div>
              </div>

              {/* Search and Categories - Mobile */}
              <div className="px-3 pb-2 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder={t("pos.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Category Dropdown - Mobil */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setShowCategoryDropdown(!showCategoryDropdown)
                    }
                    className={clsx(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors w-full border-2",
                      selectedCategory === "all"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
                    )}
                  >
                    <span className="flex items-center space-x-2">
                      <Package className="w-4 h-4" />
                      <span className="text-xs">
                        {selectedCategory === "all"
                          ? t("pos.allCategories")
                          : categories.find((c) => c.id === selectedCategory)
                              ?.title || t("pos.selectCategory")}
                      </span>
                    </span>
                    <svg
                      className={clsx(
                        "w-4 h-4 transition-transform ml-2",
                        showCategoryDropdown && "rotate-180"
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {showCategoryDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowCategoryDropdown(false)}
                      />
                      <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-2xl border-2 border-gray-200 z-50 max-h-60 overflow-auto">
                        <button
                          onClick={() => {
                            setSelectedCategory("all");
                            setShowCategoryDropdown(false);
                          }}
                          className={clsx(
                            "w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-100 font-medium text-sm",
                            selectedCategory === "all" &&
                              "bg-blue-50 text-blue-700"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center space-x-2">
                              <Package className="w-4 h-4" />
                              <span>{t("pos.allCategories")}</span>
                            </span>
                            {selectedCategory === "all" && (
                              <Check className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                        </button>

                        {categories.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => {
                              setSelectedCategory(category.id);
                              setShowCategoryDropdown(false);
                            }}
                            className={clsx(
                              "w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 text-sm",
                              selectedCategory === category.id &&
                                "bg-blue-50 text-blue-700 font-medium"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span>{category.title}</span>
                              {selectedCategory === category.id && (
                                <Check className="w-4 h-4 text-blue-600" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {t("pos.title")}
                  </h1>

                  {/* Register Info */}
                  <button
                    onClick={() => {
                      setShowRegisterSelection(true);
                      setActiveSession(null);
                      setSelectedRegister(null);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    <Store className="h-4 w-4" />
                    <span className="font-medium">
                      {selectedRegister?.title}
                    </span>
                  </button>

                  {/* Session Status */}
                  {activeSession ? (
                    <div className="flex items-center space-x-3 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-bold">
                          {(activeSession.total_sales || 0).toFixed(2)} UZS
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const balance = prompt(
                            `${t("pos.enterClosingBalance")}:`,
                            (
                              activeSession.opening_balance +
                              activeSession.total_sales
                            ).toFixed(2)
                          );
                          if (balance) {
                            setClosingBalance(balance);
                            closeSession();
                          }
                        }}
                        className="text-red-600 hover:text-red-800 text-sm font-medium ml-2"
                      >
                        {t("pos.closeSession")}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSessionModal(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {t("pos.openSession")}
                    </button>
                  )}
                </div>
              </div>

              {/* Search and Categories - Desktop */}
              <div className="mt-4 flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder={t("pos.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Category Dropdown - Desktop */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setShowCategoryDropdown(!showCategoryDropdown)
                    }
                    className={clsx(
                      "flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors min-w-[200px] border-2",
                      selectedCategory === "all"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
                    )}
                  >
                    <span className="flex items-center space-x-2">
                      <Package className="w-4 h-4" />
                      <span>
                        {selectedCategory === "all"
                          ? t("pos.allCategories")
                          : categories.find((c) => c.id === selectedCategory)
                              ?.title || t("pos.selectCategory")}
                      </span>
                    </span>
                    <svg
                      className={clsx(
                        "w-4 h-4 transition-transform ml-2",
                        showCategoryDropdown && "rotate-180"
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {showCategoryDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowCategoryDropdown(false)}
                      />

                      <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg shadow-2xl border-2 border-gray-200 z-50 max-h-[400px] overflow-auto">
                        <button
                          onClick={() => {
                            setSelectedCategory("all");
                            setShowCategoryDropdown(false);
                          }}
                          className={clsx(
                            "w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 font-medium",
                            selectedCategory === "all" &&
                              "bg-blue-50 text-blue-700"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center space-x-2">
                              <Package className="w-4 h-4" />
                              <span>{t("pos.allCategories")}</span>
                            </span>
                            {selectedCategory === "all" && (
                              <Check className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <span className="text-xs text-gray-500 ml-6">
                            {products.length} {t("pos.products")}
                          </span>
                        </button>

                        {categories.length > 0 ? (
                          categories.map((category) => {
                            const categoryProductCount = products.filter(
                              (p) => p.category === category.id
                            ).length;
                            return (
                              <button
                                key={category.id}
                                onClick={() => {
                                  setSelectedCategory(category.id);
                                  setShowCategoryDropdown(false);
                                }}
                                className={clsx(
                                  "w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0",
                                  selectedCategory === category.id &&
                                    "bg-blue-50 text-blue-700 font-medium"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{category.title}</span>
                                  {selectedCategory === category.id && (
                                    <Check className="w-4 h-4 text-blue-600" />
                                  )}
                                </div>
                                <span className="text-xs text-gray-500">
                                  {categoryProductCount} {t("pos.products")}
                                </span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">{t("pos.noCategories")}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Quick Filter Badges */}
                {selectedCategory !== "all" && (
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear Filter</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* Main Content Area */}
          <div className="flex-1 flex">
            {/* Products Grid */}
            <div className="flex-1 container mx-auto px-3 lg:px-4 py-4 lg:py-6">
              {!activeSession ? (
                <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm p-6 lg:p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 bg-yellow-100 rounded-full mb-4">
                    <AlertCircle className="w-8 h-8 lg:w-10 lg:h-10 text-yellow-600" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                    {t("pos.noActiveSession")}
                  </h3>
                  <p className="text-gray-500 mb-4 lg:mb-6">
                    {t("pos.noSessionMessage")}
                  </p>
                  <button
                    onClick={() => setShowSessionModal(true)}
                    className="inline-flex items-center px-4 py-3 lg:px-6 lg:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg lg:rounded-xl font-semibold transition-colors shadow-lg text-sm lg:text-base"
                  >
                    <Unlock className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                    {t("pos.openSession")}
                  </button>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm p-6 lg:p-12 text-center">
                  <div className="text-gray-400 text-4xl lg:text-6xl mb-4">
                    🔍
                  </div>
                  <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">
                    {t("pos.noProductsFound")}
                  </h3>
                  <p className="text-gray-500 text-sm lg:text-base">
                    {t("pos.noProductsMessage")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-3">
                  {filteredProducts.map((product) => {
                    const quantityInCart = getProductQuantityInCart(product.id);
                    const stockQuantity = product.stockQuantity || 0;
                    const isOutOfStock = stockQuantity <= 0;
                    const canAddMore = quantityInCart < stockQuantity;

                    return (
                      <button
                        key={product.id}
                        onClick={() =>
                          !isOutOfStock && canAddMore && addToCart(product)
                        }
                        disabled={isOutOfStock || !canAddMore}
                        className={clsx(
                          "product-card bg-white p-2 lg:p-3 rounded-lg shadow-sm border border-gray-200 transition-all text-left relative group flex flex-col h-full w-full",
                          isOutOfStock
                            ? "opacity-50 cursor-not-allowed"
                            : canAddMore
                            ? "hover:border-blue-500 hover:shadow-md hover:scale-[1.02]"
                            : "border-orange-300 bg-orange-50"
                        )}
                      >
                        {quantityInCart > 0 && (
                          <div className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg z-10">
                            {quantityInCart}
                          </div>
                        )}

                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-gray-900 bg-opacity-75 rounded-lg flex items-center justify-center z-20">
                            <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                              {t("pos.outOfStock")}
                            </span>
                          </div>
                        )}

                        {!isOutOfStock && !canAddMore && (
                          <div className="absolute inset-0 bg-orange-500 bg-opacity-90 rounded-lg flex items-center justify-center z-20">
                            <span className="bg-white text-orange-600 px-2 py-1 rounded text-xs font-bold">
                              {t("pos.maxStock", { quantity: stockQuantity })}
                            </span>
                          </div>
                        )}

                        {/* Product Image */}
                        <div className="product-image bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-gray-400" />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 flex flex-col min-h-0">
                          <h3 className="product-title font-medium text-gray-900 mb-1">
                            {product.title}
                          </h3>

                          {product.sku && (
                            <p className="text-[10px] text-gray-500 mb-1 font-mono truncate">
                              {product.sku}
                            </p>
                          )}

                          <div className="flex items-center justify-between mb-1">
                            <p className="product-price font-bold text-gray-900">
                              {product.price.toFixed(2)} UZS
                            </p>

                            <div className="flex items-center space-x-1 text-xs">
                              <Package className="h-3 w-3 text-gray-400" />
                              <span
                                className={clsx(
                                  "font-semibold text-xs",
                                  stockQuantity === 0
                                    ? "text-red-600"
                                    : stockQuantity < 10
                                    ? "text-orange-600"
                                    : "text-green-600"
                                )}
                              >
                                {stockQuantity}
                              </span>
                            </div>
                          </div>

                          {/* Add to Cart Button */}
                          {!isOutOfStock && canAddMore && (
                            <div className="mt-auto pt-1">
                              <div
                                className={clsx(
                                  "w-full py-1.5 text-center rounded text-xs font-medium transition-colors",
                                  quantityInCart > 0
                                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                )}
                              >
                                {quantityInCart > 0
                                  ? t("pos.added")
                                  : t("pos.addToCart")}
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cart Sidebar */}
            <div
              className={clsx(
                "lg:relative bg-white shadow-2xl border-l border-gray-200 flex flex-col h-full z-50 transition-transform duration-300 lg:transition-none",
                isCartOpen
                  ? "fixed inset-0 top-0 lg:top-0 lg:translate-x-0"
                  : "fixed inset-0 top-0 translate-x-full lg:relative lg:translate-x-0",
                "lg:w-96 w-full max-w-full"
              )}
            >
              {/* Cart header */}
              <div className="p-3 sm:p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <h2 className="text-lg sm:text-xl font-bold">
                  {t("pos.cart")} ({cart.length})
                </h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="lg:opacity-70 hover:opacity-100 transition-opacity p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-2 sm:p-3">
                {cart.length === 0 ? (
                  <div className="text-center py-12 lg:py-16">
                    <ShoppingCart className="h-12 w-12 lg:h-16 lg:w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm lg:text-base">
                      {t("pos.cartEmpty")}
                    </p>
                    <p className="text-xs lg:text-sm text-gray-400 mt-2">
                      {t("pos.cartEmptyMessage")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 lg:space-y-3">
                    {cart.map((item) => {
                      const product = products.find(
                        (p) => p.id === item.productId
                      );
                      const stockQuantity = product?.stockQuantity || 0;
                      const isLowStock = item.quantity >= stockQuantity;

                      return (
                        <div
                          key={item.id}
                          className="border border-gray-200 rounded-lg p-2 lg:p-3 hover:border-blue-300 transition-colors bg-white"
                        >
                          <div className="flex justify-between items-start mb-1 lg:mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-xs lg:text-sm leading-tight">
                                {item.name}
                              </h4>
                              {item.sku && (
                                <p className="text-[10px] lg:text-xs text-gray-500 font-mono mt-0.5">
                                  {item.sku}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-400 hover:text-red-600 ml-2 transition-colors flex-shrink-0"
                            >
                              <X className="h-3 w-3 lg:h-4 lg:w-4" />
                            </button>
                          </div>

                          {isLowStock && (
                            <div className="mb-1 lg:mb-2 p-1 lg:p-1.5 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700 font-medium">
                              ⚠️ Only {stockQuantity} in stock
                            </div>
                          )}

                          <div className="flex items-center justify-between mb-1 lg:mb-2">
                            <span className="text-xs font-medium text-gray-500">
                              {t("pos.unitPrice")}:
                            </span>
                            <button
                              onClick={() => openPricePad(item.id)}
                              className="flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                              {item.unitPrice.toFixed(2)} UZS
                              <Calculator className="h-3 w-3 ml-1" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                                className="w-6 h-6 lg:w-7 lg:h-7 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 font-bold"
                              >
                                <Minus className="h-2 w-2 lg:h-3 lg:w-3" />
                              </button>
                              <button
                                onClick={() => openQuantityPad(item.id)}
                                className="w-10 h-6 lg:w-12 lg:h-7 text-center text-xs font-bold bg-white border border-gray-300 rounded hover:border-blue-500"
                              >
                                {item.quantity}
                              </button>
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                disabled={isLowStock}
                                className={clsx(
                                  "w-6 h-6 lg:w-7 lg:h-7 rounded flex items-center justify-center font-bold",
                                  isLowStock
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-gray-200 hover:bg-gray-300"
                                )}
                              >
                                <Plus className="h-2 w-2 lg:h-3 lg:w-3" />
                              </button>
                            </div>
                            <span className="font-bold text-base lg:text-lg text-gray-900">
                              {item.total.toFixed(2)} UZS
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cart summary */}
              {cart.length > 0 && (
                <div className="border-t bg-white p-3 lg:p-4 sticky bottom-0">
                  <div className="space-y-1 lg:space-y-2 text-xs lg:text-sm mb-3 lg:mb-4">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>{t("pos.total")}:</span>
                      <span>{total.toFixed(2)} UZS</span>
                    </div>
                  </div>

                  {selectedCustomer && (
                    <div className="mb-2 lg:mb-3 p-2 bg-purple-50 rounded border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3 text-purple-600" />
                          <span className="text-xs font-semibold text-purple-900">
                            {selectedCustomer.name}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedCustomer(null)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={clearCart}
                      className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-xs lg:text-sm"
                    >
                      {t("pos.clear")}
                    </button>
                    <button
                      onClick={handleOpenPayment}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 text-xs lg:text-sm"
                    >
                      {t("pos.checkout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Cart Floating Button */}
        {!isCartOpen && (
          <div className="lg:hidden fixed bottom-6 right-6 z-40">
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-all transform hover:scale-110"
            >
              <ShoppingCart className="h-6 w-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {t("pos.openNewSession")}
              </h3>
              <button onClick={() => setShowSessionModal(false)}>
                <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {!selectedRegister ? (
              <div className="text-center py-8">
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-600 mb-6">
                  {t("pos.pleaseSelectRegister")}
                </p>
                <button
                  onClick={() => {
                    setShowSessionModal(false);
                    setShowRegisterSelection(true);
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
                >
                  {t("pos.selectRegister")}
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <Store className="w-5 h-5 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">
                      {t("pos.register")}
                    </p>
                  </div>
                  <p className="font-bold text-lg text-blue-900">
                    {selectedRegister.title}
                  </p>
                  {selectedRegister.location_title && (
                    <p className="text-sm text-blue-700 mt-1">
                      {selectedRegister.location_title}
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    {t("pos.openingBalance")}
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="number"
                      step="0.01"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-semibold"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {t("pos.openingBalanceHelpText")}
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowSessionModal(false)}
                    className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                  >
                    {t("pos.cancel")}
                  </button>
                  <button
                    onClick={startNewSession}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-lg"
                  >
                    {t("pos.startSession")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {t("pos.selectCustomer")}
              </h3>
              <button onClick={() => setShowCustomerModal(false)}>
                <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-3 overflow-auto flex-1">
              {customers.length === 0 ? (
                <div className="text-center py-12">
                  <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">{t("pos.noCustomersFound")}</p>
                </div>
              ) : (
                customers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setShowCustomerModal(false);
                    }}
                    className={clsx(
                      "w-full text-left p-4 rounded-xl border-2 transition-all",
                      selectedCustomer?.id === customer.id
                        ? "border-purple-600 bg-purple-50 shadow-md"
                        : "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                    )}
                  >
                    <div className="font-semibold text-gray-900">
                      {customer.name}
                    </div>
                    {(customer.phone || customer.email) && (
                      <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                        {customer.phone && <div>📞 {customer.phone}</div>}
                        {customer.email && <div>✉️ {customer.email}</div>}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="flex space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
              >
                {t("pos.buttons.close")}
              </button>
              {selectedCustomer && (
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setShowCustomerModal(false);
                  }}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700"
                >
                  {t("pos.buttons.remove")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showPayment && (
        <div
          className="fixed inset-0 bg-white z-[99] flex flex-col overflow-y-auto"
          style={{ marginTop: "60px" }}
        >
          <div
            className="flex flex-1 overflow-y-auto flex-col md:flex-row"
            style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}
          >
            {/* Left Panel - Calculator */}
            <div className="flex-1 bg-gray-100 p-6 flex flex-col">
              {/* Payment Method Selection */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setActivePaymentMethod(method.id);
                      setNumberpadFor(method.id);
                    }}
                    className={clsx(
                      "p-2 sm:p-3 rounded-lg font-semibold border-2 transition-colors text-sm sm:text-base min-h-[50px] break-words",
                      activePaymentMethod === method.id
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
                    )}
                  >
                    {method.name}
                  </button>
                ))}
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[10, 20, 50].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickAmount(amount)}
                    className="bg-blue-100 text-blue-700 rounded-lg p-2 sm:p-3 font-bold text-sm sm:text-base hover:bg-blue-200 transition-colors min-h-[50px]"
                  >
                    +{amount}
                  </button>
                ))}
              </div>

              {/* Numberpad Display */}
              <div className="bg-white rounded-xl p-4 mb-4 border-2 border-gray-300">
                <div className="text-sm text-gray-500 mb-1">
                  {getActivePaymentMethodName()}
                </div>
                <div className="text-3xl font-mono text-right text-gray-900 font-bold">
                  {(paymentAmounts[activePaymentMethod] || 0).toLocaleString(
                    "en-US",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}{" "}
                  UZS
                </div>
              </div>

              {/* Numberpad */}
              <div className="grid grid-cols-4 gap-2 flex-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0, "⌫"].map((item) => (
                  <button
                    key={item}
                    onClick={() => handleNumberpadClick(item.toString())}
                    className={clsx(
                      "rounded-lg p-3 text-lg font-bold transition-colors min-h-[60px] flex items-center justify-center",
                      item === "⌫"
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : item === "."
                        ? "bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300"
                        : "bg-white text-gray-900 hover:bg-gray-200 border border-gray-300"
                    )}
                  >
                    {item}
                  </button>
                ))}
                {/* Clear Button */}
                <button
                  onClick={() => handleNumberpadClick("C")}
                  className="bg-red-500 text-white rounded-lg p-3 text-lg font-bold hover:bg-red-600 transition-colors min-h-[60px] flex items-center justify-center"
                >
                  C
                </button>
                {/* Next Button */}
                <button
                  onClick={() => {
                    const currentIndex = paymentMethods.findIndex(
                      (m) => m.id === activePaymentMethod
                    );
                    const nextIndex =
                      (currentIndex + 1) % paymentMethods.length;
                    setActivePaymentMethod(paymentMethods[nextIndex].id);
                    setNumberpadFor(paymentMethods[nextIndex].id);
                  }}
                  className="bg-green-600 text-white rounded-lg p-3 text-lg font-bold hover:bg-green-700 transition-colors min-h-[60px] flex items-center justify-center"
                >
                  →
                </button>
              </div>
            </div>

            {/* Right Panel - Payment Summary */}
            <div
              className="flex-1 bg-white p-6 flex flex-col border-l"
              style={{ overflowY: "auto" }}
            >
              {/* Customer Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  {t("pos.customerAccount")}{" "}
                  {!selectedCustomer && <span className="text-red-500">*</span>}
                </h3>
                <button
                  onClick={handleOpenCustomerModalInPayment}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                    selectedCustomer
                      ? "border-blue-500 bg-blue-50 hover:border-blue-600"
                      : "border-dashed border-gray-300 hover:border-blue-500"
                  }`}
                >
                  {selectedCustomer ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {selectedCustomer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {selectedCustomer.phone || selectedCustomer.email}
                        </div>
                      </div>
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-gray-500">
                      <span>
                        {t("pos.selectCustomer")}{" "}
                        {totalPaid < total && (
                          <span className="text-red-500">
                            ({t("pos.requiredForCredit")})
                          </span>
                        )}
                      </span>
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </button>
                {!selectedCustomer && totalPaid < total && (
                  <p className="text-red-500 text-sm mt-2">
                    {t("pos.customerRequiredForCredit")}
                  </p>
                )}
              </div>

              {/* Invoice Summary */}
              <div className="mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>{t("pos.total")}:</span>
                    <span>{(total || 0).toFixed(2)} UZS</span>
                  </div>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  {t("pos.payment")}
                </h3>
                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const amount = paymentAmounts[method.id] || 0;
                    if (amount === 0) return null;

                    return (
                      <div
                        key={method.id}
                        className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <span className="font-semibold text-blue-900">
                          {method.name}:
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-blue-900">
                            {(amount || 0).toFixed(2)} UZS
                          </span>
                          <button
                            onClick={() => {
                              setPaymentAmounts((prev) => ({
                                ...prev,
                                [method.id]: 0,
                              }));
                              setTouchedMethods((prev) => {
                                const updated = { ...prev };
                                delete updated[method.id];
                                return updated;
                              });
                            }}
                            className="text-red-500 hover:text-red-700 font-bold ml-2"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {Object.values(paymentAmounts).every(
                    (amount) => (amount || 0) === 0
                  ) && (
                    <div className="text-center py-4 text-gray-500">
                      {t("pos.noPayments")}
                    </div>
                  )}

                  <div className="border-t border-gray-300 pt-3 space-y-2">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-gray-700">
                        {t("pos.totalPaid")}:
                      </span>
                      <span className="text-blue-600">
                        {(totalPaid || 0).toFixed(2)} UZS
                      </span>
                    </div>

                    {amountDue > 0 ? (
                      <div className="flex justify-between text-red-600 font-bold">
                        <span>{t("pos.amountDue")}:</span>
                        <span>{(amountDue || 0).toFixed(2)} UZS</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-green-600 font-bold">
                        <span>{t("pos.change")}:</span>
                        <span>{(change || 0).toFixed(2)} UZS</span>
                      </div>
                    )}
                  </div>

                  {/* Credit sale warning */}
                  {amountDue > 0 && selectedCustomer && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                        <span className="text-yellow-800 font-semibold">
                          {t("pos.creditSaleWarning", {
                            amount: (amountDue || 0).toFixed(2),
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => setShowPayment(false)}
                  className="px-16 py-6 bg-red-600 text-white rounded-xl font-semibold text-xl hover:bg-red-700 hover:scale-105 hover:shadow-xl transition-all duration-300"
                >
                  {t("pos.back")}
                </button>

                <button
                  onClick={handleValidatePayment}
                  className={`px-16 py-6 rounded-xl font-semibold text-xl transition-all duration-300 shadow-lg ${
                    totalPaid === 0 || (totalPaid < total && !selectedCustomer)
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700 hover:scale-105 hover:shadow-xl"
                  }`}
                  disabled={
                    totalPaid === 0 || (totalPaid < total && !selectedCustomer)
                  }
                >
                  {totalPaid < total && selectedCustomer
                    ? t("pos.creditSale")
                    : t("pos.validate")}
                </button>
              </div>
            </div>
          </div>

          {/* Credit Sale Confirmation Modal */}
          {showCreditConfirmation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {t("pos.confirmCreditSale")}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    {t("pos.creditSaleMessage", {
                      amount: (amountDue || 0).toFixed(2),
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("pos.customer")}:{" "}
                    <span className="font-semibold">
                      {selectedCustomer?.name}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {t("pos.creditSaleNote")}
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCreditConfirmation(false)}
                    className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                  >
                    {t("pos.cancel")}
                  </button>
                  <button
                    onClick={confirmCreditSale}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
                  >
                    {t("pos.confirmCreditSale")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Customer Modal in Payment */}
          {showCustomerModalInPayment && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {t("pos.selectCustomer")}
                  </h3>
                  <button onClick={() => setShowCustomerModalInPayment(false)}>
                    <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>

                <div className="space-y-3 overflow-auto flex-1">
                  {customers.length === 0 ? (
                    <div className="text-center py-12">
                      <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">
                        {t("pos.noCustomersFound")}
                      </p>
                    </div>
                  ) : (
                    customers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowCustomerModalInPayment(false);
                        }}
                        className={clsx(
                          "w-full text-left p-4 rounded-xl border-2 transition-all",
                          selectedCustomer?.id === customer.id
                            ? "border-purple-600 bg-purple-50 shadow-md"
                            : "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                        )}
                      >
                        <div className="font-semibold text-gray-900">
                          {customer.name}
                        </div>
                        {(customer.phone || customer.email) && (
                          <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                            {customer.phone && <div>📞 {customer.phone}</div>}
                            {customer.email && <div>✉️ {customer.email}</div>}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>

                <div className="flex space-x-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => setShowCustomerModalInPayment(false)}
                    className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                  >
                    {t("pos.buttons.close")}
                  </button>
                  {selectedCustomer && (
                    <button
                      onClick={() => {
                        setSelectedCustomer(null);
                        setShowCustomerModalInPayment(false);
                      }}
                      className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700"
                    >
                      {t("pos.buttons.remove")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-white">
              <div className="text-center">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    lastSale.isCredit ? "bg-yellow-100" : "bg-green-100"
                  }`}
                >
                  {lastSale.isCredit ? (
                    <Clock className="h-8 w-8 text-yellow-600" />
                  ) : (
                    <Check className="h-8 w-8 text-green-600" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {lastSale.isCredit
                    ? t("pos.creditSaleCompleted")
                    : t("pos.saleCompleted")}
                </h3>
                <p className="text-gray-600 font-medium">
                  {t("pos.receipt")} #{lastSale.receiptNumber}
                </p>
                {lastSale.isCredit && (
                  <p className="text-yellow-600 font-semibold mt-1">
                    {t("pos.amountDue")}: {(lastSale.amountDue || 0).toFixed(2)}{" "}
                    UZS
                  </p>
                )}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
                <div className="text-center mb-4 pb-4 border-b-2 border-gray-300">
                  <h4 className="font-bold text-xl text-gray-900">
                    {company?.title || "Store Name"}
                  </h4>
                  <p className="text-gray-600 text-sm mt-1">
                    {lastSale.timestamp.toLocaleString()}
                  </p>
                  {selectedRegister && (
                    <p className="text-gray-500 text-xs mt-1">
                      {t("pos.register")}: {selectedRegister.title}
                    </p>
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  {lastSale.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <span className="font-semibold">
                          {item.quantity}x {item.name}
                        </span>
                        <div className="text-xs text-gray-500">
                          @ {(item.unitPrice || 0).toFixed(2)} UZS
                        </div>
                      </div>
                      <span className="font-bold">
                        {(item.total || 0).toFixed(2)} UZS
                      </span>
                    </div>
                  ))}
                </div>

                {/* Payment breakdown in receipt */}
                <div className="border-t border-gray-300 pt-4 space-y-2 text-sm">
                  {paymentMethods.map((method) => {
                    const amount = lastSale.paymentAmounts[method.id] || 0;
                    if (amount === 0) return null;

                    return (
                      <div
                        key={method.id}
                        className="flex justify-between text-gray-700"
                      >
                        <span>{method.name}:</span>
                        <span className="font-semibold">
                          {(amount || 0).toFixed(2)} UZS
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300 text-gray-900">
                    <span>{t("pos.totalPaid")}:</span>
                    <span>{(lastSale.totalPaid || 0).toFixed(2)} UZS</span>
                  </div>
                  {lastSale.change > 0 && (
                    <div className="flex justify-between text-green-600 font-bold">
                      <span>{t("pos.change")}:</span>
                      <span>{(lastSale.change || 0).toFixed(2)} UZS</span>
                    </div>
                  )}
                </div>
                {lastSale.customer && (
                  <div className="mt-4 pt-4 border-t-2 border-gray-300">
                    <p className="text-xs text-gray-500 mb-1">
                      {t("pos.customer")}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {lastSale.customer.name}
                    </p>
                    {lastSale.customer.phone && (
                      <p className="text-sm text-gray-600">
                        {lastSale.customer.phone}
                      </p>
                    )}
                  </div>
                )}
                {/* Credit sale information */}
                {lastSale.isCredit && (
                  <div className="mt-4 pt-4 border-t-2 border-yellow-300 bg-yellow-50 rounded-lg p-3">
                    <div className="flex items-center justify-center mb-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="font-bold text-yellow-800">
                        {t("pos.creditSale")}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-yellow-700 font-semibold">
                        {t("pos.balanceDue")}:{" "}
                        {(lastSale.amountDue || 0).toFixed(2)} UZS
                      </p>
                      <p className="text-yellow-600 text-sm mt-1">
                        {t("pos.customer")}: {lastSale.customer?.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-white">
              <div className="flex space-x-3">
                <button
                  onClick={handlePrintReceipt}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <Printer className="h-5 w-5" />
                  <span>{t("pos.printReceipt")}</span>
                </button>
                <button
                  onClick={() => {
                    setShowReceipt(false);
                    setIsCreditSale(false);
                    resetPaymentAmounts();
                  }}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  {t("pos.newSale")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print-Only Receipt */}
      {lastSale && (
        <div className="hidden">
          <div id="print-receipt" className="p-8 max-w-xs">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">
                {company?.title || "Store Name"}
              </h2>
              <p className="text-sm">Receipt #{lastSale.receiptNumber}</p>
              <p className="text-xs">{lastSale.timestamp.toLocaleString()}</p>
              {selectedRegister && (
                <p className="text-xs">Register: {selectedRegister.title}</p>
              )}
            </div>

            <div className="border-t border-b border-gray-400 py-2 my-2">
              {lastSale.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm py-1"
                >
                  <div>
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <div className="text-xs">
                      @ {(item.unitPrice || 0).toFixed(2)} UZS
                    </div>
                  </div>
                  <span>{(item.total || 0).toFixed(2)} UZS</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{(lastSale.subtotal || 0).toFixed(2)} UZS</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (8%):</span>
                <span>{(lastSale.taxAmount || 0).toFixed(2)} UZS</span>
              </div>
              <div className="flex justify-between font-bold border-t border-gray-400 pt-1">
                <span>Total:</span>
                <span>{(lastSale.total || 0).toFixed(2)} UZS</span>
              </div>
              <div className="flex justify-between">
                <span>Paid:</span>
                <span>{(lastSale.amountPaid || 0).toFixed(2)} UZS</span>
              </div>
              {lastSale.amountDue > 0 && (
                <div className="flex justify-between">
                  <span>Amount Due:</span>
                  <span>{(lastSale.amountDue || 0).toFixed(2)} UZS</span>
                </div>
              )}
              {lastSale.amountPaid > lastSale.total && (
                <div className="flex justify-between">
                  <span>Change:</span>
                  <span>
                    {(lastSale.amountPaid - lastSale.total || 0).toFixed(2)} UZS
                  </span>
                </div>
              )}
            </div>

            {lastSale.customer && (
              <div className="mt-4 pt-2 border-t border-gray-400">
                <p className="text-xs">Customer: {lastSale.customer.name}</p>
                {lastSale.customer.phone && (
                  <p className="text-xs">Phone: {lastSale.customer.phone}</p>
                )}
              </div>
            )}

            <div className="text-center mt-6 text-xs">
              <p>Thank you for your business!</p>
            </div>
          </div>
        </div>
      )}

      {/* Numberpad Component */}
      {showNumberpad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              {numberpadMode === "amount_paid"
                ? t("pos.enterAmount")
                : numberpadMode === "quantity"
                ? t("pos.enterQuantity")
                : t("pos.enterPrice")}
            </h3>

            <div className="text-3xl font-bold text-center mb-6 p-5 bg-gray-100 rounded-xl border-2 border-gray-300 text-gray-900">
              {numberpadValue || "0"}
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => setNumberpadValue((prev) => prev + num)}
                  className="p-5 bg-gray-100 rounded-xl text-xl font-bold hover:bg-gray-200 active:bg-gray-300 transition-colors"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => {
                  if (!numberpadValue.includes(".")) {
                    setNumberpadValue((prev) => prev + ".");
                  }
                }}
                className="p-5 bg-gray-100 rounded-xl text-xl font-bold hover:bg-gray-200 active:bg-gray-300 transition-colors"
              >
                .
              </button>
              <button
                onClick={() => setNumberpadValue((prev) => prev + "0")}
                className="p-5 bg-gray-100 rounded-xl text-xl font-bold hover:bg-gray-200 active:bg-gray-300 transition-colors"
              >
                0
              </button>
              <button
                onClick={() => setNumberpadValue((prev) => prev.slice(0, -1))}
                className="p-5 bg-red-100 text-red-600 rounded-xl text-xl font-bold hover:bg-red-200 active:bg-red-300 transition-colors"
              >
                ⌫
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowNumberpad(false);
                  setNumberpadValue("");
                  setNumberpadMode(null);
                }}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
              >
                {t("pos.cancel")}
              </button>
              <button
                onClick={() => setNumberpadValue("")}
                className="px-4 py-3 bg-orange-100 text-orange-600 rounded-xl font-semibold hover:bg-orange-200"
              >
                {t("pos.clear")}
              </button>
              <button
                onClick={handleNumberpadEnter}
                disabled={!numberpadValue}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("pos.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Prompt Modal */}
      {inputPrompt.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-center mb-3 text-gray-900">
              {inputPrompt.title}
            </h3>

            <p className="text-center text-gray-600 mb-6 whitespace-pre-line">
              {inputPrompt.message}
            </p>

            {/* Input Field */}
            <div className="mb-6">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={inputPrompt.inputType}
                  value={promptInputValue}
                  onChange={(e) => setPromptInputValue(e.target.value)}
                  placeholder={inputPrompt.placeholder}
                  className="w-full pl-10 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xl font-bold text-center"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && promptInputValue) {
                      inputPrompt.onConfirm(promptInputValue);
                      closePrompt();
                    } else if (e.key === "Escape") {
                      inputPrompt.onCancel?.();
                      closePrompt();
                    }
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {t("pos.pressEnterToConfirm")}
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  inputPrompt.onCancel?.();
                  closePrompt();
                }}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                {t("pos.cancel")}
              </button>
              <button
                onClick={() => {
                  if (promptInputValue) {
                    inputPrompt.onConfirm(promptInputValue);
                    closePrompt();
                  }
                }}
                disabled={!promptInputValue}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("pos.confirm")}
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
        
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
        
        @media print {
          body * {
            visibility: hidden;
          }
          .print-receipt, .print-receipt * {
            visibility: visible;
          }
          .print-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }

        /* Mobil uchun cart sidebar */
        @media (max-width: 1023px) {
          #cart-sidebar {
            position: fixed;
            right: 0;
            top: 0;
            height: 100vh;
            z-index: 60;
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
          }
          
          #cart-sidebar:not(.hidden) {
            transform: translateX(0);
          }
        }
          @media print {
    body * {
      visibility: hidden;
    }
    #print-receipt, #print-receipt * {
      visibility: visible;
    }
    #print-receipt {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      max-width: none;
    }
  }
    /* Mahsulot kartalari uchun responsive design */
.product-card {
  min-height: 180px;
  display: flex;
  flex-direction: column;
}

.product-image {
  height: 200px;
  min-height: 200px;
}

.product-title {
  font-size: 1.2rem;
  line-height: 1.2;
  max-height: 2.4rem;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-price {
  font-size: 0.875rem;
}

.product-stock {
  font-size: 0.75rem;
}
  /* Responsive design uchun qo'shimcha CSS */
@media (max-width: 640px) {
  .product-card {
    min-height: 160px;
    padding: 0.5rem;
  }
  
  .product-image {
    height: 150px;
    min-height: 150px;
  }
  
  .product-title {
    font-size: 0.7rem;
    max-height: 2.1rem;
  }
  
  .product-price {
    font-size: 0.8rem;
  }
}

/* Numberpad tugmalari uchun */
.numberpad-btn {
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 480px) {
  .numberpad-btn {
    min-height: 45px;
    font-size: 1rem;
  }
}

/* Cart itemlar uchun */
.cart-item {
  padding: 0.5rem;
}

@media (max-width: 640px) {
  .cart-item {
    padding: 0.375rem;
  }
}
      `}</style>
    </div>
  );
}
