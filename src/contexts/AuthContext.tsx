import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, type AuthResponse, type RegisterData, type LoginData, Player } from '../api';

// Define user types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface AuthContextType {
  user: User | null;
  player: Player | null;
  accessToken: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  getAuthToken: () => string | null;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved tokens and user in localStorage
    const savedAccessToken = localStorage.getItem('accessToken');
    const savedRefreshToken = localStorage.getItem('refreshToken');
    const savedUser = localStorage.getItem('user');
    const savedPlayer = localStorage.getItem('player');

    if (savedAccessToken && savedRefreshToken && savedUser && savedPlayer) {
      setAccessToken(savedAccessToken);
      setRefreshToken(savedRefreshToken);
      setUser(JSON.parse(savedUser));
      setPlayer(JSON.parse(savedPlayer));
    }
    setIsLoading(false);
  }, []);

  const saveAuthData = (data: AuthResponse) => {
    setUser(data.user);
    setPlayer(data.player);
    setAccessToken(data.access);
    setRefreshToken(data.refresh);

    localStorage.setItem('accessToken', data.access);
    localStorage.setItem('refreshToken', data.refresh);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('player', JSON.stringify(data.player));
  };

  const clearAuthData = () => {
    setUser(null);
    setPlayer(null);
    setAccessToken(null);
    setRefreshToken(null);

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('player');
  };

  const login = async (data: LoginData): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      saveAuthData(response);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authApi.register(data);
      saveAuthData(response);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (refreshToken && accessToken) {
        await authApi.logout(refreshToken, accessToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    } finally {
      clearAuthData();
      setIsLoading(false);
    }
  };

  const getAuthToken = (): string | null => {
    return accessToken;
  };

  const value = {
    user,
    player,
    accessToken,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user && !!accessToken,
    getAuthToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
