// context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from "react";
const API_URL = import.meta.env.VITE_API_URL;
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
  first_name: string;
  last_name: string;
  billing_role: string;
  tenant: any;
  companies: Company[];
  permissions: string[];
  name?: string;
  role?: string;
  selected_company?: number; // Yangi maydon
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
  updateCompany: (
    companyId: number,
    companyData: Partial<Company>
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  // User display name ni olish
  const getUserDisplayName = (userData: any) => {
    if (userData.first_name && userData.last_name) {
      return `${userData.first_name} ${userData.last_name}`;
    }
    return userData.username || userData.email || "User";
  };
  
  // context/AuthContext.tsx - fetchUserData
  const fetchUserData = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/users/me/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("User data fetched:", userData);

        const normalizedUser = {
          ...userData,
          name: getUserDisplayName(userData),
          role: userData.billing_role || "user",
        };

        setUser(normalizedUser);

        if (userData.companies && userData.companies.length > 0) {
          const userCompanies = userData.companies;
          setCompanies(userCompanies);

          // Avval foydalanuvchining tanlangan kompaniyasini tekshiramiz
          let companyIdToSet: number;

          if (userData.selected_company) {
            // Agar backendda selected_company bo'lsa, undan foydalaning
            companyIdToSet = userData.selected_company;
            console.log(
              "Using user selected_company from backend:",
              companyIdToSet
            );
          } else {
            // Aks holda localStorage yoki birinchi kompaniyadan foydalaning
            const savedCompanyId = localStorage.getItem("selectedCompanyId");
            companyIdToSet = savedCompanyId
              ? parseInt(savedCompanyId)
              : userCompanies[0].id;
            console.log("Using fallback company ID:", companyIdToSet);
          }

          console.log("Setting company ID:", companyIdToSet);
          setSelectedCompanyId(companyIdToSet);

          const selectedCompany =
            userCompanies.find((c: Company) => c.id === companyIdToSet) ||
            userCompanies[0];
          setCompany(selectedCompany);

          // LocalStorage ga saqlash
          localStorage.setItem("selectedCompanyId", companyIdToSet.toString());
        } else {
          console.log("No companies found for user");
          setCompany(null);
          setCompanies([]);
          setSelectedCompanyId(null);
        }
      } else {
        console.error("Failed to fetch user data:", response.status);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("selectedCompanyId");
        setUser(null);
        setCompany(null);
        setCompanies([]);
        setSelectedCompanyId(null);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("selectedCompanyId");
      setUser(null);
      setCompany(null);
      setCompanies([]);
      setSelectedCompanyId(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Barcha kompaniyalarni olish (agar kerak bo'lsa)
  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("access_token");

      // Kompaniyalar ro'yxatini olish
      const response = await fetch(`${API_URL}/api/v1/companies/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const companiesArray = data.results || data;

        if (Array.isArray(companiesArray)) {
          setCompanies(companiesArray);
        } else {
          console.error("Kompaniyalar array formatida emas");
          setCompanies([]);
        }
      }
    } catch (error) {
      console.error("Kompaniyalarni yuklashda xatolik:", error);
    }
  };

  // Kompaniyani yangilash (PATCH) uchun alohida funksiya
  const updateCompany = async (
    companyId: number,
    companyData: Partial<Company>
  ) => {
    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_URL}/api/v1/companies/${companyId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(companyData),
        }
      );

      if (response.ok) {
        console.log("Company updated successfully");
        // Yangilangan kompaniya ma'lumotlarini yangilash
        await fetchUserData(); // yoki fetchCompanies() agar kerak bo'lsa
      } else {
        console.error("Kompaniyani yangilashda xatolik");
      }
    } catch (error) {
      console.error("Kompaniyani yangilashda xatolik:", error);
    }
  };
  // context/AuthContext.tsx - yangi funksiya qo'shing
  const updateUserSelectedCompany = async (companyId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/v1/users/${user?.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          selected_company: companyId,
        }),
      });

      if (response.ok) {
        console.log("User selected_company updated successfully");
        // Foydalanuvchi ma'lumotlarini yangilash
        await fetchUserData();
      } else {
        console.error("Failed to update user selected_company");
      }
    } catch (error) {
      console.error("Error updating user selected_company:", error);
    }
  };

  // setSelectedCompany funksiyasini yangilang
  const setSelectedCompany = async (companyId: number) => {
    console.log("Setting selected company:", companyId);
    setSelectedCompanyId(companyId);
    localStorage.setItem("selectedCompanyId", companyId.toString());

    const selected = companies.find((c: Company) => c.id === companyId);
    if (selected) {
      setCompany(selected);
      console.log("Company set to:", selected.title);
    }

    // Backendga foydalanuvchining tanlangan kompaniyasini yangilash
    if (user) {
      await updateUserSelectedCompany(companyId);
    }

    window.dispatchEvent(new Event("companyChanged"));
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Faqat kompaniyalar ro'yxatini yangilash kerak bo'lganda
  useEffect(() => {
    if (user && user.companies && user.companies.length === 0) {
      // Agar foydalanuvchida kompaniyalar bo'lmasa, barcha kompaniyalarni yuklash
      fetchCompanies();
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/jwt/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("user_email", email);
      await fetchUserData();
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("selectedCompanyId");
    setUser(null);
    setCompany(null);
    setCompanies([]);
    setSelectedCompanyId(null);
  };

  const value: AuthContextType = {
    user,
    company,
    companies,
    selectedCompanyId,
    login,
    logout,
    setSelectedCompany,
    fetchCompanies,
    fetchUserData,
    updateCompany, // Yangi funksiyani qo'shamiz
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
