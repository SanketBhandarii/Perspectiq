import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  username: string | null;
  role: string | null;
  login: (token: string, userId: number, username: string, role: string) => void;
  logout: () => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('role');
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
      if (storedUsername && storedRole) {
          setUsername(storedUsername);
          setRole(storedRole);
      } else {
          import('../services/api').then(({ api }) => {
              api.auth.getMe().then(user => {
                  setUsername(user.username);
                  setRole(user.role);
                  localStorage.setItem('username', user.username);
                  localStorage.setItem('role', user.role);
              }).catch(() => {
                  logout();
              });
          });
      }
    }
  }, []);
  const login = (newToken: string, userId: number, newUsername: string, newRole: string) => {
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('user_id', userId.toString());
    localStorage.setItem('username', newUsername);
    localStorage.setItem('role', newRole);
    setToken(newToken);
    setUsername(newUsername);
    setRole(newRole);
    setIsAuthenticated(true);
  };
  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setToken(null);
    setUsername(null);
    setRole(null);
    setIsAuthenticated(false);
  };
  return (
    <AuthContext.Provider value={{ isAuthenticated, token, username, role, login, logout }}>
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
