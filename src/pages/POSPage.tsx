import React, { useState } from 'react';
import { mockProducts, mockCategories, mockCustomers } from '../data/mockData';
import { Product, SaleItem, Customer } from '../types';
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
  UserPlus
} from 'lucide-react';
import { clsx } from 'clsx';
import Numberpad from '../components/Numberpad';

export default function POSPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('card');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showNumberpad, setShowNumberpad] = useState(false);
  const [numberpadValue, setNumberpadValue] = useState('');
  const [numberpadMode, setNumberpadMode] = useState<'cash' | 'quantity' | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<any>(null);

  const filteredProducts = mockProducts.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && product.isActive;
  });

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const taxRate = 0.08;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
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
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(cart.map(item => 
      item.id === itemId 
        ? { ...item, quantity, total: item.unitPrice * quantity }
        : item
    ));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setShowPayment(false);
    setCashReceived('');
  };

  const openQuantityPad = (itemId: string) => {
    const item = cart.find(i => i.id === itemId);
    if (item) {
      setEditingItemId(itemId);
      setNumberpadValue(item.quantity.toString());
      setNumberpadMode('quantity');
      setShowNumberpad(true);
    }
  };

  const openCashPad = () => {
    setNumberpadValue(total.toFixed(2));
    setNumberpadMode('cash');
    setShowNumberpad(true);
  };

  const handleNumberpadEnter = () => {
    if (numberpadMode === 'cash') {
      setCashReceived(numberpadValue);
    } else if (numberpadMode === 'quantity' && editingItemId) {
      const quantity = parseFloat(numberpadValue) || 1;
      updateQuantity(editingItemId, quantity);
      setEditingItemId(null);
    }
    setShowNumberpad(false);
    setNumberpadValue('');
    setNumberpadMode(null);
  };

  const processSale = () => {
    const receiptNumber = `R001-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    const sale = {
      id: `sale-${Date.now()}`,
      receiptNumber,
      items: cart,
      subtotal,
      taxAmount,
      total,
      paymentMethod,
      cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) : total,
      change: paymentMethod === 'cash' ? parseFloat(cashReceived) - total : 0,
      customer: selectedCustomer,
      timestamp: new Date(),
    };

    setLastSale(sale);
    setShowPayment(false);
    setShowReceipt(true);
    clearCart();
  };

  const change = paymentMethod === 'cash' && cashReceived ? 
    parseFloat(cashReceived) - total : 0;

  return (
    <div className="h-full flex">
      {/* Products Section */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center space-x-4">
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
          </div>
          
          {/* Categories */}
          <div className="flex space-x-2 mt-4 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              All
            </button>
            {mockCategories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left group active:scale-95"
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <span className="text-2xl">🧃</span>
                </div>
                <h3 className="font-medium text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
                <p className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Stock: {product.stockQuantity}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white border-l flex flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Cart ({cart.length})
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
        </div>

        {/* Customer Selection */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Customer</span>
            <button 
              onClick={() => setShowCustomerModal(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              {selectedCustomer ? 'Change' : 'Select'}
            </button>
          </div>
          {selectedCustomer && (
            <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded">
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">{selectedCustomer.name}</span>
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

        {/* Cart Items */}
        <div className="flex-1 overflow-auto">
          {cart.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Your cart is empty</p>
                <p className="text-sm">Add items to get started</p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {cart.map(item => (
                <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openQuantityPad(item.id)}
                        className="w-12 h-8 text-center text-sm font-medium bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center"
                      >
                        {item.quantity}
                      </button>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="font-semibold text-gray-900">${item.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="border-t p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (8%)</span>
                <span className="text-gray-900">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setShowPayment(true)}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
            >
              Proceed to Payment
            </button>
          </div>
        )}
      </div>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Select Customer</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {mockCustomers.map(customer => (
                <button
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerModal(false);
                  }}
                  className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="font-medium text-gray-900">{customer.name}</div>
                  <div className="text-sm text-gray-500">{customer.email}</div>
                  <div className="text-xs text-gray-500">{customer.loyaltyPoints} points</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Payment</h3>
            
            <div className="mb-4">
              <p className="text-2xl font-bold text-gray-900">Total: ${total.toFixed(2)}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={clsx(
                    'flex-1 flex items-center justify-center py-2 px-4 rounded-lg border-2 transition-colors',
                    paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Card
                </button>
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={clsx(
                    'flex-1 flex items-center justify-center py-2 px-4 rounded-lg border-2 transition-colors',
                    paymentMethod === 'cash'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  <DollarSign className="h-5 w-5 mr-2" />
                  Cash
                </button>
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cash Received</label>
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
                    Change: <span className="font-semibold">${change.toFixed(2)}</span>
                  </p>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={processSale}
                disabled={paymentMethod === 'cash' && (parseFloat(cashReceived) < total || !cashReceived)}
                className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
              >
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-full mx-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Sale Complete!</h3>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
              <div className="text-center mb-3">
                <h4 className="font-bold">Demo Restaurant</h4>
                <p className="text-gray-600">Receipt #{lastSale.receiptNumber}</p>
                <p className="text-gray-600">{lastSale.timestamp.toLocaleString()}</p>
              </div>

              <div className="border-t border-gray-300 pt-3 mb-3">
                {lastSale.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between mb-1">
                    <span>{item.quantity}x {item.name}</span>
                    <span>${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-300 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${lastSale.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${lastSale.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${lastSale.total.toFixed(2)}</span>
                </div>
                {lastSale.paymentMethod === 'cash' && (
                  <>
                    <div className="flex justify-between">
                      <span>Cash</span>
                      <span>${lastSale.cashReceived.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Change</span>
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
                Print Receipt
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Numberpad */}
      <Numberpad
        isOpen={showNumberpad}
        onClose={() => {
          setShowNumberpad(false);
          setNumberpadValue('');
          setNumberpadMode(null);
          setEditingItemId(null);
        }}
        onNumberClick={(num) => {
          if (num === '.') {
            if (!numberpadValue.includes('.')) {
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
          setNumberpadValue('');
        }}
        onEnter={handleNumberpadEnter}
        title={numberpadMode === 'cash' ? 'Cash Received' : 'Enter Quantity'}
        currentValue={numberpadValue}
      />
    </div>
  );
}