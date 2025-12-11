import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  userType?: 'league_admin' | 'coach_player';
  tier?: number;
  leagueLimit?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string, userType?: 'league_admin' | 'coach_player', tier?: number) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const userData = await authApi.getCurrentUser();
          setUser(userData);
          setToken(storedToken);
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
  };

  const signup = async (email: string, password: string, firstName: string, lastName: string, userType?: 'league_admin' | 'coach_player', tier?: number) => {
    const response = await authApi.signup(email, password, firstName, lastName, userType, tier);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
    return response; // Return response so signup page can check for invitations
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    signup,
    logout,
    isLoading,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

