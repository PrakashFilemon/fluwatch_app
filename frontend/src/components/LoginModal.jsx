import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

export default function LoginModal({ onTutup, onBukaRegister, onBukaLupaPassword, onSelesai }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const kirim = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const pengguna = await login(email, password);
      toast.success("Selamat datang kembali!");
      if (pengguna?.role === "admin") {
        window.location.href = "/management";
        return;
      }
      onSelesai?.();
      onTutup();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const focusBorder  = (e) => (e.target.style.borderColor = "#3A8E85");
  const blurBorder   = (e) => (e.target.style.borderColor = "rgba(58,142,133,0.25)");

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
                <span className="text-lg">🦠</span>
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: "#1F2937" }}>
                  Masuk
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                  Masuk untuk melaporkan gejala
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

          {/* Form */}
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
                onFocus={focusBorder}
                onBlur={blurBorder}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  background: "#F9FAFB",
                  border: "1px solid rgba(58,142,133,0.25)",
                  color: "#1F2937",
                }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: "#374151" }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { onTutup(); onBukaLupaPassword?.(); }}
                  className="text-xs font-medium transition-colors"
                  style={{ color: "#3A8E85" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#006B5F")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#3A8E85")}
                >
                  Lupa password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                onFocus={focusBorder}
                onBlur={blurBorder}
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
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          {/* Switch */}
          <p className="text-center text-xs" style={{ color: "#9CA3AF" }}>
            Belum punya akun?{" "}
            <button
              onClick={() => { onTutup(); onBukaRegister(); }}
              className="font-semibold transition-colors"
              style={{ color: "#3A8E85" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#006B5F")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#3A8E85")}
            >
              Daftar sekarang
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
