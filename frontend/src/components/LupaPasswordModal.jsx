import { useState } from "react";
import toast from "react-hot-toast";
import { lupaPasswordAPI } from "../services/api";

export default function LupaPasswordModal({ onTutup, onBukaLogin }) {
  const [email,    setEmail]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [terkirim, setTerkirim] = useState(false);

  const kirim = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await lupaPasswordAPI({ email });
      setTerkirim(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-5"
        style={{ background: "#0d1627", border: "1px solid #1e3a5f" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Lupa Password</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Masukkan email untuk menerima link reset
            </p>
          </div>
          <button
            onClick={onTutup}
            className="text-gray-500 hover:text-white transition text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {terkirim ? (
          /* ── Sukses ── */
          <div className="text-center space-y-4 py-4">
            <div className="text-5xl">📧</div>
            <p className="text-sm text-gray-300">
              Link reset password telah dikirim ke{" "}
              <span className="text-white font-medium">{email}</span>.
            </p>
            <p className="text-xs text-gray-500">
              Cek inbox atau folder spam. Link berlaku 1 jam.
            </p>
            <button
              onClick={onTutup}
              className="w-full py-2.5 rounded-lg text-sm font-bold"
              style={{ background: "#dc2626", color: "#fff" }}
            >
              Tutup
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={kirim} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nama@email.com"
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
              {loading ? "Mengirim..." : "Kirim Link Reset"}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-500">
          Ingat password?{" "}
          <button
            onClick={() => { onTutup(); onBukaLogin?.(); }}
            className="font-semibold transition"
            style={{ color: "#f97316" }}
          >
            Masuk
          </button>
        </p>
      </div>
    </div>
  );
}
