import React, { useMemo, useState, useCallback, useEffect } from "react";
import { authProvider } from "@/api/client";
import { AuthContext } from "@/hooks/useAuth";
import { useNavigate } from "react-router";

interface User {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<User>({
    isAuthenticated: false,
    isLoading: true,
    userId: null,
  });

  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    const abortController = new AbortController();
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      await authProvider.logout(abortController.signal);
      navigate("/", {
        replace: true,
      });
    } catch (error) {
      if (!abortController.signal.aborted) {
        console.error("Logout error:", error);
      }
    } finally {
      authProvider.setAccessToken(null);
      setState({
        isAuthenticated: false,
        isLoading: false,
        userId: null,
      });
    }

    return () => abortController.abort();
  }, [navigate]);

  const refreshToken = useCallback(async () => {
    const prevToken = authProvider.getAccessToken();
    if (prevToken) return prevToken;

    const newToken = await authProvider.refreshAccessToken();
    authProvider.setAccessToken(newToken);
    return newToken;
  }, []);

  const initializeAuth = useCallback(
    async (signal?: AbortSignal) => {
      try {
        if (state.userId) return;

        setState((prev) => ({ ...prev, isLoading: true }));

        await refreshToken();

        const response = await authProvider.getSession(signal);

        console.log(response);
        if (!response.success) throw new Error("Session expired");

        const { id, role } = response.data;

        if (!id || !role) throw new Error("Invalid session data");

        setState({
          isAuthenticated: true,
          isLoading: false,
          userId: id,
        });
      } catch (error: unknown) {
        if (!signal?.aborted) {
          console.error(
            "Auth initialization failed:",
            error instanceof Error ? error.message : "",
          );
          authProvider.setAccessToken(null);
          setState({
            isAuthenticated: false,
            isLoading: false,
            userId: null,
          });
        }
      }
    },
    [refreshToken, state.userId],
  );

  const handleLogin = useCallback(
    async (accessToken: string) => {
      setState({
        isAuthenticated: false,
        isLoading: false,
        userId: null,
      });
      try {
        authProvider.setAccessToken(accessToken);
        await initializeAuth();
      } catch (error) {
        console.error("Login failed:", error);
        throw error;
      }
    },
    [initializeAuth],
  );

  useEffect(() => {
    const abortController = new AbortController();

    initializeAuth(abortController.signal);

    // Silent refresh logic
    const refreshInterval = setInterval(
      async () => {
        if (state.isAuthenticated) {
          try {
            await refreshToken();
            console.log("Token refreshed");
          } catch (error) {
            console.error(
              "error in init auth useEffect: ",
              error instanceof Error ? error.message : "",
            );
          }
        }
      },
      10 * 60 * 1000,
    ); // 10 mins

    return () => {
      abortController.abort();
      clearInterval(refreshInterval);
    };
  }, [initializeAuth, refreshToken, state.isAuthenticated]);

  const contextValue = useMemo(
    () => ({
      ...state,
      handleLogin,
      refreshToken,
      handleLogout,
    }),
    [state, handleLogin, refreshToken, handleLogout],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
