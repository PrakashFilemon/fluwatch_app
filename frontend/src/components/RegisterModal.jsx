import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

export default function RegisterModal({ onTutup, onBukaMasuk, onSelesai }) {
  const { daftar } = useAuth();
  const [form,    setForm]    = useState({ username: "", email: "", password: "", konfirmasi: "" });
  const [loading, setLoading] = useState(false);

  const ubah = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const kirim = async (e) => {
    e.preventDefault();
    if (form.password !== form.konfirmasi) {
      toast.error("Password dan konfirmasi tidak cocok");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }
    setLoading(true);
    try {
      await daftar(form.username, form.email, form.password);
      toast.success("Akun berhasil dibuat!");
      onSelesai?.();
      onTutup();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}>

      <div className="w-full max-w-sm rounded-2xl p-6 space-y-5"
        style={{ background: "#0d1627", border: "1px solid #1e3a5f" }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Daftar Akun</h2>
            <p className="text-xs text-gray-400 mt-0.5">Buat akun untuk melaporkan gejala</p>
          </div>
          <button onClick={onTutup}
            className="text-gray-500 hover:text-white transition text-xl leading-none">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={kirim} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={ubah}
              required
              placeholder="nama_pengguna"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition"
              style={{ background: "#111827", border: "1px solid #1e3a5f" }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={ubah}
              required
              placeholder="nama@email.com"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition"
              style={{ background: "#111827", border: "1px solid #1e3a5f" }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={ubah}
              required
              placeholder="Min. 8 karakter"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition"
              style={{ background: "#111827", border: "1px solid #1e3a5f" }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Konfirmasi Password</label>
            <input
              type="password"
              name="konfirmasi"
              value={form.konfirmasi}
              onChange={ubah}
              required
              placeholder="Ulangi password"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition"
              style={{ background: "#111827", border: "1px solid #1e3a5f" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-bold transition mt-1"
            style={{ background: loading ? "#7f1d1d" : "#dc2626", color: "#fff" }}>
            {loading ? "Memproses..." : "Buat Akun"}
          </button>
        </form>

        {/* Switch to login */}
        <p className="text-center text-xs text-gray-500">
          Sudah punya akun?{" "}
          <button
            onClick={() => { onTutup(); onBukaMasuk(); }}
            className="font-semibold transition"
            style={{ color: "#f97316" }}>
            Masuk di sini
          </button>
        </p>
      </div>
    </div>
  );
}
