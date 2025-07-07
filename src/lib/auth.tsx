import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { apiClient, type User, type UserLogin, type UserRegister } from "./api";

// ===== CONSTANTS =====
const TOKEN_KEY = "bioclick_token" as const;

// ===== TYPES =====
interface AuthContextType {
  user: User | null;
  login: (credentials: UserLogin) => Promise<void>;
  register: (userData: UserRegister) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ===== CONTEXT =====
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ===== UTILITY FUNCTIONS =====
const isClientSide = () => typeof window !== "undefined";

const getStoredToken = (): string | null => {
  if (!isClientSide()) return null;
  return localStorage.getItem(TOKEN_KEY);
};

const clearStoredToken = (): void => {
  if (!isClientSide()) return;
  localStorage.removeItem(TOKEN_KEY);
};

// ===== PROVIDER COMPONENT =====
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // ===== USER LOADING =====
  const loadCurrentUser = useCallback(async (): Promise<void> => {
    try {
      const currentUser = await apiClient.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to load user:", error);
      // Token might be invalid, clear it
      apiClient.clearToken();
      clearStoredToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===== AUTHENTICATION ACTIONS =====
  const login = useCallback(
    async (credentials: UserLogin): Promise<void> => {
      try {
        setIsLoading(true);
        await apiClient.login(credentials);
        await loadCurrentUser();
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    },
    [loadCurrentUser]
  );

  const register = useCallback(
    async (userData: UserRegister) => {
      try {
        setIsLoading(true);
        await apiClient.register(userData);
        // Auto-login after registration
        await login({
          username: userData.username,
          password: userData.password,
        });
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    },
    [login]
  );

  const logout = useCallback((): void => {
    apiClient.clearToken();
    clearStoredToken();
    setUser(null);
  }, []);

  // ===== INITIALIZATION =====
  useEffect(() => {
    if (!isClientSide()) {
      setIsLoading(false);
      return;
    }

    const token = getStoredToken();
    if (token) {
      apiClient.setToken(token);
      loadCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, [loadCurrentUser]);

  // ===== CONTEXT VALUE =====
  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ===== HOOK =====
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used with an AuthProvider");
  }
  return context;
}
