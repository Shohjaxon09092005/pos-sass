import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { plans } from '../data/mockData';
import { CreditCard, Check, Star, ArrowRight, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';

export default function BillingPage() {
  const { company } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Mock billing data
  const currentPlan = plans.find(p => p.id === company?.plan) || plans[1];
  const usage = {
    companies: 1,
    branches: 2,
    registers: 4,
    employees: 8,
    ordersThisMonth: 1247,
  };

  const invoices = [
    {
      id: 'inv-001',
      date: new Date('2024-01-01'),
      amount: 79.00,
      status: 'paid',
      plan: 'Growth',
      period: 'Jan 2024',
    },
    {
      id: 'inv-002',
      date: new Date('2023-12-01'),
      amount: 79.00,
      status: 'paid',
      plan: 'Growth',
      period: 'Dec 2023',
    },
    {
      id: 'inv-003',
      date: new Date('2023-11-01'),
      amount: 79.00,
      status: 'paid',
      plan: 'Growth',
      period: 'Nov 2023',
    },
  ];

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-sm text-gray-600">Manage your subscription and billing information</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors">
          <CreditCard className="h-5 w-5" />
          <span>Update Payment Method</span>
        </button>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
            <p className="text-sm text-gray-600">You are currently on the {currentPlan.name} plan</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">${currentPlan.price}</div>
            <div className="text-sm text-gray-600">per month</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Branches</span>
              <span className="text-xs text-gray-500">
                {usage.branches} / {currentPlan.limits.branches === -1 ? '∞' : currentPlan.limits.branches}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ 
                  width: currentPlan.limits.branches === -1 ? '20%' : 
                    `${getUsagePercentage(usage.branches, currentPlan.limits.branches)}%` 
                }}
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Employees</span>
              <span className="text-xs text-gray-500">
                {usage.employees} / {currentPlan.limits.employees === -1 ? '∞' : currentPlan.limits.employees}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ 
                  width: currentPlan.limits.employees === -1 ? '20%' : 
                    `${getUsagePercentage(usage.employees, currentPlan.limits.employees)}%` 
                }}
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Orders</span>
              <span className="text-xs text-gray-500">
                {usage.ordersThisMonth.toLocaleString()} / {currentPlan.limits.ordersPerMonth === -1 ? '∞' : currentPlan.limits.ordersPerMonth.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ 
                  width: currentPlan.limits.ordersPerMonth === -1 ? '20%' : 
                    `${getUsagePercentage(usage.ordersThisMonth, currentPlan.limits.ordersPerMonth)}%` 
                }}
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Registers</span>
              <span className="text-xs text-gray-500">
                {usage.registers} / {currentPlan.limits.registers === -1 ? '∞' : currentPlan.limits.registers}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{ 
                  width: currentPlan.limits.registers === -1 ? '20%' : 
                    `${getUsagePercentage(usage.registers, currentPlan.limits.registers)}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Available Plans</h2>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={clsx(
                'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={clsx(
                'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                billingPeriod === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan.id;
            const price = billingPeriod === 'yearly' ? plan.price * 12 * 0.8 : plan.price;
            const isPopular = plan.id === 'growth';

            return (
              <div
                key={plan.id}
                className={clsx(
                  'relative rounded-xl border p-6 transition-all',
                  isCurrentPlan 
                    ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300',
                  isPopular && 'ring-2 ring-blue-200'
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">
                      ${billingPeriod === 'yearly' ? Math.round(price) : price}
                    </span>
                    <span className="text-gray-600">
                      /{billingPeriod === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <p className="text-sm text-green-600 font-medium mt-1">
                      Save 20% annually
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2 mb-6 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Branches</span>
                    <span>{plan.limits.branches === -1 ? 'Unlimited' : plan.limits.branches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Registers</span>
                    <span>{plan.limits.registers === -1 ? 'Unlimited' : plan.limits.registers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Employees</span>
                    <span>{plan.limits.employees === -1 ? 'Unlimited' : plan.limits.employees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Orders/month</span>
                    <span>{plan.limits.ordersPerMonth === -1 ? 'Unlimited' : plan.limits.ordersPerMonth.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  className={clsx(
                    'w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center',
                    isCurrentPlan
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : isPopular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  )}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? (
                    'Current Plan'
                  ) : (
                    <>
                      Upgrade to {plan.name}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Billing History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      #{invoice.id}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {format(invoice.date, 'MMM dd, yyyy')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {invoice.plan} - {invoice.period}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                      ${invoice.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-blue-600 hover:text-blue-900 flex items-center text-sm font-medium">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </button>
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