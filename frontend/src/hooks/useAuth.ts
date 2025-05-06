import { createContext, useContext } from "react";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  handleLogin: (accessToken: string) => Promise<void>;
  refreshToken: () => Promise<string>;
  handleLogout: () => Promise<() => void>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
