import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Building, 
  Shield, 
  Bell, 
  Save,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Use the same Company interface from AuthContext
interface Company {
  id: number;
  title: string;
  address: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  owner: number;
  allowed_users: number[];
}

interface User {
  id: number;
  email: string;
  username: string;
  billing_role: string;
  tenant: any;
  groups: any[];
  first_name: string;
  last_name: string;
  companies: Company[];
  selected_company: number;
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  companies: Company[];
  selectedCompanyId: number | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setSelectedCompany: (companyId: number) => void;
  fetchCompanies: () => Promise<void>;
  fetchUserData: () => Promise<void>;
  updateCompany: (companyId: number, companyData: Partial<Company>) => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL;

export default function SettingsPage() {
  const { user, company, fetchUserData, updateCompany, fetchCompanies } = useAuth();
  const { t } = useTranslation('settings');
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // User profile state
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });

  // Company state
  const [companyData, setCompanyData] = useState({
    title: '',
    email: '',
    phone: '',
    address: '',
    website: ''
  });

  // New company state
  const [newCompany, setNewCompany] = useState({
    title: '',
    email: '',
    phone: '',
    address: '',
    website: ''
  });

  // Password state
  const [password, setPassword] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    daily_sales: true,
    low_stock: true,
    new_orders: true,
    payments: true,
    system_updates: true
  });

  // Initialize form data
  useEffect(() => {
    if (user) {
      setProfile({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || ''
      });

      // Set company data from user's companies
      const userCompany = user.companies?.[0];
      if (userCompany) {
        setCompanyData({
          title: userCompany.title || '',
          email: userCompany.email || '',
          phone: userCompany.phone || '',
          address: userCompany.address || '',
          website: userCompany.website || ''
        });
      }
    }
  }, [user?.id]);

  const showMessage = useCallback((type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  }, []);

  // Profile API calls
  const handleSaveProfile = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/v1/users/me/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        await fetchUserData();
        showMessage('success', t('settings.messages.profileUpdated'));
      } else {
        const error = await response.json();
        showMessage('error', error.detail || t('settings.messages.failedToUpdate', { resource: 'profile' }));
      }
    } catch (error) {
      showMessage('error', t('settings.messages.errorUpdating', { resource: 'profile' }));
    }
    setLoading(false);
  }, [user, profile, fetchUserData, showMessage, t]);

  // Company API calls
  const handleSaveCompany = useCallback(async () => {
    if (!user || !user.companies?.[0]) {
      showMessage('error', t('settings.messages.noCompany'));
      return;
    }

    setLoading(true);
    try {
      const userCompany = user.companies[0];
      
      // Prepare company data for API - convert empty strings to null for nullable fields
      const apiCompanyData = {
        title: companyData.title,
        email: companyData.email || null,
        phone: companyData.phone || null,
        address: companyData.address,
        website: companyData.website || null
      };

      await updateCompany(userCompany.id, apiCompanyData);
      await fetchUserData();
      showMessage('success', t('settings.messages.companyUpdated'));
    } catch (error) {
      showMessage('error', t('settings.messages.errorUpdating', { resource: 'company' }));
    }
    setLoading(false);
  }, [user, companyData, updateCompany, fetchUserData, showMessage, t]);

  // Create new company
  const handleCreateCompany = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/v1/companies/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newCompany.title,
          email: newCompany.email || null,
          phone: newCompany.phone || null,
          address: newCompany.address,
          website: newCompany.website || null
        })
      });

      if (response.ok) {
        await fetchUserData();
        setShowAddCompanyModal(false);
        setNewCompany({ title: '', email: '', phone: '', address: '', website: '' });
        showMessage('success', t('settings.messages.companyCreated'));
      } else {
        const error = await response.json();
        showMessage('error', error.detail || t('settings.messages.failedToCreate', { resource: 'company' }));
      }
    } catch (error) {
      showMessage('error', t('settings.messages.errorCreating', { resource: 'company' }));
    }
    setLoading(false);
  }, [user, newCompany, fetchUserData, showMessage, t]);

  // Delete company
  const handleDeleteCompany = useCallback(async (companyId: number) => {
    if (!user) return;
    
    if (!window.confirm(t('settings.modals.deleteConfirm'))) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/v1/companies/${companyId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchUserData();
        showMessage('success', t('settings.messages.companyDeleted'));
      } else {
        const error = await response.json();
        showMessage('error', error.detail || t('settings.messages.failedToDelete', { resource: 'company' }));
      }
    } catch (error) {
      showMessage('error', t('settings.messages.errorDeleting', { resource: 'company' }));
    }
    setLoading(false);
  }, [user, fetchUserData, showMessage, t]);

  // Password API calls
  const handleChangePassword = useCallback(async () => {
    if (password.new_password !== password.confirm_new_password) {
      showMessage('error', t('settings.messages.passwordsMismatch'));
      return;
    }

    if (password.new_password.length < 8) {
      showMessage('error', t('settings.messages.passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/v1/users/set_password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: password.current_password,
          new_password: password.new_password,
          confirm_new_password: password.confirm_new_password
        })
      });

      if (response.ok) {
        showMessage('success', t('settings.messages.passwordUpdated'));
        setPassword({ current_password: '', new_password: '', confirm_new_password: '' });
      } else {
        const error = await response.json();
        showMessage('error', error.detail || t('settings.messages.failedToUpdate', { resource: 'password' }));
      }
    } catch (error) {
      showMessage('error', t('settings.messages.errorUpdating', { resource: 'password' }));
    }
    setLoading(false);
  }, [password, showMessage, t]);

  // Notification preferences (local storage for demo)
  const handleSaveNotifications = useCallback(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(notifications));
    showMessage('success', t('settings.messages.preferencesSaved'));
  }, [notifications, showMessage, t]);

  const togglePasswordVisibility = useCallback((field: keyof typeof showPassword) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  }, []);

  // Input change handlers with useCallback
  const handleProfileChange = useCallback((field: keyof typeof profile) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  const handleCompanyDataChange = useCallback((field: keyof typeof companyData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCompanyData(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  const handleNewCompanyChange = useCallback((field: keyof typeof newCompany) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewCompany(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  const handlePasswordChange = useCallback((field: keyof typeof password) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  const handleNotificationChange = useCallback((key: keyof typeof notifications) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotifications(prev => ({
      ...prev,
      [key]: e.target.checked
    }));
  }, []);

  const tabs = useMemo(() => [
    { id: 'profile', name: t('settings.tabs.profile'), icon: User },
    { id: 'company', name: t('settings.tabs.company'), icon: Building },
    { id: 'notifications', name: t('settings.tabs.notifications'), icon: Bell },
    { id: 'security', name: t('settings.tabs.security'), icon: Shield },
  ], [t]);

  const ProfileSettings = useCallback(() => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('settings.profile.title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.profile.firstName')}
            </label>
            <input
              type="text"
              value={profile.first_name}
              onChange={handleProfileChange('first_name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('settings.profile.firstNamePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.profile.lastName')}
            </label>
            <input
              type="text"
              value={profile.last_name}
              onChange={handleProfileChange('last_name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('settings.profile.lastNamePlaceholder')}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.profile.email')}
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={handleProfileChange('email')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('settings.profile.emailPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.profile.role')}
            </label>
            <input
              type="text"
              value={user?.billing_role || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 capitalize"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.profile.username')}
            </label>
            <input
              type="text"
              value={user?.username || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleSaveProfile}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Save className="h-5 w-5" />
          <span>{loading ? t('settings.actions.saving') : t('settings.actions.saveChanges')}</span>
        </button>
      </div>
    </div>
  ), [profile, user, loading, handleSaveProfile, handleProfileChange, t]);

  const CompanySettings = useCallback(() => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">{t('settings.company.title')}</h3>
        <button
          onClick={() => setShowAddCompanyModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>{t('settings.company.addCompany')}</span>
        </button>
      </div>

      {/* Current Companies List */}
      {user?.companies && user.companies.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">{t('settings.company.yourCompanies')}</h4>
          {user.companies.map((comp) => (
            <div key={comp.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{comp.title}</h5>
                  <p className="text-sm text-gray-600 mt-1">{comp.address}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {comp.phone && (
                      <span className="text-sm text-gray-500">📞 {comp.phone}</span>
                    )}
                    {comp.email && (
                      <span className="text-sm text-gray-500">✉️ {comp.email}</span>
                    )}
                    {comp.website && (
                      <span className="text-sm text-gray-500">🌐 {comp.website}</span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleDeleteCompany(comp.id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title={t('settings.actions.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Current Company */}
      {user?.companies && user.companies.length > 0 && (
        <div className="border-t pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">{t('settings.company.editCompany')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.company.companyName')}
              </label>
              <input
                type="text"
                value={companyData.title}
                onChange={handleCompanyDataChange('title')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('settings.company.companyNamePlaceholder')}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.company.email')}
              </label>
              <input
                type="email"
                value={companyData.email}
                onChange={handleCompanyDataChange('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('settings.company.emailPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.company.phone')}
              </label>
              <input
                type="tel"
                value={companyData.phone}
                onChange={handleCompanyDataChange('phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('settings.company.phonePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.company.website')}
              </label>
              <input
                type="url"
                value={companyData.website}
                onChange={handleCompanyDataChange('website')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('settings.company.websitePlaceholder')}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.company.address')}
              </label>
              <textarea
                rows={3}
                value={companyData.address}
                onChange={handleCompanyDataChange('address')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('settings.company.addressPlaceholder')}
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button 
              onClick={handleSaveCompany}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <Save className="h-5 w-5" />
              <span>{loading ? t('settings.actions.saving') : t('settings.actions.saveChanges')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  ), [user, companyData, loading, handleSaveCompany, handleDeleteCompany, handleCompanyDataChange, t]);

  const SecuritySettings = useCallback(() => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('settings.security.title')}</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.security.currentPassword')}
            </label>
            <div className="relative">
              <input
                type={showPassword.current ? "text" : "password"}
                value={password.current_password}
                onChange={handlePasswordChange('current_password')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                placeholder={t('settings.security.currentPasswordPlaceholder')}
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
              >
                {showPassword.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.security.newPassword')}
            </label>
            <div className="relative">
              <input
                type={showPassword.new ? "text" : "password"}
                value={password.new_password}
                onChange={handlePasswordChange('new_password')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                placeholder={t('settings.security.newPasswordPlaceholder')}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
              >
                {showPassword.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.security.confirmPassword')}
            </label>
            <div className="relative">
              <input
                type={showPassword.confirm ? "text" : "password"}
                value={password.confirm_new_password}
                onChange={handlePasswordChange('confirm_new_password')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                placeholder={t('settings.security.confirmPasswordPlaceholder')}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
              >
                {showPassword.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleChangePassword}
          disabled={loading || !password.current_password || !password.new_password || !password.confirm_new_password}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Save className="h-5 w-5" />
          <span>{loading ? t('settings.actions.updating') : t('settings.security.updatePassword')}</span>
        </button>
      </div>
    </div>
  ), [password, showPassword, loading, handleChangePassword, togglePasswordVisibility, handlePasswordChange, t]);

  const NotificationSettings = useCallback(() => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('settings.notifications.title')}</h3>
        <div className="space-y-4">
          {[
            { 
              key: 'daily_sales' as keyof typeof notifications, 
              name: t('settings.notifications.dailySales'), 
              description: t('settings.notifications.dailySalesDesc') 
            },
            { 
              key: 'low_stock' as keyof typeof notifications, 
              name: t('settings.notifications.lowStock'), 
              description: t('settings.notifications.lowStockDesc') 
            },
            { 
              key: 'new_orders' as keyof typeof notifications, 
              name: t('settings.notifications.newOrders'), 
              description: t('settings.notifications.newOrdersDesc') 
            },
            { 
              key: 'payments' as keyof typeof notifications, 
              name: t('settings.notifications.payments'), 
              description: t('settings.notifications.paymentsDesc') 
            },
            { 
              key: 'system_updates' as keyof typeof notifications, 
              name: t('settings.notifications.systemUpdates'), 
              description: t('settings.notifications.systemUpdatesDesc') 
            },
          ].map((notification) => (
            <div key={notification.key} className="flex items-center justify-between py-3">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{notification.name}</h4>
                <p className="text-sm text-gray-500">{notification.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={notifications[notification.key]}
                  onChange={handleNotificationChange(notification.key)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleSaveNotifications}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Save className="h-5 w-5" />
          <span>{t('settings.notifications.savePreferences')}</span>
        </button>
      </div>
    </div>
  ), [notifications, handleSaveNotifications, handleNotificationChange, t]);

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case 'profile': return <ProfileSettings />;
      case 'company': return <CompanySettings />;
      case 'security': return <SecuritySettings />;
      case 'notifications': return <NotificationSettings />;
      default: return <ProfileSettings />;
    }
  }, [activeTab, ProfileSettings, CompanySettings, SecuritySettings, NotificationSettings]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('settings.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
          <p className="text-sm text-gray-600">{t('settings.subtitle')}</p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`rounded-lg p-4 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:space-x-8">
          {/* Sidebar */}
          <div className="lg:w-64 mb-6 lg:mb-0">
            <nav className="space-y-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="mr-3 h-5 w-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {renderContent()}
            </div>
          </div>
        </div>

        {/* Add Company Modal */}
        {showAddCompanyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">{t('settings.modals.addCompany.title')}</h3>
                <button
                  onClick={() => setShowAddCompanyModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.company.companyName')}
                  </label>
                  <input
                    type="text"
                    value={newCompany.title}
                    onChange={handleNewCompanyChange('title')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('settings.company.companyNamePlaceholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.company.address')}
                  </label>
                  <textarea
                    rows={3}
                    value={newCompany.address}
                    onChange={handleNewCompanyChange('address')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('settings.company.addressPlaceholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.company.phone')}
                  </label>
                  <input
                    type="tel"
                    value={newCompany.phone}
                    onChange={handleNewCompanyChange('phone')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('settings.company.phonePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.company.email')}
                  </label>
                  <input
                    type="email"
                    value={newCompany.email}
                    onChange={handleNewCompanyChange('email')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('settings.company.emailPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.company.website')}
                  </label>
                  <input
                    type="url"
                    value={newCompany.website}
                    onChange={handleNewCompanyChange('website')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('settings.company.websitePlaceholder')}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('settings.actions.cancel')}
                </button>
                <button
                  onClick={handleCreateCompany}
                  disabled={loading || !newCompany.title || !newCompany.address}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? t('settings.actions.creating') : t('settings.modals.addCompany.create')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}