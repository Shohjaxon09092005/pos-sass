import { Product, Category, Customer, Sale, Supplier, Register, Plan } from '../types';

export const mockCategories: Category[] = [
  {
    id: 'cat-1',
    companyId: 'comp-1',
    name: 'Beverages',
    description: 'All drink items',
    isActive: true,
  },
  {
    id: 'cat-2',
    companyId: 'comp-1',
    name: 'Food',
    description: 'All food items',
    isActive: true,
  },
  {
    id: 'cat-3',
    companyId: 'comp-1',
    name: 'Desserts',
    description: 'Sweet treats',
    isActive: true,
  },
];

export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    companyId: 'comp-1',
    name: 'Espresso',
    sku: 'ESP001',
    barcode: '1234567890123',
    categoryId: 'cat-1',
    price: 3.50,
    cost: 0.75,
    stockQuantity: 1000,
    minStock: 50,
    maxStock: 2000,
    unit: 'cup',
    taxRate: 0.08,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'prod-2',
    companyId: 'comp-1',
    name: 'Cappuccino',
    sku: 'CAP001',
    barcode: '1234567890124',
    categoryId: 'cat-1',
    price: 4.25,
    cost: 1.00,
    stockQuantity: 850,
    minStock: 50,
    maxStock: 2000,
    unit: 'cup',
    taxRate: 0.08,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'prod-3',
    companyId: 'comp-1',
    name: 'Croissant',
    sku: 'CRO001',
    barcode: '1234567890125',
    categoryId: 'cat-2',
    price: 2.75,
    cost: 1.20,
    stockQuantity: 45,
    minStock: 20,
    maxStock: 200,
    unit: 'piece',
    taxRate: 0.08,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'prod-4',
    companyId: 'comp-1',
    name: 'Chocolate Cake',
    sku: 'CHC001',
    barcode: '1234567890126',
    categoryId: 'cat-3',
    price: 5.99,
    cost: 2.50,
    stockQuantity: 12,
    minStock: 5,
    maxStock: 50,
    unit: 'slice',
    taxRate: 0.08,
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
];

export const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    companyId: 'comp-1',
    name: 'Sarah Johnson',
    email: 'sarah@email.com',
    phone: '+1-555-0101',
    loyaltyPoints: 150,
    totalSpent: 245.50,
    lastVisit: new Date('2024-01-15'),
    createdAt: new Date('2023-12-01'),
  },
  {
    id: 'cust-2',
    companyId: 'comp-1',
    name: 'Mike Chen',
    email: 'mike@email.com',
    phone: '+1-555-0102',
    loyaltyPoints: 85,
    totalSpent: 127.25,
    lastVisit: new Date('2024-01-14'),
    createdAt: new Date('2024-01-05'),
  },
];

export const mockSales: Sale[] = [
  {
    id: 'sale-1',
    companyId: 'comp-1',
    branchId: 'branch-1',
    registerId: 'reg-1',
    employeeId: 'user-3',
    customerId: 'cust-1',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        name: 'Espresso',
        sku: 'ESP001',
        quantity: 2,
        unitPrice: 3.50,
        discountAmount: 0,
        total: 7.00,
      },
      {
        id: 'item-2',
        productId: 'prod-3',
        name: 'Croissant',
        sku: 'CRO001',
        quantity: 1,
        unitPrice: 2.75,
        discountAmount: 0,
        total: 2.75,
      },
    ],
    subtotal: 9.75,
    taxAmount: 0.78,
    discountAmount: 0,
    total: 10.53,
    paymentMethod: 'card',
    paymentAmount: 10.53,
    changeAmount: 0,
    status: 'completed',
    receiptNumber: 'R001-20240115-001',
    createdAt: new Date('2024-01-15T10:30:00'),
  },
];

export const mockRegisters: Register[] = [
  {
    id: 'reg-1',
    branchId: 'branch-1',
    name: 'Register 1',
    isActive: true,
    cashBalance: 250.00,
    lastSessionAt: new Date('2024-01-15T09:00:00'),
  },
  {
    id: 'reg-2',
    branchId: 'branch-1',
    name: 'Register 2',
    isActive: true,
    cashBalance: 180.50,
    lastSessionAt: new Date('2024-01-15T09:15:00'),
  },
];

export const mockSuppliers: Supplier[] = [
  {
    id: 'supp-1',
    companyId: 'comp-1',
    name: 'Premium Coffee Roasters',
    email: 'orders@premiumcoffee.com',
    phone: '+1-555-0201',
    address: '789 Coffee Street, Seattle, WA 98101',
    paymentTerms: 'Net 30',
    isActive: true,
  },
  {
    id: 'supp-2',
    companyId: 'comp-1',
    name: 'Fresh Bakery Supply',
    email: 'sales@freshbakery.com',
    phone: '+1-555-0202',
    address: '456 Wheat Avenue, Portland, OR 97201',
    paymentTerms: 'Net 15',
    isActive: true,
  },
];

export const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    interval: 'monthly',
    features: [
      'Basic POS functionality',
      'Inventory management',
      'Basic reporting',
      'Email support',
    ],
    limits: {
      companies: 1,
      branches: 2,
      registers: 2,
      employees: 5,
      ordersPerMonth: 2000,
    },
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 79,
    interval: 'monthly',
    features: [
      'Advanced POS features',
      'Advanced inventory',
      'Customer management',
      'Advanced reporting',
      'Scheduled reports',
      'Priority support',
    ],
    limits: {
      companies: 1,
      branches: 10,
      registers: 20,
      employees: 50,
      ordersPerMonth: 20000,
    },
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 199,
    interval: 'monthly',
    features: [
      'Multi-company management',
      'Unlimited everything',
      'Advanced analytics',
      'API access',
      'SSO integration',
      '24/7 phone support',
      'Dedicated account manager',
    ],
    limits: {
      companies: -1, // unlimited
      branches: -1,
      registers: -1,
      employees: 500,
      ordersPerMonth: -1,
    },
  },
];

// Generate more mock sales data for analytics
export const generateMockSalesData = (days: number = 30): Sale[] => {
  const sales: Sale[] = [];
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    const salesPerDay = Math.floor(Math.random() * 20) + 10;
    
    for (let j = 0; j < salesPerDay; j++) {
      const randomProducts = mockProducts
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1);
        
      const items = randomProducts.map((product, index) => ({
        id: `item-${i}-${j}-${index}`,
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: Math.floor(Math.random() * 3) + 1,
        unitPrice: product.price,
        discountAmount: 0,
        total: product.price * (Math.floor(Math.random() * 3) + 1),
      }));
      
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = subtotal * 0.08;
      const total = subtotal + taxAmount;
      
      sales.push({
        id: `sale-${i}-${j}`,
        companyId: 'comp-1',
        branchId: 'branch-1',
        registerId: 'reg-1',
        employeeId: 'user-3',
        customerId: Math.random() > 0.5 ? 'cust-1' : undefined,
        items,
        subtotal,
        taxAmount,
        discountAmount: 0,
        total,
        paymentMethod: Math.random() > 0.7 ? 'cash' : 'card',
        paymentAmount: total,
        changeAmount: 0,
        status: 'completed',
        receiptNumber: `R001-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${j.toString().padStart(3, '0')}`,
        createdAt: date,
      });
    }
  }
  
  return sales.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};