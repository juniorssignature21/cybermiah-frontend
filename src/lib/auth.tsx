import { createContext, useContext, useEffect, useState } from 'react';
import { getRole, getToken, setRole, setToken } from './api';
import { clearAttempts } from './attempt-store';
import { useLocation } from 'wouter';

interface AuthContextType {
  token: string | null;
  role: string | null;
  login: (token: string, role: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [role, setRoleState] = useState<string | null>(getRole());
  const [, setLocation] = useLocation();

  const login = (newToken: string, newRole: string) => {
    setToken(newToken);
    setRole(newRole);
    setTokenState(newToken);
    setRoleState(newRole);
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setTokenState(null);
    setRoleState(null);
    clearAttempts();
    setLocation('/login');
  };

  return (
    <AuthContext.Provider value={{ token, role, login, logout, isAuthenticated: !!token }}>
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
