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

    sayaAPI()
      .then(data => setPengguna(data.pengguna))
      .catch(() => localStorage.removeItem("fluwatch_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await masukAPI({ email, password });
    localStorage.setItem("fluwatch_token", data.token);
    setPengguna(data.pengguna);
    return data.pengguna;
  };

  const daftar = async (username, email, password) => {
    const data = await daftarAPI({ username, email, password });
    localStorage.setItem("fluwatch_token", data.token);
    setPengguna(data.pengguna);
    return data.pengguna;
  };

  const logout = () => {
    localStorage.removeItem("fluwatch_token");
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
