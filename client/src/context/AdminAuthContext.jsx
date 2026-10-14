import { useEffect, useState } from "react";
import { AdminAuthContext } from "./adminAuthContextValue";
import api from "../services/api";

const TOKEN_KEY = "amade_admin_token";
const ADMIN_ROLES = new Set(["admin", "super_admin"]);

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(window.sessionStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    const clearSession = (event) => {
      if (event?.detail?.tokenKey && event.detail.tokenKey !== TOKEN_KEY) return;
      window.sessionStorage.removeItem(TOKEN_KEY);
      setUser(null);
    };

    window.addEventListener("amade:auth-expired", clearSession);
    const token = window.sessionStorage.getItem(TOKEN_KEY);

    if (token) {
      api.get("/auth/me", { authTokenKey: TOKEN_KEY })
        .then(({ data }) => {
          const currentUser = data.data;
          if (ADMIN_ROLES.has(currentUser?.role)) {
            setUser(currentUser);
          } else {
            clearSession();
          }
        })
        .catch(() => clearSession())
        .finally(() => setIsLoading(false));
    }

    return () => window.removeEventListener("amade:auth-expired", clearSession);
  }, []);

  const login = async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    const { token, user: loggedInUser } = data.data;

    if (!ADMIN_ROLES.has(loggedInUser?.role)) {
      throw new Error("This account does not have administrator access.");
    }

    window.sessionStorage.setItem(TOKEN_KEY, token);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = async () => {
    try {
      const token = window.sessionStorage.getItem(TOKEN_KEY);
      if (token) {
        await api.post("/auth/logout", {}, { authTokenKey: TOKEN_KEY });
      }
    } catch {
      // Ignore backend logout errors and clear the local session anyway.
    } finally {
      window.sessionStorage.removeItem(TOKEN_KEY);
      setUser(null);
    }
  };

  return (
    <AdminAuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
