export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'manager' | 'cashier' | 'purchaser' | 'analyst';
  companyId: string;
  branchId?: string;
  avatar?: string;
  createdAt: Date;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  plan: 'starter' | 'growth' | 'scale';
  status: 'active' | 'trial' | 'suspended';
  createdAt: Date;
  trialEndsAt?: Date;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  price: number;
  cost: number;
  stockQuantity: number;
  minStock: number;
  maxStock: number;
  unit: string;
  taxRate: number;
  isActive: boolean;
  variants?: ProductVariant[];
  createdAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
}

export interface Category {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  loyaltyPoints: number;
  totalSpent: number;
  lastVisit?: Date;
  createdAt: Date;
}

export interface Sale {
  id: string;
  companyId: string;
  branchId: string;
  registerId: string;
  employeeId: string;
  customerId?: string;
  items: SaleItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'mixed';
  paymentAmount: number;
  changeAmount: number;
  status: 'completed' | 'refunded' | 'voided';
  receiptNumber: string;
  createdAt: Date;
}

export interface SaleItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  total: number;
}

export interface Register {
  id: string;
  branchId: string;
  name: string;
  isActive: boolean;
  cashBalance: number;
  lastSessionAt?: Date;
}

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms: string;
  isActive: boolean;
}

export interface PurchaseOrder {
  id: string;
  companyId: string;
  supplierId: string;
  orderNumber: string;
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  expectedDate?: Date;
  receivedDate?: Date;
  createdAt: Date;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface InventoryAdjustment {
  id: string;
  companyId: string;
  branchId: string;
  productId: string;
  type: 'increase' | 'decrease' | 'count';
  quantity: number;
  reason: string;
  employeeId: string;
  createdAt: Date;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    companies: number;
    branches: number;
    registers: number;
    employees: number;
    ordersPerMonth: number;
  };
}