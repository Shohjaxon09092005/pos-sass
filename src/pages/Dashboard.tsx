import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Calendar, Download, Filter, TrendingUp, DollarSign, ShoppingCart, Package, Users, Activity, ArrowUp, ArrowDown, RefreshCw, AlertTriangle } from 'lucide-react';

// API Service
const API_BASE = 'http://localhost:8000/api/v1';
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  'Content-Type': 'application/json',
});

const dashboardAPI = {
  getOverview: (period = 'month') =>
    fetch(`${API_BASE}/dashboard/overview/?period=${period}`, { headers: getAuthHeaders() })
      .then(res => res.json()),
  
  getSalesTrend: (days = 30) =>
    fetch(`${API_BASE}/dashboard/sales/trend/?days=${days}`, { headers: getAuthHeaders() })
      .then(res => res.json()),
  
  getTopProducts: (limit = 5, days = 30) =>
    fetch(`${API_BASE}/dashboard/sales/top-products/?limit=${limit}&days=${days}`, { headers: getAuthHeaders() })
      .then(res => res.json()),
  
  getCategoryPerformance: () =>
    fetch(`${API_BASE}/dashboard/sales/by-category/`, { headers: getAuthHeaders() })
      .then(res => res.json()),
  
  getInventoryStatus: () =>
    fetch(`${API_BASE}/dashboard/inventory/status/`, { headers: getAuthHeaders() })
      .then(res => res.json()),
  
  getCashFlow: (days = 30) =>
    fetch(`${API_BASE}/dashboard/financial/cash-flow/?days=${days}`, { headers: getAuthHeaders() })
      .then(res => res.json()),
  
  getPaymentMethods: (days = 30) =>
    fetch(`${API_BASE}/dashboard/financial/payment-methods/?days=${days}`, { headers: getAuthHeaders() })
      .then(res => res.json()),
  
  getCustomerInsights: (limit = 10) =>
    fetch(`${API_BASE}/dashboard/customers/insights/?limit=${limit}`, { headers: getAuthHeaders() })
      .then(res => res.json()),
};

export default function ModernDashboard() {
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const days = period === 'today' ? 1 : period === 'week' ? 7 : period === 'year' ? 365 : 30;
      
      const [overviewData, trendData, productsData, categoriesData, inventoryData, paymentsData] = await Promise.all([
        dashboardAPI.getOverview(period),
        dashboardAPI.getSalesTrend(days),
        dashboardAPI.getTopProducts(5, days),
        dashboardAPI.getCategoryPerformance(),
        dashboardAPI.getInventoryStatus(),
        dashboardAPI.getPaymentMethods(days),
      ]);

      setOverview(overviewData);
      setSalesTrend(trendData);
      setTopProducts(productsData);
      setCategories(categoriesData);
      setInventory(inventoryData);
      setPaymentMethods(paymentsData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's your business overview</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
            </select>
            
            <button 
              onClick={loadDashboardData}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        {/* Total Sales */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <span className="flex items-center text-sm font-medium text-green-600">
              <ArrowUp className="h-4 w-4 mr-1" />
              {overview?.profit_margin || 0}%
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Sales</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">
              ${parseFloat(overview?.total_sales || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <span className="flex items-center text-sm font-medium text-green-600">
              <ArrowUp className="h-4 w-4 mr-1" />
              12%
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">
              ${parseFloat(overview?.total_revenue || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <Users className="h-6 w-6 text-white" />
            </div>
            <span className="flex items-center text-sm font-medium text-green-600">
              <ArrowUp className="h-4 w-4 mr-1" />
              8%
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Customers</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">
              {overview?.total_customers || 0}
            </p>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="flex items-center text-sm font-medium text-blue-600">
              Live
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Active Sessions</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">
              {overview?.active_sessions || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Alerts Row */}
      {inventory && (inventory.low_stock_products > 0 || overview?.pending_invoices > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {inventory.low_stock_products > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-yellow-900">Low Stock Alert</p>
                <p className="text-sm text-yellow-700">
                  {inventory.low_stock_products} products need restocking
                </p>
              </div>
            </div>
          )}
          
          {overview?.pending_invoices > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start">
              <AlertTriangle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-900">Pending Invoices</p>
                <p className="text-sm text-blue-700">
                  {overview.pending_invoices} invoices awaiting payment
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales Trend Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesTrend}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#666"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                formatter={(value) => [`$${parseFloat(value).toFixed(2)}`, 'Sales']}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="total_sales" 
                stroke="#3B82F6" 
                strokeWidth={3}
                fill="url(#colorSales)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Methods</h3>
          <div className="flex flex-col md:flex-row items-center justify-around">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="transaction_count"
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value} transactions`,
                    props.payload.method_name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 mt-4 md:mt-0">
              {paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center justify-between min-w-[200px]">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-700">{method.method_name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    ${parseFloat(method.total_amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Top Products</h3>
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div 
                key={product.product_id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center flex-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold mr-3">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {product.product_title}
                    </p>
                    <p className="text-sm text-gray-600">
                      {parseFloat(product.quantity_sold).toFixed(0)} sold
                    </p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="font-bold text-gray-900">
                    ${parseFloat(product.revenue).toFixed(2)}
                  </p>
                  <p className="text-xs text-green-600">
                    +${parseFloat(product.profit).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Category Performance</h3>
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {categories.slice(0, 5).map((category, index) => (
              <div key={category.category_id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {category.category_name}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    ${parseFloat(category.total_sales).toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${category.percentage_of_total}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{category.product_count} products</span>
                  <span>{parseFloat(category.percentage_of_total).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Status - Mobile Optimized */}
      {inventory && (
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Inventory Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-xl bg-blue-50">
              <p className="text-2xl font-bold text-blue-600">{inventory.total_products}</p>
              <p className="text-sm text-gray-600 mt-1">Total Products</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-green-50">
              <p className="text-2xl font-bold text-green-600">{inventory.active_products}</p>
              <p className="text-sm text-gray-600 mt-1">Active</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-yellow-50">
              <p className="text-2xl font-bold text-yellow-600">{inventory.low_stock_products}</p>
              <p className="text-sm text-gray-600 mt-1">Low Stock</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-red-50">
              <p className="text-2xl font-bold text-red-600">{inventory.out_of_stock_products}</p>
              <p className="text-sm text-gray-600 mt-1">Out of Stock</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}