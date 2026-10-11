import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  role: string;
  createdAt: string;
};

type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  password: string;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "sentinel_auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount (client-side only)
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (mounted && data.user) {
            setUser(data.user);
          }
        } else {
          // Token expired or invalid — clear stale state
          localStorage.removeItem(TOKEN_KEY);
          if (mounted) {
            setUser(null);
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshUser = async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    // Explicitly clear any existing session/token before attempting login
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
    setUser(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Invalid email or password.",
        };
      }

      if (typeof window !== "undefined" && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      setUser(data.user);

      return {
        success: true,
        user: data.user,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error during login.";
      return {
        success: false,
        error: msg,
      };
    }
  };

  const register = async (payload: RegisterPayload) => {
    // Clear any previous session/token before registering to guarantee session isolation
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
    setUser(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Failed to create account.",
        };
      }

      if (typeof window !== "undefined" && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      setUser(data.user);

      return {
        success: true,
        user: data.user,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error during registration.";
      return {
        success: false,
        error: msg,
      };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout request errors
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_KEY);
      }
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
