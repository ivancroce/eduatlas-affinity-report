import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

function decodeToUser(token) {
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp < Date.now() / 1000) {
      localStorage.removeItem("accessToken");
      return null;
    }
    return { role: decoded.role, userId: decoded.sub };
  } catch {
    localStorage.removeItem("accessToken");
    return null;
  }
}

function loadUserFromStorage() {
  const token = localStorage.getItem("accessToken");
  return token ? decodeToUser(token) : null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUserFromStorage);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "accessToken") setUser(loadUserFromStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback((token) => {
    localStorage.setItem("accessToken", token);
    const newUser = decodeToUser(token);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
