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
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(58,142,133,0.2)",
          boxShadow: "0 24px 60px rgba(58,142,133,0.15), 0 8px 24px rgba(0,0,0,0.1)",
        }}
      >
        {/* Teal accent bar */}
        <div style={{ height: 4, background: "linear-gradient(90deg,#3A8E85,#7EB8B1)" }} />

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#7EB8B1,#3A8E85)" }}
              >
                <span className="text-lg">🔑</span>
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: "#1F2937" }}>
                  Lupa Password
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                  Masukkan email untuk menerima link reset
                </p>
              </div>
            </div>
            <button
              onClick={onTutup}
              className="text-lg leading-none transition-colors"
              style={{ color: "#9CA3AF" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1F2937")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}
            >
              ✕
            </button>
          </div>

          {terkirim ? (
            /* ── Sukses ── */
            <div className="text-center space-y-4 py-2">
              <div
                className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl"
                style={{ background: "linear-gradient(135deg,#D8E8E6,rgba(58,142,133,0.15))" }}
              >
                📧
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "#1F2937" }}>
                  Email terkirim!
                </p>
                <p className="text-xs mt-1.5" style={{ color: "#6B7280" }}>
                  Link reset password dikirim ke{" "}
                  <span className="font-semibold" style={{ color: "#3A8E85" }}>{email}</span>.
                </p>
                <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                  Cek inbox atau folder spam. Link berlaku 1 jam.
                </p>
              </div>
              <button
                onClick={onTutup}
                className="w-full py-2.5 rounded-lg text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#3A8E85,#006B5F)" }}
              >
                Tutup
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={kirim} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nama@email.com"
                  onFocus={(e) => (e.target.style.borderColor = "#3A8E85")}
                  onBlur={(e)  => (e.target.style.borderColor = "rgba(58,142,133,0.25)")}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                  style={{
                    background: "#F9FAFB",
                    border: "1px solid rgba(58,142,133,0.25)",
                    color: "#1F2937",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-bold text-white transition-opacity"
                style={{
                  background: "linear-gradient(135deg,#3A8E85,#006B5F)",
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Mengirim..." : "Kirim Link Reset"}
              </button>
            </form>
          )}

          {/* Switch */}
          <p className="text-center text-xs" style={{ color: "#9CA3AF" }}>
            Ingat password?{" "}
            <button
              onClick={() => { onTutup(); onBukaLogin?.(); }}
              className="font-semibold transition-colors"
              style={{ color: "#3A8E85" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#006B5F")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#3A8E85")}
            >
              Masuk
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
