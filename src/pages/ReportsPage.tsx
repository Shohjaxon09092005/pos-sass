import React, { useState } from 'react';
import { generateMockSalesData, mockProducts } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Download, Filter, TrendingUp, DollarSign, ShoppingCart, Package } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('7days');
  const [reportType, setReportType] = useState('sales');

  const salesData = generateMockSalesData(30);
  
  // Filter data based on selected date range
  const getFilteredData = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case '24hours':
        startDate = subDays(now, 1);
        break;
      case '7days':
        startDate = subDays(now, 7);
        break;
      case '30days':
        startDate = subDays(now, 30);
        break;
      case '90days':
        startDate = subDays(now, 90);
        break;
      default:
        startDate = subDays(now, 7);
    }
    
    return salesData.filter(sale => sale.createdAt >= startDate);
  };

  const filteredSales = getFilteredData();
  
  // Analytics calculations
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalOrders = filteredSales.length;
  const avgOrderValue = totalRevenue / totalOrders || 0;
  
  // Daily revenue data for chart
  const dailyRevenueData = filteredSales
    .reduce((acc, sale) => {
      const date = format(sale.createdAt, 'yyyy-MM-dd');
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.revenue += sale.total;
        existing.orders += 1;
      } else {
        acc.push({
          date,
          revenue: sale.total,
          orders: 1,
          day: format(sale.createdAt, 'MMM dd')
        });
      }
      return acc;
    }, [] as any[])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14); // Show last 14 days max

  // Product performance data
  const productPerformance = filteredSales
    .flatMap(sale => sale.items)
    .reduce((acc, item) => {
      const existing = acc.find(p => p.productId === item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.total;
      } else {
        acc.push({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          revenue: item.total,
        });
      }
      return acc;
    }, [] as any[])
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Payment method distribution
  const paymentMethodData = filteredSales
    .reduce((acc, sale) => {
      const existing = acc.find(p => p.method === sale.paymentMethod);
      if (existing) {
        existing.count += 1;
        existing.value += sale.total;
      } else {
        acc.push({
          method: sale.paymentMethod,
          count: 1,
          value: sale.total,
        });
      }
      return acc;
    }, [] as any[])
    .map(item => ({
      name: item.method === 'card' ? 'Card' : 'Cash',
      value: item.count,
      revenue: item.value,
      color: item.method === 'card' ? '#3B82F6' : '#10B981',
    }));

  const reports = [
    { id: 'sales', name: 'Sales Report', icon: ShoppingCart },
    { id: 'products', name: 'Product Performance', icon: Package },
    { id: 'financial', name: 'Financial Summary', icon: DollarSign },
    { id: 'trends', name: 'Trend Analysis', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-600">Track performance and analyze trends</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors">
          <Download className="h-5 w-5" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {reports.map(report => (
                  <option key={report.id} value={report.id}>{report.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="24hours">Last 24 Hours</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{totalOrders}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">${avgOrderValue.toFixed(2)}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Growth Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">+12.5%</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="day" 
                stroke="#666"
                fontSize={12}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                formatter={(value: any) => [`$${value.toFixed(2)}`, 'Revenue']}
                labelStyle={{ color: '#666' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethodData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {paymentMethodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any, name, props) => [
                  `${value} transactions`,
                  props.payload.name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-4 mt-4">
            {paymentMethodData.map((item, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">
                  {item.name} (${item.revenue.toFixed(2)})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Products</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 text-sm font-medium text-gray-500">Product</th>
                <th className="text-right py-3 text-sm font-medium text-gray-500">Quantity Sold</th>
                <th className="text-right py-3 text-sm font-medium text-gray-500">Revenue</th>
                <th className="text-right py-3 text-sm font-medium text-gray-500">Avg Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {productPerformance.map((product, index) => (
                <tr key={product.productId}>
                  <td className="py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-xs font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-right text-sm text-gray-900">
                    {product.quantity}
                  </td>
                  <td className="py-4 text-right text-sm font-semibold text-gray-900">
                    ${product.revenue.toFixed(2)}
                  </td>
                  <td className="py-4 text-right text-sm text-gray-900">
                    ${(product.revenue / product.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}