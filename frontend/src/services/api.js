import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

// Lampirkan token JWT ke setiap request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("fluwatch_token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// Normalkan pesan error
http.interceptors.response.use(
  (r) => r,
  (err) => Promise.reject(
    new Error(err?.response?.data?.pesan || err?.message || "Terjadi kesalahan")
  )
);

/** Kirim laporan gejala baru */
export const kirimLaporan   = (data)   => http.post("/laporan", data).then(r => r.data);

/** Ambil daftar laporan terbaru */
export const ambilLaporan   = (params) => http.get("/laporan", { params }).then(r => r.data);

/** Ambil statistik agregat. Opsional: { lat, lng, radius_km } untuk data area. */
export const ambilStatistik = (params) => http.get("/laporan/statistik", { params }).then(r => r.data);

/** Ambil data titik heatmap */
export const ambilDataPeta  = (params) => http.get("/peta", { params }).then(r => r.data);

/** Tanya AI Agent */
export const tanyaAI        = (data)   => http.post("/analisis", data).then(r => r.data);

// ── Auth ──────────────────────────────────────────────────────────────────
export const daftarAPI = (data) => http.post("/auth/daftar", data).then(r => r.data);
export const masukAPI  = (data) => http.post("/auth/masuk",  data).then(r => r.data);
export const sayaAPI   = ()     => http.get("/auth/saya").then(r => r.data);

// ── Admin ─────────────────────────────────────────────────────────────────
export const adminPengguna      = (params) => http.get("/admin/pengguna", { params }).then(r => r.data);
export const adminUbahPengguna  = (id, data) => http.patch(`/admin/pengguna/${id}`, data).then(r => r.data);
export const adminHapusPengguna = (id)    => http.delete(`/admin/pengguna/${id}`).then(r => r.data);
export const adminLaporan       = (params) => http.get("/admin/laporan", { params }).then(r => r.data);
export const adminHapusLaporan  = (id)    => http.delete(`/admin/laporan/${id}`).then(r => r.data);
