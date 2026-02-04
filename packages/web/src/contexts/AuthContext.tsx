import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  authApi,
  type AuthResponse,
  type RegisterData,
  type LoginData,
  type Player,
  type League,
  type Match,
  leaguesApi,
  setRefreshTokenCallback,
  isLeagueOperator,
  canEditMatch as canEditMatchUtil,
} from '@league-genius/shared';

// Define user types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface LeagueData {
  myLeagues: League[];
  isLeagueOperator: (leagueId?: number) => boolean;
  canEditMatch: (match: Match, leagueId?: number) => boolean;
}

interface AuthContextType {
  user: User | null;
  player: Player | null;
  accessToken: string | null;
  leagueData: LeagueData;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  getAuthToken: () => string | null;
  refreshAccessToken: () => Promise<string | null>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [myLeagues, setMyLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuthData = () => {
    setUser(null);
    setPlayer(null);
    setAccessToken(null);
    setRefreshToken(null);
    setMyLeagues([]);

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('player');
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const currentRefreshToken = refreshToken || localStorage.getItem('refreshToken');

      if (!currentRefreshToken) {
        console.error('No refresh token available');
        return null;
      }

      const response = await authApi.refreshToken(currentRefreshToken);
      const newAccessToken = response.access;

      // Update access token in state and localStorage
      setAccessToken(newAccessToken);
      localStorage.setItem('accessToken', newAccessToken);

      return newAccessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, clear auth data and force re-login
      clearAuthData();
      return null;
    }
  };

  useEffect(() => {
    // Initialize the refresh token callback for the API client
    setRefreshTokenCallback(refreshAccessToken);

    // Check for saved tokens and user in localStorage
    const initAuth = async () => {
      const savedAccessToken = localStorage.getItem('accessToken');
      const savedRefreshToken = localStorage.getItem('refreshToken');
      const savedUser = localStorage.getItem('user');
      const savedPlayer = localStorage.getItem('player');

      if (savedAccessToken && savedRefreshToken && savedUser && savedPlayer) {
        setAccessToken(savedAccessToken);
        setRefreshToken(savedRefreshToken);
        setUser(JSON.parse(savedUser));
        setPlayer(JSON.parse(savedPlayer));

        // Attempt to refresh the token on app load to ensure it's valid
        // This prevents using an expired access token
        try {
          const response = await authApi.refreshToken(savedRefreshToken);
          const newAccessToken = response.access;
          setAccessToken(newAccessToken);
          localStorage.setItem('accessToken', newAccessToken);
        } catch (error) {
          console.error('Token refresh failed on init:', error);
          // If refresh fails, clear auth data
          clearAuthData();
        }
      }
      setIsLoading(false);
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch user's league operatorships when authenticated
  useEffect(() => {
    const fetchMyLeagues = async () => {
      if (accessToken) {
        try {
          const response = await leaguesApi.getMyLeagues(accessToken);
          setMyLeagues(response.results || []);
        } catch (error) {
          console.error('Failed to fetch my leagues:', error);
          setMyLeagues([]);
        }
      }
    };

    fetchMyLeagues();
  }, [accessToken]);

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

  // Helper function to check if user is a league operator
  const checkIsLeagueOperator = (leagueId?: number): boolean => {
    return isLeagueOperator(myLeagues, leagueId);
  };

  // Helper function to check if user can edit a match
  const checkCanEditMatch = (match: Match, leagueId?: number): boolean => {
    return canEditMatchUtil(match, player, myLeagues, leagueId);
  };

  const value = {
    user,
    player,
    accessToken,
    leagueData: {
      myLeagues,
      isLeagueOperator: checkIsLeagueOperator,
      canEditMatch: checkCanEditMatch,
    },
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user && !!accessToken,
    getAuthToken,
    refreshAccessToken,
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
