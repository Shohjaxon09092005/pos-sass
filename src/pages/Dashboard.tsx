import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Calendar, Download, Filter, TrendingUp, DollarSign, ShoppingCart, Package, Users, Activity, ArrowUp, ArrowDown, RefreshCw, AlertCircle, ChevronRight } from 'lucide-react';

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
  
  getPaymentMethods: (days = 30) =>
    fetch(`${API_BASE}/dashboard/financial/payment-methods/?days=${days}`, { headers: getAuthHeaders() })
      .then(res => res.json()),
};

// Tremor-style Card Component
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

// Tremor-style Metric Card
const MetricCard = ({ title, value, icon: Icon, trend, trendValue, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    purple: 'bg-violet-500',
    orange: 'bg-amber-500',
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center text-sm">
              {trend === 'up' ? (
                <ArrowUp className="h-4 w-4 text-emerald-500 mr-1" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={trend === 'up' ? 'text-emerald-600' : 'text-red-600'}>
                {trendValue}
              </span>
              <span className="text-gray-500 ml-1">vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Card>
  );
};

// Tremor-style Badge
const Badge = ({ children, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-emerald-100 text-emerald-700',
    yellow: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${colorClasses[color]}`}>
      {children}
    </span>
  );
};

// Tremor-style Progress Bar
const ProgressBar = ({ value, color = 'blue', className = '' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    purple: 'bg-violet-500',
    orange: 'bg-amber-500',
    red: 'bg-red-500',
  };

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div 
        className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color]}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
};

export default function TremorDashboard() {
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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Monitor your business performance</p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Alerts */}
      {inventory && (inventory.low_stock_products > 0 || overview?.pending_invoices > 0) && (
        <div className="mb-6 space-y-3">
          {inventory.low_stock_products > 0 && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">Low Stock Alert</p>
                  <p className="text-sm text-amber-700 mt-1">
                    {inventory.low_stock_products} products need restocking
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {overview?.pending_invoices > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">Pending Invoices</p>
                  <p className="text-sm text-blue-700 mt-1">
                    {overview.pending_invoices} invoices awaiting payment
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <MetricCard
          title="Total Sales"
          value={`$${parseFloat(overview?.total_sales || 0).toLocaleString()}`}
          icon={DollarSign}
          trend="up"
          trendValue={`${overview?.profit_margin || 0}%`}
          color="blue"
        />
        
        <MetricCard
          title="Total Revenue"
          value={`$${parseFloat(overview?.total_revenue || 0).toLocaleString()}`}
          icon={TrendingUp}
          trend="up"
          trendValue="12%"
          color="green"
        />
        
        <MetricCard
          title="Total Customers"
          value={overview?.total_customers || 0}
          icon={Users}
          trend="up"
          trendValue="8%"
          color="purple"
        />
        
        <MetricCard
          title="Active Sessions"
          value={overview?.active_sessions || 0}
          icon={Activity}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="gap-4 sm:gap-6 mb-6">
        {/* Sales Trend */}
        <Card className="p-4">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
            <p className="text-sm text-gray-500 mt-1">Daily sales performance</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={salesTrend}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                formatter={(value) => [`$${parseFloat(value).toFixed(2)}`, 'Sales']}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="total_sales" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fill="url(#salesGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <div className="grid gap-4 sm:gap-6 mb-6">
        {/* Payment Methods */}
        <Card className="p-4">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
            <p className="text-sm text-gray-500 mt-1">Transaction distribution</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="transaction_count"
                  >
                    {paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-3">
              {paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
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
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Top Products */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
              <p className="text-sm text-gray-500 mt-1">Best selling items</p>
            </div>
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div 
                key={product.product_id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.product_title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {parseFloat(product.quantity_sold).toFixed(0)} sold
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm font-semibold text-gray-900">
                    ${parseFloat(product.revenue).toFixed(2)}
                  </p>
                  <p className="text-xs text-emerald-600">
                    +${parseFloat(product.profit).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        {/* Category Performance */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Category Performance</h3>
              <p className="text-sm text-gray-500 mt-1">Sales by category</p>
            </div>
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-5">
            {categories.slice(0, 5).map((category, index) => (
              <div key={category.category_id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {category.category_name}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    ${parseFloat(category.total_sales).toFixed(2)}
                  </span>
                </div>
                <ProgressBar 
                  value={category.percentage_of_total} 
                  color={['blue', 'green', 'orange', 'purple', 'red'][index % 5]}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">{category.product_count} products</span>
                  <span className="text-xs text-gray-500">
                    {parseFloat(category.percentage_of_total).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Inventory Status */}
      {inventory && (
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Inventory Overview</h3>
            <p className="text-sm text-gray-500 mt-1">Current stock status</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{inventory.total_products}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Products</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{inventory.active_products}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Active</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-2xl sm:text-3xl font-bold text-amber-600">{inventory.low_stock_products}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Low Stock</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-2xl sm:text-3xl font-bold text-red-600">{inventory.out_of_stock_products}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Out of Stock</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}