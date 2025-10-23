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

// types.ts
export interface Product {
  id: string;
  title: string;
  notes?: string;
  image?: string;
  price: number;
  cost: number;
  barcode?: string;
  reference?: string;
  sku: string;
  company: number;
  created_by: number;
  updated_by: number;
  category: string;
  unit: string;
  isActive?: boolean;
  stockQuantity?: number;
  minStock?: number;
  maxStock?: number;
  taxRate?: number;
}

export interface Category {
  id: string;
  title: string;
  parent: string | null;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Unit {
  id: string;
  title: string;
  abbreviation: string;
  created_at?: string;
  updated_at?: string;
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
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  total: number;
}

export interface Register {
  id: string;
  title: string;
  notes: string;
  is_active: boolean;
  company: number;
  created_by: number;
  updated_by: number;
}

export interface Session {
  id: string;
  title: string;
  start_at: string;
  end_at: string | null;
  status: string;
  opening_balance: number;
  closing_balance: number;
  total_sales: number;
  total_refunds: number;
  register: string;
  company: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  is_customer?: boolean;
  image:string
}
export interface PaymentMethod {
  id: string;
  name: string;
  is_online: boolean;
}

export interface Currency {
  id: string;
  title: string;
  symbol: string;
  code: string;
  is_default: boolean;
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
export interface StockMovement {
  id: string;
  product: string;
  product_title?: string;
  type: 'incoming' | 'outgoing' | 'adjustment';
  quantity: number;
  date: string;
  reason: string;
  notes?: string;
}

export interface Location {
  id: string;
  title: string;
  is_active: boolean;
  notes?: string;
  company?: number;
  created_by?: number;
  updated_by?: number;
  deleted_by?: number;
  deleted_at?: string;
}
