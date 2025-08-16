import React, { useState } from 'react';
import { mockProducts } from '../data/mockData';
import { Package, TrendingDown, TrendingUp, AlertTriangle, Plus, X } from 'lucide-react';
import { clsx } from 'clsx';

export default function InventoryPage() {
  const [products] = useState(mockProducts);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const lowStockItems = products.filter(p => p.stockQuantity <= p.minStock);
  const overstockedItems = products.filter(p => p.stockQuantity >= p.maxStock);
  const totalValue = products.reduce((sum, p) => sum + (p.stockQuantity * p.cost), 0);

  const recentMovements = [
    { id: '1', product: 'Espresso', type: 'sale', quantity: -15, date: new Date(), reason: 'Sale' },
    { id: '2', product: 'Croissant', type: 'adjustment', quantity: -3, date: new Date(), reason: 'Damaged' },
    { id: '3', product: 'Cappuccino', type: 'restock', quantity: +50, date: new Date(), reason: 'Purchase Order' },
    { id: '4', product: 'Chocolate Cake', type: 'sale', quantity: -2, date: new Date(), reason: 'Sale' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-600">Track and manage your stock levels</p>
        </div>
        <button 
          onClick={() => setShowAdjustmentModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Stock Adjustment</span>
        </button>
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
              <p className="text-2xl font-bold text-gray-900 mt-2">${totalValue.toFixed(2)}</p>
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
              <p className="text-2xl font-bold text-gray-900 mt-2">{lowStockItems.length}</p>
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
              <p className="text-2xl font-bold text-gray-900 mt-2">{overstockedItems.length}</p>
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
            <h3 className="text-lg font-semibold text-gray-900">Stock Levels</h3>
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
                    if (product.stockQuantity <= product.minStock) return 'text-red-600 bg-red-100';
                    if (product.stockQuantity >= product.maxStock) return 'text-orange-600 bg-orange-100';
                    return 'text-green-600 bg-green-100';
                  };

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{product.stockQuantity}</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className={clsx(
                              'h-2 rounded-full transition-all',
                              stockPercentage <= 30 ? 'bg-red-500' : 
                              stockPercentage >= 90 ? 'bg-orange-500' : 'bg-green-500'
                            )}
                            style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.minStock} / {product.maxStock}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={clsx(
                          'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                          getStatusColor()
                        )}>
                          {product.stockQuantity <= product.minStock ? 'Low' :
                           product.stockQuantity >= product.maxStock ? 'High' : 'Normal'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ${(product.stockQuantity * product.cost).toFixed(2)}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
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
            <h3 className="text-lg font-semibold text-gray-900">Recent Movements</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentMovements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      movement.quantity > 0 ? 'bg-green-100' : 'bg-red-100'
                    )}>
                      {movement.quantity > 0 ? 
                        <TrendingUp className="h-4 w-4 text-green-600" /> :
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{movement.product}</p>
                      <p className="text-xs text-gray-500">{movement.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={clsx(
                      'text-sm font-semibold',
                      movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                    </p>
                    <p className="text-xs text-gray-500">
                      {movement.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Stock Adjustment</h3>
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
                <h4 className="font-medium text-gray-900">{selectedProduct.name}</h4>
                <p className="text-sm text-gray-500">Current Stock: {selectedProduct.stockQuantity}</p>
              </div>
            )}

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adjustment Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="increase">Increase Stock</option>
                  <option value="decrease">Decrease Stock</option>
                  <option value="count">Stock Count</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="damaged">Damaged</option>
                  <option value="expired">Expired</option>
                  <option value="theft">Theft</option>
                  <option value="recount">Recount</option>
                  <option value="return">Return</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  rows={3}
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
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}