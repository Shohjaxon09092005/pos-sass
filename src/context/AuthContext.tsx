import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Company, Branch } from '../types';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  branches: Branch[];
  currentBranch: Branch | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchBranch: (branchId: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock data
const mockCompany: Company = {
  id: 'comp-1',
  name: 'Demo Restaurant Group',
  email: 'admin@demorestaurant.com',
  phone: '+1-555-0123',
  address: '123 Main Street, New York, NY 10001',
  plan: 'growth',
  status: 'active',
  createdAt: new Date('2024-01-01'),
};

const mockBranches: Branch[] = [
  {
    id: 'branch-1',
    companyId: 'comp-1',
    name: 'Downtown Location',
    address: '123 Main Street, New York, NY 10001',
    phone: '+1-555-0123',
    email: 'downtown@demorestaurant.com',
    timezone: 'America/New_York',
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'branch-2',
    companyId: 'comp-1',
    name: 'Uptown Location',
    address: '456 Park Avenue, New York, NY 10022',
    phone: '+1-555-0124',
    email: 'uptown@demorestaurant.com',
    timezone: 'America/New_York',
    isActive: true,
    createdAt: new Date('2024-01-15'),
  },
];

const mockUsers: Record<string, User> = {
  'admin@demo.com': {
    id: 'user-1',
    email: 'admin@demo.com',
    name: 'John Admin',
    role: 'admin',
    companyId: 'comp-1',
    branchId: 'branch-1',
    createdAt: new Date('2024-01-01'),
  },
  'manager@demo.com': {
    id: 'user-2',
    email: 'manager@demo.com',
    name: 'Jane Manager',
    role: 'manager',
    companyId: 'comp-1',
    branchId: 'branch-1',
    createdAt: new Date('2024-01-01'),
  },
  'cashier@demo.com': {
    id: 'user-3',
    email: 'cashier@demo.com',
    name: 'Bob Cashier',
    role: 'cashier',
    companyId: 'comp-1',
    branchId: 'branch-1',
    createdAt: new Date('2024-01-01'),
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company] = useState<Company>(mockCompany);
  const [branches] = useState<Branch[]>(mockBranches);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(mockBranches[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('demoUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    // Mock authentication
    const mockUser = mockUsers[email];
    if (mockUser) {
      setUser(mockUser);
      localStorage.setItem('demoUser', JSON.stringify(mockUser));
      
      // Set current branch based on user's branch
      const userBranch = branches.find(b => b.id === mockUser.branchId);
      if (userBranch) {
        setCurrentBranch(userBranch);
      }
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    setUser(null);
    setCurrentBranch(mockBranches[0]);
    localStorage.removeItem('demoUser');
  };

  const switchBranch = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (branch) {
      setCurrentBranch(branch);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      company,
      branches,
      currentBranch,
      login,
      logout,
      switchBranch,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}