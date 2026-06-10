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

  setSession: (
    token: string,
    user: AuthUser
  ) => void;

  logout: () => void;
};

const AuthContext =
  createContext<AuthContextType | null>(
    null
  );

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [token, setToken] =
    useState<string | null>(null);

  const [hydrated, setHydrated] =
    useState(false);

  /**
   * RESTORE SESSION
   */
  useEffect(() => {
    try {
      const savedToken =
        localStorage.getItem("token");

      const savedUser =
        localStorage.getItem("user");

      if (
        savedToken &&
        savedUser
      ) {
        const parsedUser =
          JSON.parse(savedUser);

        setToken(savedToken);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error(
        "Session restore failed",
        error
      );

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );
    } finally {
      setHydrated(true);
    }
  }, []);

function setSession(nextToken: string, nextUser: AuthUser) {
  localStorage.setItem("token", nextToken);
  localStorage.setItem("user", JSON.stringify(nextUser));

  // IMPORTANT: make cookie readable by middleware
  document.cookie = `token=${nextToken}; path=/; max-age=86400`;

  setToken(nextToken);
  setUser(nextUser);
}
  

  /**
   * LOGOUT
   */
  function logout() {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    document.cookie =
      "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    setToken(null);
    setUser(null);

    window.location.href =
      "/login";
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

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}