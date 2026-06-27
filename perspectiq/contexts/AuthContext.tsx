import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  username: string | null;
  role: string | null;
  login: (token: string, userId: number, username: string, role: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      // 1. Try to get token from localStorage if it isn't blocked
      let storedToken = null;
      try {
        storedToken = localStorage.getItem('auth_token');
      } catch (e) {
        // localStorage blocked by iframe (cross-origin partition)
      }

      if (storedToken) {
        setToken(storedToken);
        setIsAuthenticated(true);
        // Verify with backend
        try {
          const { api } = await import('../services/api');
          const user = await api.auth.getMe();
          setUsername(user.username);
          setRole(user.role);
          try {
            localStorage.setItem('username', user.username);
            localStorage.setItem('role', user.role);
          } catch (e) {}
          setIsLoading(false);
          return;
        } catch {
          // Token invalid
          logout();
        }
      }

      // 2. If localStorage is empty/blocked, try a silent Whop iframe login
      const isIframe = window.self !== window.top;
      if (isIframe) {
        try {
          const response = await fetch('/api/auth/whop-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          if (response.ok) {
            const data = await response.json();
            setToken(data.token);
            setUsername(data.username);
            setRole(data.role);
            setIsAuthenticated(true);
            try {
              localStorage.setItem('auth_token', data.token);
              localStorage.setItem('user_id', data.user_id.toString());
              localStorage.setItem('username', data.username);
              localStorage.setItem('role', data.role);
            } catch (e) {}
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.log('Silent auto-login failed on reload:', e);
        }
      }

      // 3. Not authenticated
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (newToken: string, userId: number, newUsername: string, newRole: string) => {
    try {
      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('user_id', userId.toString());
      localStorage.setItem('username', newUsername);
      localStorage.setItem('role', newRole);
    } catch (e) {}
    setToken(newToken);
    setUsername(newUsername);
    setRole(newRole);
    setIsAuthenticated(true);
  };

  const logout = () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
    } catch (e) {}
    setToken(null);
    setUsername(null);
    setRole(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, token, username, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
