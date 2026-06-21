"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { AuthUser } from "../../types/auth";

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  hydrated: boolean;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  /**
   * =========================
   * RESTORE SESSION
   * =========================
   */
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (savedToken && savedUser) {
        const parsedUser: AuthUser = JSON.parse(savedUser);

        // 🔥 FIX: ensure _id exists
        if (!parsedUser?._id) {
          console.warn("Invalid user in storage, clearing session");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setHydrated(true);
          return;
        }

        setToken(savedToken);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Session restore failed", error);

      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setHydrated(true);
    }
  }, []);

  /**
   * =========================
   * CREATE SESSION
   * =========================
   */
  function setSession(nextToken: string, nextUser: AuthUser) {
    try {
      if (!nextUser?._id) {
        console.error("❌ Invalid user received:", nextUser);
        return;
      }

      // store locally (for UI only)
      localStorage.setItem("token", nextToken);
      localStorage.setItem("user", JSON.stringify(nextUser));

      // cookies (for middleware + backend fallback)
      document.cookie = `token=${nextToken}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `role=${nextUser.role}; path=/; max-age=86400; SameSite=Lax`;

      if (nextUser.schoolId) {
        document.cookie = `schoolId=${nextUser.schoolId}; path=/; max-age=86400; SameSite=Lax`;
      }

      // state update
      setToken(nextToken);
      setUser(nextUser);

      console.log("SESSION CREATED ✅", {
        _id: nextUser._id,
        role: nextUser.role,
        schoolId: nextUser.schoolId,
      });
    } catch (error) {
      console.error("Failed to save session", error);
    }
  }

  /**
   * =========================
   * LOGOUT
   * =========================
   */
  function logout() {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "schoolId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } catch (error) {
      console.error(error);
    }

    setToken(null);
    setUser(null);

    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        hydrated,
        setSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * =========================
 * HOOK
 * =========================
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}