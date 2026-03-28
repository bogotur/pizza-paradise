import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");

    if (token && email) {
      setUser({ email });
    }
  }, []);

  const login = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem("token", token);
    localStorage.setItem("email", userData.email);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("pizza_cart_v1");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};