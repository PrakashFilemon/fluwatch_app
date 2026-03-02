import { useState } from "react";
import toast from "react-hot-toast";
import { resetPasswordAPI } from "../services/api";

export default function ResetPassword({ token, onSelesai }) {
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasi,   setKonfirmasi]   = useState("");
  const [loading,      setLoading]      = useState(false);
  const [berhasil,     setBerhasil]     = useState(false);

  const kirim = async (e) => {
    e.preventDefault();
    if (passwordBaru !== konfirmasi) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    setLoading(true);
    try {
      await resetPasswordAPI({ token, password_baru: passwordBaru });
      setBerhasil(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#060d1a" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-5"
        style={{ background: "#0d1627", border: "1px solid #1e3a5f" }}
      >
        {/* Header */}
        <div>
          <h2 className="text-lg font-bold text-white">Reset Password</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Buat password baru untuk akun kamu
          </p>
        </div>

        {berhasil ? (
          /* ── Sukses ── */
          <div className="text-center space-y-4 py-4">
            <div className="text-5xl">✅</div>
            <p className="text-sm text-gray-300">
              Password berhasil diubah!
            </p>
            <p className="text-xs text-gray-500">
              Silakan masuk dengan password baru kamu.
            </p>
            <button
              onClick={onSelesai}
              className="w-full py-2.5 rounded-lg text-sm font-bold"
              style={{ background: "#dc2626", color: "#fff" }}
            >
              Masuk Sekarang
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={kirim} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Password Baru
              </label>
              <input
                type="password"
                value={passwordBaru}
                onChange={(e) => setPasswordBaru(e.target.value)}
                required
                minLength={8}
                placeholder="Min. 8 karakter"
                className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition"
                style={{ background: "#111827", border: "1px solid #1e3a5f" }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Konfirmasi Password
              </label>
              <input
                type="password"
                value={konfirmasi}
                onChange={(e) => setKonfirmasi(e.target.value)}
                required
                placeholder="Ulangi password baru"
                className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition"
                style={{ background: "#111827", border: "1px solid #1e3a5f" }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-bold transition"
              style={{ background: loading ? "#7f1d1d" : "#dc2626", color: "#fff" }}
            >
              {loading ? "Memproses..." : "Ubah Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
