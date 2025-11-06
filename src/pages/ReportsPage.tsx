import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, 
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart, Scatter,
  Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Download, Filter, Calendar, 
  Users, Package, DollarSign, Activity, ShoppingCart, 
  ArrowUp, ArrowDown, RefreshCw, FileText, BarChart3,
  PieChart as PieChartIcon, Clock, Target, Award, AlertCircle,
  Zap
} from 'lucide-react';

// API Service
const API_BASE = 'http://localhost:8000/api/v1';
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  'Content-Type': 'application/json',
});

const advancedAPI = {
  getSalesComparison: (period = 'month') =>
    fetch(`${API_BASE}/dashboard/sales/comparison/?period=${period}`, { headers: getAuthHeaders() })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      }),
  
  getABCAnalysis: (days = 90) =>
    fetch(`${API_BASE}/dashboard/products/abc-analysis/?days=${days}`, { headers: getAuthHeaders() })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      }),
  
  getPeakHours: (days = 30) =>
    fetch(`${API_BASE}/dashboard/sales/peak-hours/?days=${days}`, { headers: getAuthHeaders() })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      }),
  
  getCustomerSegmentation: () =>
    fetch(`${API_BASE}/dashboard/customers/segmentation/`, { headers: getAuthHeaders() })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      }),
  
  getProfitLoss: (period = 'month') =>
    fetch(`${API_BASE}/dashboard/financial/profit-loss/?period=${period}`, { headers: getAuthHeaders() })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      }),
  
  getForecast: (forecastDays = 30, historicalDays = 90) =>
    fetch(`${API_BASE}/dashboard/forecast/?forecast_days=${forecastDays}&historical_days=${historicalDays}`, { headers: getAuthHeaders() })
      .then(res => {
        if (!res.ok) {
          if (res.status === 400) {
            // Return a fallback structure for 400 errors
            return {
              historical_data: [],
              forecast: [],
              method: '7-day moving average',
              confidence: 'low',
              error: 'Insufficient data for forecasting'
            };
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      }),

  exportReport: (reportType, format = 'csv', days = 30) =>
    fetch(`${API_BASE}/dashboard/export/?report_type=${reportType}&format=${format}&days=${days}`, { 
      headers: getAuthHeaders() 
    }),
};

export default function AdvancedReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for different report sections
  const [comparison, setComparison] = useState(null);
  const [abcAnalysis, setAbcAnalysis] = useState(null);
  const [peakHours, setPeakHours] = useState(null);
  const [customerSegments, setCustomerSegments] = useState(null);
  const [profitLoss, setProfitLoss] = useState(null);
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    loadReportData();
  }, [period]);

  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const days = period === 'week' ? 7 : period === 'year' ? 365 : 30;
      
      const [compData, abcData, peakData, segmentData, plData, forecastData] = await Promise.all([
        advancedAPI.getSalesComparison(period).catch(err => ({ error: err.message })),
        advancedAPI.getABCAnalysis(days).catch(err => ({ error: err.message })),
        advancedAPI.getPeakHours(days).catch(err => ({ error: err.message })),
        advancedAPI.getCustomerSegmentation().catch(err => ({ error: err.message })),
        advancedAPI.getProfitLoss(period).catch(err => ({ error: err.message })),
        advancedAPI.getForecast(30, days).catch(err => ({ error: err.message })),
      ]);

      setComparison(compData.error ? null : compData);
      setAbcAnalysis(abcData.error ? null : abcData);
      setPeakHours(peakData.error ? null : peakData);
      setCustomerSegments(segmentData.error ? null : segmentData);
      setProfitLoss(plData.error ? null : plData);
      setForecast(forecastData.error ? null : forecastData);

      // Check if any critical API failed
      const errors = [compData, abcData, peakData, segmentData, plData, forecastData]
        .filter(data => data.error)
        .map(data => data.error);
      
      if (errors.length > 0) {
        setError(`Some data failed to load: ${errors.join(', ')}`);
      }

    } catch (error) {
      console.error('Failed to load reports:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (reportType) => {
    try {
      const response = await advancedAPI.exportReport(reportType, 'csv', 30);
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const SEGMENT_COLORS = {
    'Champions': '#10B981',
    'Loyal Customers': '#3B82F6',
    'Potential Loyalists': '#F59E0B',
    'At Risk': '#EF4444',
    'Lost': '#6B7280'
  };

  // Safe data preparation functions
  const prepareFinancialChartData = () => {
    if (!profitLoss) return [];
    return [
      {
        name: 'Revenue',
        gross: parseFloat(profitLoss.gross_revenue || 0),
        cogs: -parseFloat(profitLoss.cost_of_goods || 0),
        expenses: -parseFloat(profitLoss.operating_expenses || 0),
        net: parseFloat(profitLoss.net_profit || 0)
      }
    ];
  };

  const prepareForecastChartData = () => {
    if (!forecast) return [];
    
    const historical = (forecast.historical_data || []).map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      sales: parseFloat(item.daily_sales || 0),
      type: 'Historical'
    }));
    
    const forecastData = (forecast.forecast || []).map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      sales: parseFloat(item.forecasted_sales || 0),
      type: 'Forecast'
    }));
    
    return [...historical, ...forecastData];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadReportData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'performance', name: 'Performance', icon: Target },
    { id: 'customers', name: 'Customers', icon: Users },
    { id: 'financial', name: 'Financial', icon: DollarSign },
    { id: 'forecast', name: 'Forecast', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-4 md:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Advanced Analytics</h1>
              <p className="text-sm text-gray-600 mt-1">Deep insights and predictive analytics</p>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
              
              <button 
                onClick={loadReportData}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-5 w-5 text-gray-600" />
              </button>
              
              <button 
                onClick={() => handleExport('sales')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 lg:p-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Period Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {comparison ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Period Comparison</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Current Period Sales</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          ${parseFloat(comparison.current_period?.total_sales || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {comparison.current_period?.transaction_count || 0} transactions
                        </p>
                      </div>
                      {parseFloat(comparison.comparison?.total_sales_change || 0) >= 0 ? (
                        <div className="flex items-center text-green-600">
                          <ArrowUp className="h-6 w-6 mr-1" />
                          <span className="text-xl font-bold">
                            {parseFloat(comparison.comparison?.total_sales_change || 0).toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <ArrowDown className="h-6 w-6 mr-1" />
                          <span className="text-xl font-bold">
                            {Math.abs(parseFloat(comparison.comparison?.total_sales_change || 0)).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-600 mb-1">Previous Period</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${parseFloat(comparison.previous_period?.total_sales || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {comparison.previous_period?.transaction_count || 0} orders
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-600 mb-1">Avg Transaction</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${parseFloat(comparison.current_period?.average_transaction || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">per order</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-center">
                  <p className="text-gray-500">Comparison data not available</p>
                </div>
              )}

              {/* Profit & Loss Statement */}
              {profitLoss ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Profit & Loss Statement</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-600">Gross Revenue</span>
                      <span className="text-lg font-bold text-gray-900">
                        ${parseFloat(profitLoss.gross_revenue || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-600">Cost of Goods</span>
                      <span className="text-lg font-semibold text-red-600">
                        -${parseFloat(profitLoss.cost_of_goods || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-600">Gross Profit</span>
                      <span className="text-lg font-bold text-green-600">
                        ${parseFloat(profitLoss.gross_profit || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-600">Operating Expenses</span>
                      <span className="text-lg font-semibold text-red-600">
                        -${parseFloat(profitLoss.operating_expenses || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Net Profit</span>
                        <p className="text-xs text-gray-600 mt-1">
                          Margin: {parseFloat(profitLoss.profit_margin || 0).toFixed(1)}%
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">
                        ${parseFloat(profitLoss.net_profit || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-center">
                  <p className="text-gray-500">Profit/Loss data not available</p>
                </div>
              )}
            </div>

            {/* Peak Hours Analysis */}
            {peakHours ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Hourly Sales Pattern</h3>
                {peakHours.hourly_breakdown && peakHours.hourly_breakdown.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={peakHours.hourly_breakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="hour" 
                          stroke="#666"
                          fontSize={12}
                          tickFormatter={(value) => `${value}:00`}
                        />
                        <YAxis stroke="#666" fontSize={12} />
                        <Tooltip 
                          formatter={(value) => [`$${parseFloat(value).toFixed(2)}`, 'Sales']}
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px'
                          }}
                        />
                        <Bar dataKey="total_sales" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    {peakHours.peak_hour && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-green-900">Peak Hour</span>
                          </div>
                          <p className="text-2xl font-bold text-green-600">
                            {peakHours.peak_hour.hour}:00
                          </p>
                          <p className="text-sm text-green-700 mt-1">
                            ${parseFloat(peakHours.peak_hour.total_sales || 0).toFixed(2)} sales
                          </p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingDown className="h-5 w-5 text-orange-600" />
                            <span className="text-sm font-medium text-orange-900">Slowest Hour</span>
                          </div>
                          <p className="text-2xl font-bold text-orange-600">
                            {peakHours.slowest_hour?.hour || 'N/A'}:00
                          </p>
                          <p className="text-sm text-orange-700 mt-1">
                            ${parseFloat(peakHours.slowest_hour?.total_sales || 0).toFixed(2)} sales
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-8">No hourly data available</p>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-center">
                <p className="text-gray-500">Peak hours data not available</p>
              </div>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            {abcAnalysis ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {Object.entries(abcAnalysis.summary || {}).map(([category, data]) => (
                    <div key={category} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Category {category}</h3>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          category === 'A' ? 'bg-green-100' : category === 'B' ? 'bg-blue-100' : 'bg-orange-100'
                        }`}>
                          <span className={`text-xl font-bold ${
                            category === 'A' ? 'text-green-600' : category === 'B' ? 'text-blue-600' : 'text-orange-600'
                          }`}>
                            {category}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">Products</p>
                          <p className="text-2xl font-bold text-gray-900">{data.count || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Revenue</p>
                          <p className="text-xl font-bold text-gray-900">
                            ${parseFloat(data.revenue || 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Profit</p>
                          <p className="text-lg font-semibold text-green-600">
                            ${parseFloat(data.profit || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">ABC Product Classification</h3>
                  {abcAnalysis.products && abcAnalysis.products.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 text-sm font-medium text-gray-500">Product</th>
                            <th className="text-center py-3 text-sm font-medium text-gray-500">Category</th>
                            <th className="text-right py-3 text-sm font-medium text-gray-500">Revenue</th>
                            <th className="text-right py-3 text-sm font-medium text-gray-500">Qty Sold</th>
                            <th className="text-right py-3 text-sm font-medium text-gray-500">Cumulative %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(abcAnalysis.products.slice(0, 10) || []).map((product, index) => (
                            <tr key={product.product_id} className="hover:bg-gray-50">
                              <td className="py-3">
                                <div className="flex items-center">
                                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 mr-3">
                                    {index + 1}
                                  </span>
                                  <span className="font-medium text-gray-900">{product.product_title}</span>
                                </div>
                              </td>
                              <td className="py-3 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  product.category === 'A' 
                                    ? 'bg-green-100 text-green-700' 
                                    : product.category === 'B'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {product.category}
                                </span>
                              </td>
                              <td className="py-3 text-right font-semibold text-gray-900">
                                ${parseFloat(product.revenue || 0).toLocaleString()}
                              </td>
                              <td className="py-3 text-right text-gray-600">
                                {parseFloat(product.quantity_sold || 0).toFixed(0)}
                              </td>
                              <td className="py-3 text-right text-sm text-gray-600">
                                {product.cumulative_percent || 0}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No product data available</p>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-center">
                <p className="text-gray-500">ABC Analysis data not available</p>
              </div>
            )}
          </div>
        )}

        {/* Customer Segmentation Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            {customerSegments ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(customerSegments.segment_summary || {}).map(([segment, count]) => (
                    <div key={segment} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: SEGMENT_COLORS[segment] || '#6B7280' }}
                        />
                        <p className="text-xs font-medium text-gray-600">{segment}</p>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Customer RFM Analysis</h3>
                  {customerSegments.customers && customerSegments.customers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 text-sm font-medium text-gray-500">Customer</th>
                            <th className="text-center py-3 text-sm font-medium text-gray-500">Segment</th>
                            <th className="text-right py-3 text-sm font-medium text-gray-500">Recency</th>
                            <th className="text-right py-3 text-sm font-medium text-gray-500">Frequency</th>
                            <th className="text-right py-3 text-sm font-medium text-gray-500">Monetary</th>
                            <th className="text-center py-3 text-sm font-medium text-gray-500">RFM Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(customerSegments.customers.slice(0, 15) || []).map((customer) => (
                            <tr key={customer.customer_id} className="hover:bg-gray-50">
                              <td className="py-3">
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="font-medium text-gray-900">{customer.customer_name}</span>
                                </div>
                              </td>
                              <td className="py-3 text-center">
                                <span 
                                  className="px-3 py-1 rounded-full text-xs font-bold text-white"
                                  style={{ backgroundColor: SEGMENT_COLORS[customer.segment] || '#6B7280' }}
                                >
                                  {customer.segment}
                                </span>
                              </td>
                              <td className="py-3 text-right text-sm text-gray-600">
                                {customer.recency_days} days
                              </td>
                              <td className="py-3 text-right text-sm text-gray-600">
                                {customer.frequency}
                              </td>
                              <td className="py-3 text-right font-semibold text-gray-900">
                                ${parseFloat(customer.monetary || 0).toLocaleString()}
                              </td>
                              <td className="py-3 text-center">
                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                                  <span className="text-sm font-bold text-blue-600">{customer.rfm_score}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No customer data available</p>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-center">
                <p className="text-gray-500">Customer segmentation data not available</p>
              </div>
            )}
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            {profitLoss ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                    <DollarSign className="h-8 w-8 mb-3 opacity-80" />
                    <p className="text-sm opacity-90 mb-1">Gross Revenue</p>
                    <p className="text-3xl font-bold">${parseFloat(profitLoss.gross_revenue || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
                    <TrendingUp className="h-8 w-8 mb-3 opacity-80" />
                    <p className="text-sm opacity-90 mb-1">Gross Profit</p>
                    <p className="text-3xl font-bold">${parseFloat(profitLoss.gross_profit || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                    <Award className="h-8 w-8 mb-3 opacity-80" />
                    <p className="text-sm opacity-90 mb-1">Net Profit</p>
                    <p className="text-3xl font-bold">${parseFloat(profitLoss.net_profit || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
                    <Target className="h-8 w-8 mb-3 opacity-80" />
                    <p className="text-sm opacity-90 mb-1">Profit Margin</p>
                    <p className="text-3xl font-bold">{parseFloat(profitLoss.profit_margin || 0).toFixed(1)}%</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Financial Breakdown</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={prepareFinancialChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip 
                        formatter={(value) => [`$${parseFloat(value).toLocaleString()}`, '']}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px'
                        }}
                      />
                      <Bar dataKey="gross" fill="#3B82F6" name="Gross Revenue" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="cogs" fill="#EF4444" name="Cost of Goods" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="expenses" fill="#F59E0B" name="Operating Expenses" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="net" fill="#10B981" name="Net Profit" radius={[8, 8, 0, 0]} />
                      <Legend />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-center">
                <p className="text-gray-500">Financial data not available</p>
              </div>
            )}
          </div>
        )}

        {/* Forecast Tab */}
        {activeTab === 'forecast' && (
          <div className="space-y-6">
            {forecast ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Zap className="h-6 w-6 text-blue-600" />
                      <h3 className="text-lg font-bold text-gray-900">Forecast Summary</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <p className="text-sm font-medium text-gray-600 mb-1">Forecast Method</p>
                        <p className="text-lg font-bold text-gray-900">{forecast.method || 'N/A'}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-xl">
                        <p className="text-sm font-medium text-gray-600 mb-1">Confidence Level</p>
                        <p className="text-lg font-bold text-green-600 capitalize">{forecast.confidence || 'N/A'}</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-xl">
                        <p className="text-sm font-medium text-gray-600 mb-1">Forecast Period</p>
                        <p className="text-lg font-bold text-purple-600">{(forecast.forecast || []).length} days</p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Sales Forecast</h3>
                    {prepareForecastChartData().length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={prepareForecastChartData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#666"
                            fontSize={12}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis stroke="#666" fontSize={12} />
                          <Tooltip 
                            formatter={(value) => [`$${parseFloat(value).toFixed(2)}`, 'Sales']}
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="sales" 
                            stroke="#3B82F6" 
                            strokeWidth={3}
                            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                            name="Sales"
                          />
                          <Legend />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No forecast data available</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Upcoming Forecast</h3>
                  {(forecast.forecast || []).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {(forecast.forecast.slice(0, 5) || []).map((day, index) => (
                        <div key={index} className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                          <p className="text-sm font-medium text-blue-900 mb-1">
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-2xl font-bold text-blue-600">
                            ${parseFloat(day.forecasted_sales || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-blue-700 mt-1">Projected Sales</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No forecast data available</p>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-center">
                <p className="text-gray-500">Forecast data not available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}