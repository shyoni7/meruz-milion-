import { createContext, useContext, useEffect, useState } from "react";

interface AdminContextType {
  token: string | null;
  displayName: string | null;
  isLoggedIn: boolean;
  login: (token: string, displayName: string) => void;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType>({
  token: null,
  displayName: null,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("admin_token"));
  const [displayName, setDisplayName] = useState<string | null>(() => localStorage.getItem("admin_name"));

  const login = (t: string, name: string) => {
    setToken(t);
    setDisplayName(name);
    localStorage.setItem("admin_token", t);
    localStorage.setItem("admin_name", name);
  };

  const logout = () => {
    setToken(null);
    setDisplayName(null);
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_name");
  };

  return (
    <AdminContext.Provider value={{ token, displayName, isLoggedIn: !!token, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);

