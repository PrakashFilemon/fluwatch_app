import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

export default function LoginModal({ onTutup, onBukaRegister, onSelesai }) {
  const { login } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);

  const kirim = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Selamat datang kembali!");
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
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => e.target === e.currentTarget && onTutup()}>

      <div className="w-full max-w-sm rounded-2xl p-6 space-y-5"
        style={{ background: "#0d1627", border: "1px solid #1e3a5f" }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Masuk</h2>
            <p className="text-xs text-gray-400 mt-0.5">Masuk untuk melaporkan gejala</p>
          </div>
          <button onClick={onTutup}
            className="text-gray-500 hover:text-white transition text-xl leading-none">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={kirim} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="nama@email.com"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition focus:ring-1"
              style={{ background: "#111827", border: "1px solid #1e3a5f", focusRingColor: "#3b82f6" }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition"
              style={{ background: "#111827", border: "1px solid #1e3a5f" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-bold transition"
            style={{ background: loading ? "#7f1d1d" : "#dc2626", color: "#fff" }}>
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        {/* Switch to register */}
        <p className="text-center text-xs text-gray-500">
          Belum punya akun?{" "}
          <button
            onClick={() => { onTutup(); onBukaRegister(); }}
            className="font-semibold transition"
            style={{ color: "#f97316" }}>
            Daftar sekarang
          </button>
        </p>
      </div>
    </div>
  );
}
