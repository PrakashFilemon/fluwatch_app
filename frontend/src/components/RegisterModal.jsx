import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

export default function RegisterModal({ onTutup, onBukaMasuk, onSelesai }) {
  const { daftar } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "", konfirmasi: "" });
  const [loading, setLoading] = useState(false);

  const ubah = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

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

  const focusBorder = (e) => (e.target.style.borderColor = "#3A8E85");
  const blurBorder  = (e) => (e.target.style.borderColor = "rgba(58,142,133,0.25)");

  const fields = [
    { name: "username",   label: "Username",            type: "text",     placeholder: "nama_pengguna" },
    { name: "email",      label: "Email",               type: "email",    placeholder: "nama@email.com" },
    { name: "password",   label: "Password",            type: "password", placeholder: "Min. 8 karakter" },
    { name: "konfirmasi", label: "Konfirmasi Password", type: "password", placeholder: "Ulangi password" },
  ];

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
                  Daftar Akun
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                  Buat akun untuk melaporkan gejala
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
          <form onSubmit={kirim} className="space-y-3">
            {fields.map(({ name, label, type, placeholder }) => (
              <div key={name}>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>
                  {label}
                </label>
                <input
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={ubah}
                  required
                  placeholder={placeholder}
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
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-bold text-white transition-opacity mt-1"
              style={{
                background: "linear-gradient(135deg,#3A8E85,#006B5F)",
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Memproses..." : "Buat Akun"}
            </button>
          </form>

          {/* Switch */}
          <p className="text-center text-xs" style={{ color: "#9CA3AF" }}>
            Sudah punya akun?{" "}
            <button
              onClick={() => { onTutup(); onBukaMasuk(); }}
              className="font-semibold transition-colors"
              style={{ color: "#3A8E85" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#006B5F")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#3A8E85")}
            >
              Masuk di sini
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
