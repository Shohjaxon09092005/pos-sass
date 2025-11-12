import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Plus, Mail, Phone, Shield, Clock, X, Trash2, Edit, AlertCircle, CheckCircle, Eye, CreditCard, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Interfaces for TypeScript
interface Company {
  id: number;
  title: string;
  address: string;
  phone: string;
  email: string | null;
  website: string | null;
  allowed_users: number[];
  created_at: string;
  updated_at: string;
}

interface Employee {
  email: string;
  id: number;
  username: string;
  billing_role: string;
  tenant: any;
  groups: string[];
  permissions: string[];
  first_name: string;
  last_name: string;
  companies: Company[];
  selected_company: number;
}

interface FormData {
  email: string;
  username: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  billing_role: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  password2?: string;
  general?: string;
}

export default function EmployeesPage() {
  const { user: currentUser } = useAuth();
  const { t } = useTranslation('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    username: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    billing_role: 'viewer' // Default role changed to viewer
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  // Token ni localStorage dan olish
  const getToken = (): string | null => {
    return localStorage.getItem('access_token');
  };

  // Fetch employees from API
  const fetchEmployees = async (): Promise<void> => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/users/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.results || []);
      } else {
        console.error('Failed to fetch employees');
        setFormErrors({ general: t('employees.errors.fetchFailed') });
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setFormErrors({ general: t('employees.errors.fetchFailed') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Parol kuchini tekshirish
  const checkPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    if (password.length < 8) return 'weak';
    if (password.length < 12) return 'medium';
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const strengthFactors = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    if (strengthFactors >= 3) return 'strong';
    if (strengthFactors >= 2) return 'medium';
    return 'weak';
  };

  // Formani tekshirish
  const validateForm = (isEdit: boolean = false): boolean => {
    const errors: FormErrors = {};

    // Email tekshirish
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    // Parol tekshirish (faqat yangi xodim qo'shishda yoki parol o'zgartirilayotganda)
    if (!isEdit || formData.password) {
      if (!formData.password && !isEdit) {
        errors.password = t('employees.modals.invite.passwordRequired');
      } else if (formData.password && formData.password.length < 8) {
        errors.password = t('employees.modals.invite.passwordWeak');
      } else if (formData.password !== formData.password2) {
        errors.password2 = t('employees.modals.invite.passwordMismatch');
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create new employee
  const createEmployee = async (employeeData: FormData): Promise<boolean> => {
    try {
      const token = getToken();
      if (!token) {
        console.error('No token found');
        setFormErrors({ general: t('employees.errors.createFailed') });
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/users/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });

      if (response.ok) {
        await fetchEmployees();
        setShowInviteModal(false);
        resetForm();
        return true;
      } else {
        const errorData = await response.json();
        console.error('Failed to create employee:', errorData);
        
        // API dan kelgan xatolarni ko'rsatish
        if (errorData.email) {
          setFormErrors({ email: errorData.email[0] });
        } else if (errorData.password) {
          setFormErrors({ password: errorData.password[0] });
        } else {
          setFormErrors({ general: t('employees.errors.createFailed') });
        }
        return false;
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      setFormErrors({ general: t('employees.errors.createFailed') });
      return false;
    }
  };

  // Update employee
  const updateEmployee = async (id: number, employeeData: Partial<FormData>): Promise<boolean> => {
    try {
      const token = getToken();
      if (!token) {
        console.error('No token found');
        setFormErrors({ general: t('employees.errors.updateFailed') });
        return false;
      }

      // Agar parol bo'sh bo'lsa, uni yubormaymiz
      const dataToSend = { ...employeeData };
      if (!dataToSend.password) {
        delete dataToSend.password;
        delete dataToSend.password2;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/users/${id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        await fetchEmployees();
        setShowEditModal(false);
        setSelectedEmployee(null);
        resetForm();
        return true;
      } else {
        const errorData = await response.json();
        console.error('Failed to update employee:', errorData);
        
        // API dan kelgan xatolarni ko'rsatish
        if (errorData.email) {
          setFormErrors({ email: errorData.email[0] });
        } else if (errorData.password) {
          setFormErrors({ password: errorData.password[0] });
        } else {
          setFormErrors({ general: t('employees.errors.updateFailed') });
        }
        return false;
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      setFormErrors({ general: t('employees.errors.updateFailed') });
      return false;
    }
  };

  // Delete employee
  const deleteEmployee = async (id: number): Promise<void> => {
    if (window.confirm(t('employees.actions.deleteConfirmation'))) {
      try {
        const token = getToken();
        if (!token) {
          console.error('No token found');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/users/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          await fetchEmployees();
        } else {
          console.error('Failed to delete employee');
          setFormErrors({ general: t('employees.errors.deleteFailed') });
        }
      } catch (error) {
        console.error('Error deleting employee:', error);
        setFormErrors({ general: t('employees.errors.deleteFailed') });
      }
    }
  };

  const resetForm = (): void => {
    setFormData({
      email: '',
      username: '',
      password: '',
      password2: '',
      first_name: '',
      last_name: '',
      billing_role: 'viewer'
    });
    setFormErrors({});
    setPasswordStrength(null);
    setSubmitLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Parol o'zgarganda kuchini tekshirish
    if (name === 'password') {
      if (value.length === 0) {
        setPasswordStrength(null);
      } else {
        setPasswordStrength(checkPasswordStrength(value));
      }
    }

    // Xatoliklarni tozalash
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitLoading(true);
    setFormErrors({});

    const isEdit = !!selectedEmployee;
    
    if (!validateForm(isEdit)) {
      setSubmitLoading(false);
      return;
    }

    const employeeData = {
      email: formData.email,
      username: formData.username || formData.email.split('@')[0],
      password: formData.password,
      password2: formData.password2,
      first_name: formData.first_name,
      last_name: formData.last_name,
      billing_role: formData.billing_role
    };

    let success = false;
    if (selectedEmployee) {
      success = await updateEmployee(selectedEmployee.id, employeeData);
    } else {
      success = await createEmployee(employeeData);
    }

    setSubmitLoading(false);
    
    if (success) {
      resetForm();
    }
  };

  const handleEdit = (employee: Employee): void => {
    setSelectedEmployee(employee);
    setFormData({
      email: employee.email,
      username: employee.username,
      password: '', // Don't fill password for security
      password2: '',
      first_name: employee.first_name,
      last_name: employee.last_name,
      billing_role: employee.billing_role
    });
    setFormErrors({});
    setPasswordStrength(null);
    setShowEditModal(true);
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'billing_admin': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'viewer': return 'bg-green-100 text-green-800 border border-green-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getRoleIcon = (role: string): React.ReactElement => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4" />;
      case 'billing_admin':
        return <CreditCard className="h-4 w-4" />;
      case 'viewer':
        return <Eye className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const formatRole = (role: string): string => {
    return t(`employees.roles.${role}`) || role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getPasswordStrengthColor = (): string => {
    switch (passwordStrength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getPasswordStrengthText = (): string => {
    switch (passwordStrength) {
      case 'weak': return 'Weak';
      case 'medium': return 'Medium';
      case 'strong': return 'Strong';
      default: return '';
    }
  };

  const totalEmployees = employees.length;
  const viewersCount = employees.filter(emp => emp.billing_role === 'viewer').length;
  const ownersCount = employees.filter(emp => emp.billing_role === 'owner').length;
  const billingAdminsCount = employees.filter(emp => emp.billing_role === 'billing_admin').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">{t('employees.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('employees.title')}</h1>
          <p className="text-sm text-gray-600">{t('employees.subtitle')}</p>
        </div>
       
        <button 
          onClick={() => setShowInviteModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>{t('employees.inviteEmployee')}</span>
        </button>
      </div>

      {/* Global Error Display */}
      {formErrors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-700">{formErrors.general}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('employees.stats.totalEmployees')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{totalEmployees}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <User className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('employees.stats.viewers')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{viewersCount}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <Eye className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('employees.stats.owners')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{ownersCount}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Crown className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('employees.stats.billingAdmins')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{billingAdminsCount}</p>
            </div>
            <div className="bg-indigo-500 p-3 rounded-lg">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('employees.table.teamMembers')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('employees.table.employee')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('employees.table.role')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('employees.table.companies')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('employees.table.contact')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('employees.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {employee.first_name && employee.last_name 
                            ? `${employee.first_name[0]}${employee.last_name[0]}`
                            : employee.username?.substring(0, 2).toUpperCase() || 'US'
                          }
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.first_name && employee.last_name 
                            ? `${employee.first_name} ${employee.last_name}`
                            : employee.username
                          }
                          {employee.id === currentUser?.id && (
                            <span className="ml-2 text-xs text-blue-600 font-medium">{t('employees.table.you')}</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(employee.billing_role)}`}>
                      <span className="mr-1">{getRoleIcon(employee.billing_role)}</span>
                      <span className="capitalize">{formatRole(employee.billing_role)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      {employee.companies?.map((company: Company) => company.title).join(', ') || t('employees.table.noCompanies')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-3 w-3 mr-1" />
                        <span className="truncate max-w-32">{employee.email}</span>
                      </div>
                      {employee.companies?.[0]?.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-3 w-3 mr-1" />
                          <span>{employee.companies[0].phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                        title={t('employees.actions.edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {employee.id !== currentUser?.id && (
                        <button
                          onClick={() => deleteEmployee(employee.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                          title={t('employees.actions.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Employee Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto" style={{marginTop:"50px"}}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">{t('employees.modals.invite.title')}</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('employees.modals.invite.firstName')}
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('employees.modals.invite.firstNamePlaceholder')}
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('employees.modals.invite.lastName')}
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('employees.modals.invite.lastNamePlaceholder')}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('employees.modals.invite.email')}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={t('employees.modals.invite.emailPlaceholder')}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('employees.modals.invite.username')}
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('employees.modals.invite.usernamePlaceholder')}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('employees.modals.invite.password')}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={t('employees.modals.invite.passwordPlaceholder')}
                />
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {formErrors.password}
                  </p>
                )}
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Password strength:</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength === 'weak' ? 'text-red-600' :
                        passwordStrength === 'medium' ? 'text-yellow-600' :
                        passwordStrength === 'strong' ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ 
                          width: passwordStrength === 'weak' ? '33%' : 
                                 passwordStrength === 'medium' ? '66%' : 
                                 passwordStrength === 'strong' ? '100%' : '0%' 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('employees.modals.invite.password2')}
                </label>
                <input
                  type="password"
                  name="password2"
                  value={formData.password2}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.password2 ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={t('employees.modals.invite.password2Placeholder')}
                />
                {formErrors.password2 && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {formErrors.password2}
                  </p>
                )}
                {formData.password2 && formData.password === formData.password2 && formData.password.length > 0 && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {t('employees.modals.invite.passwordsMatch')}
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('employees.modals.invite.role')}
                </label>
                <select 
                  name="billing_role"
                  value={formData.billing_role}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="viewer">{t('employees.roles.viewer')}</option>
                  <option value="owner">{t('employees.roles.owner')}</option>
                  <option value="billing_admin">{t('employees.roles.billing_admin')}</option>
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  {t('employees.modals.invite.invitationNote')}
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitLoading}
                >
                  {t('employees.modals.invite.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('employees.modals.invite.sending')}
                    </>
                  ) : (
                    t('employees.modals.invite.sendInvitation')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto" style={{marginTop:"50px"}}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">{t('employees.modals.edit.title')}</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEmployee(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('employees.modals.invite.firstName')}
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('employees.modals.invite.firstNamePlaceholder')}
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('employees.modals.invite.lastName')}
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('employees.modals.invite.lastNamePlaceholder')}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('employees.modals.invite.email')}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={t('employees.modals.invite.emailPlaceholder')}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('employees.modals.invite.username')}
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('employees.modals.edit.newPassword')}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={t('employees.modals.edit.newPasswordPlaceholder')}
                />
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {formErrors.password}
                  </p>
                )}
                
                {/* Password Strength Indicator for Edit */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Password strength:</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength === 'weak' ? 'text-red-600' :
                        passwordStrength === 'medium' ? 'text-yellow-600' :
                        passwordStrength === 'strong' ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ 
                          width: passwordStrength === 'weak' ? '33%' : 
                                 passwordStrength === 'medium' ? '66%' : 
                                 passwordStrength === 'strong' ? '100%' : '0%' 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('employees.modals.invite.password2')}
                </label>
                <input
                  type="password"
                  name="password2"
                  value={formData.password2}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.password2 ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={t('employees.modals.invite.password2Placeholder')}
                />
                {formErrors.password2 && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {formErrors.password2}
                  </p>
                )}
                {formData.password2 && formData.password === formData.password2 && formData.password.length > 0 && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {t('employees.modals.invite.passwordsMatch')}
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('employees.modals.invite.role')}
                </label>
                <select 
                  name="billing_role"
                  value={formData.billing_role}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="viewer">{t('employees.roles.viewer')}</option>
                  <option value="owner">{t('employees.roles.owner')}</option>
                  <option value="billing_admin">{t('employees.roles.billing_admin')}</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEmployee(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitLoading}
                >
                  {t('employees.modals.invite.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('employees.modals.edit.updating')}
                    </>
                  ) : (
                    t('employees.modals.edit.update')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}