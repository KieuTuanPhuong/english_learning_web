"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as api from "./api";
import { qk } from "./query-keys";
import type { Role, RegisterRequest, User } from "./types";

type AuthContextValue = {
  user: User | null;
  role: Role | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (body: RegisterRequest) => Promise<User>;
  refreshMe: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .bootstrapSession()
      .then((restored) => {
        if (!active) return;
        if (restored) queryClient.setQueryData(qk.me, restored);
        setUser(restored);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [queryClient]);

  const login = useCallback(
    async (email: string, password: string) => {
      const loggedIn = await api.login(email, password);
      queryClient.setQueryData(qk.me, loggedIn);
      setUser(loggedIn);
      return loggedIn;
    },
    [queryClient],
  );

  const register = useCallback(
    async (body: RegisterRequest) => {
      const created = await api.register(body);
      queryClient.setQueryData(qk.me, created);
      setUser(created);
      return created;
    },
    [queryClient],
  );

  const refreshMe = useCallback(async () => {
    const fresh = await api.getMe();
    queryClient.setQueryData(qk.me, fresh);
    setUser(fresh);
  }, [queryClient]);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isLoading,
        login,
        register,
        refreshMe,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
