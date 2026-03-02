import { createContext, useContext, useEffect, useState } from "react";
import { daftarAPI, masukAPI, sayaAPI } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [pengguna, setPengguna] = useState(null);
  const [loading,  setLoading]  = useState(true);

  // Restore sesi dari localStorage saat mount
  useEffect(() => {
    const token = localStorage.getItem("fluwatch_token");
    if (!token) { setLoading(false); return; }

    // Gunakan cache user jika tersedia agar tidak perlu API call tambahan
    const cached = sessionStorage.getItem("fluwatch_user");
    if (cached) {
      try {
        setPengguna(JSON.parse(cached));
        setLoading(false);
        return;
      } catch {
        sessionStorage.removeItem("fluwatch_user");
      }
    }

    sayaAPI()
      .then(data => {
        setPengguna(data.pengguna);
        sessionStorage.setItem("fluwatch_user", JSON.stringify(data.pengguna));
      })
      .catch(() => localStorage.removeItem("fluwatch_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await masukAPI({ email, password });
    localStorage.setItem("fluwatch_token", data.token);
    sessionStorage.setItem("fluwatch_user", JSON.stringify(data.pengguna));
    setPengguna(data.pengguna);
    return data.pengguna;
  };

  const daftar = async (username, email, password) => {
    const data = await daftarAPI({ username, email, password });
    localStorage.setItem("fluwatch_token", data.token);
    sessionStorage.setItem("fluwatch_user", JSON.stringify(data.pengguna));
    setPengguna(data.pengguna);
    return data.pengguna;
  };

  const logout = () => {
    localStorage.removeItem("fluwatch_token");
    sessionStorage.removeItem("fluwatch_user");
    setPengguna(null);
  };

  return (
    <AuthContext.Provider value={{
      pengguna,
      sudahLogin: !!pengguna,
      isAdmin:    pengguna?.role === "admin",
      loading,
      login,
      logout,
      daftar,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
