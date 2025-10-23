// components/Dashboard.tsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { generateMockSalesData } from "../data/mockData";

const salesData = generateMockSalesData(7);

const revenueData = salesData
  .reduce((acc, sale) => {
    const date = sale.createdAt.toISOString().split("T")[0];
    const existing = acc.find((item) => item.date === date);
    if (existing) {
      existing.revenue += sale.total;
      existing.orders += 1;
    } else {
      acc.push({
        date,
        revenue: sale.total,
        orders: 1,
        day: sale.createdAt.toLocaleDateString("en", { weekday: "short" }),
      });
    }
    return acc;
  }, [] as any[])
  .slice(0, 7)
  .reverse();

const categoryData = [
  { name: "Beverages", value: 45, color: "#3B82F6" },
  { name: "Food", value: 35, color: "#10B981" },
  { name: "Desserts", value: 20, color: "#F59E0B" },
];

const topProducts = [
  { name: "Espresso", sales: 234, revenue: 819, trend: "+12%" },
  { name: "Cappuccino", sales: 189, revenue: 803.25, trend: "+8%" },
  { name: "Croissant", sales: 156, revenue: 429, trend: "+5%" },
  { name: "Chocolate Cake", sales: 45, revenue: 269.55, trend: "-3%" },
];

// User display name ni olish uchun helper function
const getUserDisplayName = (user: any) => {
  if (user?.first_name && user?.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  return user?.username || user?.email || "User";
};

export default function Dashboard() {
  const { user, company } = useAuth();

  const totalRevenue = salesData.reduce((sum, sale) => sum + sale.total, 0);
  const totalOrders = salesData.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalCustomers = 247; // Mock data

  const stats = [
    {
      name: "Revenue Today",
      value: `$${
        revenueData[revenueData.length - 1]?.revenue.toFixed(2) || "0.00"
      }`,
      change: "+12.5%",
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      name: "Orders Today",
      value: revenueData[revenueData.length - 1]?.orders.toString() || "0",
      change: "+8.2%",
      icon: ShoppingCart,
      color: "bg-blue-500",
    },
    {
      name: "Active Customers",
      value: totalCustomers.toString(),
      change: "+4.1%",
      icon: Users,
      color: "bg-purple-500",
    },
    {
      name: "Avg Order Value",
      value: `$${avgOrderValue.toFixed(2)}`,
      change: "+2.3%",
      icon: TrendingUp,
      color: "bg-orange-500",
    },
  ];

  const lowStockItems = [
    { name: "Croissant", stock: 12, minStock: 20 },
    { name: "Chocolate Cake", stock: 8, minStock: 10 },
    { name: "Oat Milk", stock: 3, minStock: 15 },
  ];

  // Xavfsiz ma'lumot olish
  const userName = getUserDisplayName(user);
  const branchName =  company?.title || "Branch";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good morning, {userName}!
        </h1>
        <p className="text-sm text-gray-600">
          Here's what's happening at {branchName} today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
                <p className="text-sm text-green-600 font-medium mt-1">
                  {stat.change}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#666" fontSize={12} />
              <YAxis
                stroke="#666"
                fontSize={12}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                formatter={(value: any) => [`$${value.toFixed(2)}`, "Revenue"]}
                labelStyle={{ color: "#666" }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sales by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => [`${value}%`, "Sales Share"]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-4 mt-4">
            {categoryData.map((item, index) => (
              <div key={index} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Products
          </h3>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div
                key={product.name}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">
                      #{index + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {product.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {product.sales} sold
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${product.revenue.toFixed(2)}
                  </p>
                  <p
                    className={`text-sm ${
                      product.trend.startsWith("+")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {product.trend}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts & Low Stock */}
        <div className="space-y-6">
          {/* Low Stock Alert */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Low Stock</h3>
            </div>
            <div className="space-y-3">
              {lowStockItems.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-900">{item.name}</span>
                  <span className="text-sm font-medium text-amber-600">
                    {item.stock}/{item.minStock}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <Clock className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                <span className="text-gray-600">Sale #R001-001 completed</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                <span className="text-gray-600">New customer registered</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                <span className="text-gray-600">Inventory adjusted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}