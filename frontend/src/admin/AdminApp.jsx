import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import {
  adminPengguna,
  adminUbahPengguna,
  adminHapusPengguna,
  adminLaporan,
  adminHapusLaporan,
  masukAPI,
} from "../services/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
function skorWarna(skor) {
  if (skor >= 70) return { bg: "#450a0a", text: "#fca5a5" };
  if (skor >= 40) return { bg: "#431407", text: "#fdba74" };
  return { bg: "#052e16", text: "#86efac" };
}

function skorLabel(skor) {
  if (skor >= 70) return "Kritis";
  if (skor >= 40) return "Sedang";
  return "Rendah";
}

const PER_HAL = 10;

// ── Komponen kecil ────────────────────────────────────────────────────────────
function Badge({ children, bg, text }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: bg, color: text }}
    >
      {children}
    </span>
  );
}

function Btn({
  onClick,
  disabled,
  children,
  variant = "default",
  className = "",
}) {
  const styles = {
    default: { background: "#1e3a5f", color: "#bfdbfe" },
    danger: { background: "#450a0a", color: "#fca5a5" },
    success: { background: "#052e16", color: "#86efac" },
    warning: { background: "#431407", color: "#fdba74" },
    ghost: {
      background: "#1e293b",
      color: "#94a3b8",
      border: "1px solid #334155",
    },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-40 ${className}`}
      style={styles[variant]}
    >
      {children}
    </button>
  );
}

function Paginasi({ halaman, total, onSebelum, onBerikut }) {
  const totalHal = Math.ceil(total / PER_HAL);
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-sm" style={{ color: "#94a3b8" }}>
        Menampilkan{" "}
        <span style={{ color: "#e2e8f0", fontWeight: 600 }}>
          {Math.min((halaman - 1) * PER_HAL + 1, total)}–
          {Math.min(halaman * PER_HAL, total)}
        </span>{" "}
        dari <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{total}</span>{" "}
        data
      </p>
      <div className="flex items-center gap-2">
        <Btn onClick={onSebelum} disabled={halaman === 1} variant="ghost">
          ← Sebelumnya
        </Btn>
        <span
          className="px-3 py-1.5 rounded-lg text-xs font-bold"
          style={{
            background: "#0f172a",
            color: "#93c5fd",
            border: "1px solid #1e3a5f",
          }}
        >
          {halaman} / {totalHal}
        </span>
        <Btn onClick={onBerikut} disabled={halaman >= totalHal} variant="ghost">
          Berikutnya →
        </Btn>
      </div>
    </div>
  );
}

function EmptyState({ icon, teks }) {
  return (
    <tr>
      <td colSpan={99} className="py-16 text-center">
        <div className="text-4xl mb-3">{icon}</div>
        <p className="text-sm font-medium" style={{ color: "#64748b" }}>
          {teks}
        </p>
      </td>
    </tr>
  );
}

function SkeletonRow({ cols }) {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} style={{ borderTop: "1px solid #1e293b" }}>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-4 py-3.5">
          <div
            className="h-4 rounded animate-pulse"
            style={{ background: "#1e293b", width: j === 0 ? "70%" : "50%" }}
          />
        </td>
      ))}
    </tr>
  ));
}

// ── Modal Konfirmasi (pengganti confirm() native) ─────────────────────────────
function ModalKonfirmasi({ judul, pesan, labelOk = "Hapus", onOk, onBatal }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "#0d1627",
          border: "1px solid #450a0a",
          boxShadow: "0 24px 48px rgba(0,0,0,0.7)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: "#450a0a" }}
          >
            🗑️
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "#f1f5f9" }}>
              {judul}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
              Tindakan ini tidak dapat dibatalkan
            </p>
          </div>
        </div>

        {/* Pesan */}
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
            {pesan}
          </p>
        </div>

        {/* Tombol aksi */}
        <div
          className="flex gap-2 px-5 py-4"
          style={{ borderTop: "1px solid #1e293b" }}
        >
          <button
            onClick={onBatal}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-80"
            style={{ background: "#1e293b", color: "#94a3b8" }}
          >
            Batal
          </button>
          <button
            onClick={onOk}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition hover:opacity-80"
            style={{ background: "#dc2626", color: "#fff" }}
          >
            {labelOk}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Login Wall ────────────────────────────────────────────────────────────────
function LoginWall({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const kirim = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await masukAPI({ email, password });
      if (data.pengguna?.role !== "admin") {
        toast.error("Akun Anda tidak memiliki hak akses admin.");
        return;
      }
      localStorage.setItem("fluwatch_token", data.token);
      onLogin(data.pengguna);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg,#060b18 0%,#0d1627 100%)" }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#3b82f6,transparent)" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "#0d1627",
            border: "1px solid #1e3a5f",
            boxShadow: "0 25px 50px rgba(0,0,0,0.6)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
              style={{
                background: "linear-gradient(135deg,#f97316,#ef4444)",
                boxShadow: "0 8px 24px rgba(239,68,68,0.4)",
              }}
            >
              🦠
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
              FluWatch Admin
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              Masuk dengan akun administrator
            </p>
          </div>

          <form onSubmit={kirim} className="space-y-4">
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "#cbd5e1" }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@fluwatch.id"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition"
                style={{
                  background: "#111827",
                  border: "1px solid #1e3a5f",
                  color: "#f1f5f9",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "#1e3a5f")}
              />
            </div>
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "#cbd5e1" }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition"
                style={{
                  background: "#111827",
                  border: "1px solid #1e3a5f",
                  color: "#f1f5f9",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "#1e3a5f")}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold transition mt-2"
              style={{
                background: loading
                  ? "#1e3a5f"
                  : "linear-gradient(135deg,#2563eb,#1d4ed8)",
                color: "#fff",
                boxShadow: loading ? "none" : "0 4px 16px rgba(37,99,235,0.4)",
              }}
            >
              {loading ? "Memverifikasi..." : "Masuk ke Panel Admin"}
            </button>
          </form>

          <div
            className="mt-6 pt-5 text-center"
            style={{ borderTop: "1px solid #1e293b" }}
          >
            <a
              href="/"
              className="text-sm transition"
              style={{ color: "#475569" }}
              onMouseOver={(e) => (e.target.style.color = "#94a3b8")}
              onMouseOut={(e) => (e.target.style.color = "#475569")}
            >
              ← Kembali ke Aplikasi
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab Pengguna ──────────────────────────────────────────────────────────────
function TabPengguna({ adminId }) {
  const [data,      setData]      = useState(null);
  const [halaman,   setHalaman]   = useState(1);
  const [cari,      setCari]      = useState("");
  const [cariAktif, setCariAktif] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [konfirmasi, setKonfirmasi] = useState(null); // { judul, pesan, onOk }

  // Jalankan pencarian: update cariAktif & reset halaman
  const jalankanCari = useCallback(() => {
    setCariAktif(cari.trim());
    setHalaman(1);
  }, [cari]);

  // Reset pencarian saat input dikosongkan
  const handleChange = (e) => {
    const val = e.target.value;
    setCari(val);
    if (val === "") {
      setCariAktif("");
      setHalaman(1);
    }
  };

  const muat = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminPengguna({
        halaman,
        per_halaman: PER_HAL,
        cari: cariAktif,
      });
      setData(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [halaman, cariAktif]);

  useEffect(() => {
    muat();
  }, [muat]);

  const ubahRole = async (id, role) => {
    try {
      await adminUbahPengguna(id, { role });
      toast.success("Role berhasil diperbarui");
      muat();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleAktif = async (id, is_active) => {
    try {
      await adminUbahPengguna(id, { is_active: !is_active });
      toast.success(is_active ? "Akun dinonaktifkan" : "Akun diaktifkan");
      muat();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const hapus = (id, username) => {
    setKonfirmasi({
      judul: "Hapus Pengguna",
      pesan: `Akun "${username}" akan dihapus permanen beserta seluruh datanya.`,
      onOk: async () => {
        setKonfirmasi(null);
        try {
          await adminHapusPengguna(id);
          toast.success("Pengguna berhasil dihapus");
          muat();
        } catch (err) {
          toast.error(err.message);
        }
      },
    });
  };

  return (
    <>
      {konfirmasi && (
        <ModalKonfirmasi
          judul={konfirmasi.judul}
          pesan={konfirmasi.pesan}
          onOk={konfirmasi.onOk}
          onBatal={() => setKonfirmasi(null)}
        />
      )}
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-3 items-center flex-wrap">
        {/* Input + tombol Cari */}
        <div className="flex flex-1 max-w-sm gap-2">
          <div className="relative flex-1">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: "#475569" }}
            >
              🔍
            </span>
            <input
              value={cari}
              onChange={handleChange}
              onKeyDown={(e) => e.key === "Enter" && jalankanCari()}
              placeholder="Cari username atau email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition"
              style={{
                background: "#111827",
                border: `1px solid ${cariAktif ? "#3b82f6" : "#1e293b"}`,
                color: "#e2e8f0",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) =>
                (e.target.style.borderColor = cariAktif ? "#3b82f6" : "#1e293b")
              }
            />
          </div>
          <Btn onClick={jalankanCari} variant="default">
            Cari
          </Btn>
        </div>
        <Btn onClick={muat} variant="ghost">
          Muat Ulang
        </Btn>
        {data && (
          <span className="text-sm font-semibold" style={{ color: "#64748b" }}>
            {cariAktif
              ? `${data.total} hasil untuk "${cariAktif}"`
              : `${data.total} pengguna`}
          </span>
        )}
      </div>

      {/* Tabel */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          border: "1px solid #1e293b",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        }}
      >
        <table className="w-full">
          <thead>
            <tr
              style={{ background: "linear-gradient(90deg,#0f172a,#0d1627)" }}
            >
              {["Pengguna", "Email", "Role", "Status", "Bergabung", "Aksi"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ color: "#64748b" }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRow cols={6} />
            ) : !data?.pengguna?.length ? (
              <EmptyState icon="👤" teks="Tidak ada pengguna ditemukan" />
            ) : (
              data.pengguna.map((p, i) => (
                <tr
                  key={p.id}
                  style={{
                    borderTop: "1px solid #1e293b",
                    background: i % 2 === 0 ? "#080d1a" : "#0a1020",
                    transition: "background 0.15s",
                  }}
                >
                  {/* Avatar + username */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{
                          background:
                            p.role === "admin" ? "#1e3a5f" : "#1e293b",
                          color: p.role === "admin" ? "#93c5fd" : "#94a3b8",
                        }}
                      >
                        {p.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "#e2e8f0" }}
                        >
                          {p.username}
                        </p>
                        {p.id === adminId && (
                          <p className="text-xs" style={{ color: "#f97316" }}>
                            Anda
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td
                    className="px-5 py-4 text-sm"
                    style={{ color: "#94a3b8" }}
                  >
                    {p.email}
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      bg={p.role === "admin" ? "#1e3a5f" : "#1e293b"}
                      text={p.role === "admin" ? "#93c5fd" : "#94a3b8"}
                    >
                      {p.role === "admin" ? "⭐ Admin" : "Pengguna"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      bg={p.is_active ? "#052e16" : "#450a0a"}
                      text={p.is_active ? "#86efac" : "#fca5a5"}
                    >
                      {p.is_active ? "● Aktif" : "○ Nonaktif"}
                    </Badge>
                  </td>
                  <td
                    className="px-5 py-4 text-sm"
                    style={{ color: "#64748b" }}
                  >
                    {p.created_at
                      ? new Date(p.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-5 py-4">
                    {p.id !== adminId ? (
                      <div className="flex gap-2 flex-wrap">
                        <Btn
                          onClick={() =>
                            ubahRole(
                              p.id,
                              p.role === "admin" ? "pengguna" : "admin",
                            )
                          }
                          variant={p.role === "admin" ? "warning" : "default"}
                        >
                          {p.role === "admin" ? "Turunkan" : "Jadikan Admin"}
                        </Btn>
                        <Btn
                          onClick={() => toggleAktif(p.id, p.is_active)}
                          variant={p.is_active ? "warning" : "success"}
                        >
                          {p.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </Btn>
                        <Btn
                          onClick={() => hapus(p.id, p.username)}
                          variant="danger"
                        >
                          Hapus
                        </Btn>
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: "#334155" }}>
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.total > 0 && (
        <Paginasi
          halaman={halaman}
          total={data.total}
          onSebelum={() => setHalaman((h) => h - 1)}
          onBerikut={() => setHalaman((h) => h + 1)}
        />
      )}
    </div>
    </>
  );
}

// ── Modal Detail Laporan ──────────────────────────────────────────────────────
const SEMUA_GEJALA = [
  { key: "demam", label: "Demam", icon: "🌡️" },
  { key: "menggigil", label: "Menggigil", icon: "🥶" },
  { key: "nyeri_otot", label: "Nyeri Otot", icon: "💪" },
  { key: "kelelahan", label: "Kelelahan", icon: "😴" },
  { key: "batuk", label: "Batuk", icon: "🤧" },
  { key: "sakit_kepala", label: "Sakit Kepala", icon: "🤕" },
  { key: "sakit_tenggorokan", label: "Sakit Tenggorokan", icon: "😮" },
  { key: "pilek", label: "Pilek", icon: "🤧" },
  { key: "mual_muntah", label: "Mual / Muntah", icon: "🤢" },
  { key: "sesak_napas", label: "Sesak Napas", icon: "😮‍💨" },
];

function ModalDetailLaporan({ laporan, onTutup, onHapus }) {
  if (!laporan) return null;
  const warna = skorWarna(laporan.skor_influenza);
  const gejalaDimiliki = SEMUA_GEJALA.filter((g) =>
    laporan.gejala?.includes(g.key),
  );
  const gejalaTidak = SEMUA_GEJALA.filter(
    (g) => !laporan.gejala?.includes(g.key),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{
          background: "#0d1627",
          border: "1px solid #1e3a5f",
          boxShadow: "0 32px 64px rgba(0,0,0,0.7)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header modal */}
        <div
          className="flex items-start justify-between p-6"
          style={{
            borderBottom: "1px solid #1e293b",
            background: "linear-gradient(135deg,#0f172a,#0d1627)",
          }}
        >
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: "#475569" }}
            >
              Detail Laporan
            </p>
            <h2 className="text-lg font-bold" style={{ color: "#f1f5f9" }}>
              {laporan.nama_wilayah || "Wilayah Tidak Diketahui"}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
              {laporan.timestamp
                ? new Date(laporan.timestamp).toLocaleString("id-ID", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })
                : "—"}
            </p>
          </div>
          <button
            onClick={onTutup}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition"
            style={{ background: "#1e293b", color: "#94a3b8" }}
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Skor & statistik ringkas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Skor Influenza",
                value: laporan.skor_influenza,
                sub: skorLabel(laporan.skor_influenza),
                bg: warna.bg,
                text: warna.text,
              },
              {
                label: "Keparahan",
                value: `${laporan.tingkat_keparahan}/10`,
                sub:
                  laporan.tingkat_keparahan >= 7
                    ? "Berat"
                    : laporan.tingkat_keparahan >= 4
                      ? "Sedang"
                      : "Ringan",
                bg: "#0f172a",
                text: "#e2e8f0",
              },
              {
                label: "Durasi Sakit",
                value: laporan.durasi_hari
                  ? `${laporan.durasi_hari} hari`
                  : "—",
                sub: "Sejak gejala muncul",
                bg: "#0f172a",
                text: "#e2e8f0",
              },
              {
                label: "Kelompok Usia",
                value: laporan.kelompok_usia ?? "—",
                sub:
                  laporan.sudah_vaksin === true
                    ? "Sudah vaksin"
                    : laporan.sudah_vaksin === false
                      ? "Belum vaksin"
                      : "Tidak diketahui",
                bg: "#0f172a",
                text: "#e2e8f0",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-4"
                style={{ background: s.bg, border: "1px solid #1e293b" }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "#64748b" }}
                >
                  {s.label}
                </p>
                <p
                  className="text-xl font-bold capitalize"
                  style={{ color: s.text }}
                >
                  {s.value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
                  {s.sub}
                </p>
              </div>
            ))}
          </div>

          {/* Visual keparahan bar */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: "#64748b" }}
            >
              Tingkat Keparahan
            </p>
            <div className="flex gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-3 rounded"
                  style={{
                    background:
                      i < laporan.tingkat_keparahan ? warna.text : "#1e293b",
                    transition: "background 0.2s",
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs" style={{ color: "#334155" }}>
                Ringan
              </span>
              <span className="text-xs" style={{ color: "#334155" }}>
                Berat
              </span>
            </div>
          </div>

          {/* Gejala */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: "#64748b" }}
            >
              Gejala yang Dilaporkan ({gejalaDimiliki.length} dari{" "}
              {SEMUA_GEJALA.length})
            </p>
            <div className="grid grid-cols-2 gap-2">
              {gejalaDimiliki.map((g) => (
                <div
                  key={g.key}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{ background: "#052e16", border: "1px solid #166534" }}
                >
                  <span className="text-base">{g.icon}</span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "#86efac" }}
                  >
                    {g.label}
                  </span>
                  <span
                    className="ml-auto text-xs font-bold"
                    style={{ color: "#22c55e" }}
                  >
                    ✓
                  </span>
                </div>
              ))}
              {gejalaTidak.map((g) => (
                <div
                  key={g.key}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{ background: "#0f172a", border: "1px solid #1e293b" }}
                >
                  <span className="text-base opacity-30">{g.icon}</span>
                  <span className="text-sm" style={{ color: "#334155" }}>
                    {g.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Lokasi & metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Koordinat */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: "#0f172a", border: "1px solid #1e293b" }}
            >
              <p
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "#64748b" }}
              >
                Lokasi GPS
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: "#475569" }}>
                    Latitude
                  </span>
                  <span
                    className="text-sm font-mono font-semibold"
                    style={{ color: "#e2e8f0" }}
                  >
                    {typeof laporan.lat === "number"
                      ? laporan.lat.toFixed(6)
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: "#475569" }}>
                    Longitude
                  </span>
                  <span
                    className="text-sm font-mono font-semibold"
                    style={{ color: "#e2e8f0" }}
                  >
                    {typeof laporan.lng === "number"
                      ? laporan.lng.toFixed(6)
                      : "—"}
                  </span>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps?q=${laporan.lat},${laporan.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold mt-1 transition"
                style={{ color: "#3b82f6" }}
              >
                Buka di Google Maps →
              </a>
            </div>

            {/* Metadata */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: "#0f172a", border: "1px solid #1e293b" }}
            >
              <p
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "#64748b" }}
              >
                Metadata
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: "#475569" }}>
                    ID Laporan
                  </span>
                  <span
                    className="text-xs font-mono"
                    style={{ color: "#64748b" }}
                  >
                    {laporan.id ? laporan.id.slice(0, 16) + "…" : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: "#475569" }}>
                    ID Pengguna
                  </span>
                  <span
                    className="text-xs font-mono"
                    style={{ color: "#64748b" }}
                  >
                    {laporan.user_id
                      ? laporan.user_id.slice(0, 16) + "…"
                      : "Anonim"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: "#475569" }}>
                    Status Vaksin
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color:
                        laporan.sudah_vaksin === true
                          ? "#86efac"
                          : laporan.sudah_vaksin === false
                            ? "#fca5a5"
                            : "#475569",
                    }}
                  >
                    {laporan.sudah_vaksin === true
                      ? "Sudah"
                      : laporan.sudah_vaksin === false
                        ? "Belum"
                        : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Aksi */}
          <div
            className="flex justify-end gap-3 pt-2"
            style={{ borderTop: "1px solid #1e293b" }}
          >
            <Btn onClick={onTutup} variant="ghost">
              Tutup
            </Btn>
            <Btn onClick={() => onHapus(laporan.id)} variant="danger">
              Hapus Laporan Ini
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab Laporan ───────────────────────────────────────────────────────────────
function TabLaporan() {
  const [data, setData] = useState(null);
  const [halaman, setHalaman] = useState(1);
  const [jam, setJam] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailLaporan, setDetailLaporan] = useState(null);
  const [konfirmasi, setKonfirmasi] = useState(null);

  const muat = useCallback(async () => {
    setLoading(true);
    try {
      const params = { halaman, per_halaman: PER_HAL };
      if (jam) params.jam = jam;
      const res = await adminLaporan(params);
      setData(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [halaman, jam]);

  useEffect(() => {
    muat();
  }, [muat]);

  const hapus = (id) => {
    setKonfirmasi({
      judul: "Hapus Laporan",
      pesan: "Data laporan gejala ini akan dihapus permanen dari sistem.",
      onOk: async () => {
        setKonfirmasi(null);
        try {
          await adminHapusLaporan(id);
          toast.success("Laporan berhasil dihapus");
          setDetailLaporan(null);
          muat();
        } catch (err) {
          toast.error(err.message);
        }
      },
    });
  };

  return (
    <>
      {konfirmasi && (
        <ModalKonfirmasi
          judul={konfirmasi.judul}
          pesan={konfirmasi.pesan}
          onOk={konfirmasi.onOk}
          onBatal={() => setKonfirmasi(null)}
        />
      )}
      {detailLaporan && (
        <ModalDetailLaporan
          laporan={detailLaporan}
          onTutup={() => setDetailLaporan(null)}
          onHapus={hapus}
        />
      )}
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex gap-3 items-center flex-wrap">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "#111827", border: "1px solid #1e293b" }}
          >
            <span className="text-sm" style={{ color: "#64748b" }}>
              🕐
            </span>
            <select
              value={jam}
              onChange={(e) => {
                setJam(e.target.value);
                setHalaman(1);
              }}
              className="text-sm outline-none bg-transparent"
              style={{ color: "#e2e8f0" }}
            >
              <option value="" style={{ background: "#111827" }}>
                Semua Waktu
              </option>
              <option value="24" style={{ background: "#111827" }}>
                24 Jam Terakhir
              </option>
              <option value="48" style={{ background: "#111827" }}>
                48 Jam Terakhir
              </option>
              <option value="168" style={{ background: "#111827" }}>
                7 Hari Terakhir
              </option>
            </select>
          </div>
          <Btn onClick={muat} variant="ghost">
            Muat Ulang
          </Btn>
          {data && (
            <span
              className="text-sm font-semibold"
              style={{ color: "#64748b" }}
            >
              {data.total} laporan
            </span>
          )}
        </div>

        {/* Tabel */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            border: "1px solid #1e293b",
            boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          }}
        >
          <table className="w-full">
            <thead>
              <tr
                style={{ background: "linear-gradient(90deg,#0f172a,#0d1627)" }}
              >
                {[
                  "Wilayah",
                  "Gejala Utama",
                  "Skor",
                  "Keparahan",
                  "Kelompok Usia",
                  "Waktu",
                  "Aksi",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ color: "#64748b" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRow cols={7} />
              ) : !data?.laporan?.length ? (
                <EmptyState icon="📋" teks="Tidak ada laporan ditemukan" />
              ) : (
                data.laporan.map((r, i) => {
                  const warna = skorWarna(r.skor_influenza);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setDetailLaporan(r)}
                      style={{
                        borderTop: "1px solid #1e293b",
                        background: i % 2 === 0 ? "#080d1a" : "#0a1020",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#0f172a")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          i % 2 === 0 ? "#080d1a" : "#0a1020")
                      }
                    >
                      <td className="px-5 py-4">
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "#e2e8f0" }}
                        >
                          {r.nama_wilayah || "—"}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "#475569" }}
                        >
                          {r.user_id
                            ? `ID: ${r.user_id.slice(0, 8)}…`
                            : "Anonim"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {r.gejala?.slice(0, 2).map((g) => (
                            <span
                              key={g}
                              className="px-2 py-0.5 rounded text-xs font-medium"
                              style={{
                                background: "#1e293b",
                                color: "#cbd5e1",
                              }}
                            >
                              {g.replace(/_/g, " ")}
                            </span>
                          ))}
                          {r.gejala?.length > 2 && (
                            <span
                              className="px-2 py-0.5 rounded text-xs"
                              style={{ color: "#475569" }}
                            >
                              +{r.gejala.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className="text-base font-bold"
                            style={{ color: warna.text }}
                          >
                            {r.skor_influenza}
                          </span>
                          <Badge bg={warna.bg} text={warna.text}>
                            {skorLabel(r.skor_influenza)}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 10 }).map((_, idx) => (
                              <div
                                key={idx}
                                className="w-1.5 h-3 rounded-sm"
                                style={{
                                  background:
                                    idx < r.tingkat_keparahan
                                      ? warna.text
                                      : "#1e293b",
                                }}
                              />
                            ))}
                          </div>
                          <span
                            className="text-xs font-bold ml-1"
                            style={{ color: "#94a3b8" }}
                          >
                            {r.tingkat_keparahan}/10
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: "#94a3b8" }}>
                          {r.kelompok_usia || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm" style={{ color: "#94a3b8" }}>
                          {r.timestamp
                            ? new Date(r.timestamp).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "#475569" }}
                        >
                          {r.timestamp
                            ? new Date(r.timestamp).toLocaleTimeString(
                                "id-ID",
                                { hour: "2-digit", minute: "2-digit" },
                              )
                            : ""}
                        </p>
                      </td>
                      <td
                        className="px-5 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Btn onClick={() => hapus(r.id)} variant="danger">
                          Hapus
                        </Btn>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {data && data.total > 0 && (
          <Paginasi
            halaman={halaman}
            total={data.total}
            onSebelum={() => setHalaman((h) => h - 1)}
            onBerikut={() => setHalaman((h) => h + 1)}
          />
        )}
      </div>
    </>
  );
}

// ── AdminApp ──────────────────────────────────────────────────────────────────
export default function AdminApp() {
  const { pengguna, isAdmin, loading, logout } = useAuth();
  const [localAdmin, setLocalAdmin] = useState(null);
  const [tab, setTab] = useState("pengguna");

  const adminAktif = isAdmin ? pengguna : localAdmin;

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "#060b18", color: "#f1f5f9" }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 border-t-blue-500 animate-spin"
          style={{ borderColor: "#1e293b", borderTopColor: "#3b82f6" }}
        />
        <p className="text-sm" style={{ color: "#475569" }}>
          Memuat panel admin…
        </p>
      </div>
    );
  }

  if (!adminAktif) {
    return <LoginWall onLogin={setLocalAdmin} />;
  }

  const TABS = [
    { id: "pengguna", icon: "👥", label: "Manajemen Pengguna" },
    { id: "laporan", icon: "📋", label: "Data Laporan" },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: "#060b18", color: "#f1f5f9" }}
    >
      {/* ── Navbar ── */}
      <header
        style={{
          background: "#0a1020",
          borderBottom: "1px solid #1e293b",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: "linear-gradient(135deg,#f97316,#ef4444)" }}
            >
              🦠
            </div>
            <div>
              <p
                className="font-bold text-base leading-tight"
                style={{ color: "#f1f5f9" }}
              >
                FluWatch<span style={{ color: "#f97316" }}>.AI</span>
              </p>
              <p className="text-xs leading-tight" style={{ color: "#475569" }}>
                Panel Administrator
              </p>
            </div>
          </div>

          {/* User info + actions */}
          <div className="flex items-center gap-3">
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "#111827", border: "1px solid #1e293b" }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "#1e3a5f", color: "#93c5fd" }}
              >
                {adminAktif.username[0].toUpperCase()}
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: "#cbd5e1" }}
              >
                {adminAktif.username}
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: "#1e3a5f", color: "#93c5fd" }}
              >
                Admin
              </span>
            </div>
            <a
              href="/"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition"
              style={{
                background: "#111827",
                border: "1px solid #1e293b",
                color: "#94a3b8",
              }}
            >
              ← Aplikasi
            </a>
            <button
              onClick={() => {
                logout();
                setLocalAdmin(null);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition"
              style={{
                background: "#450a0a",
                color: "#fca5a5",
                border: "1px solid #7f1d1d",
              }}
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* ── Tab Bar ── */}
      <div style={{ background: "#0a1020", borderBottom: "1px solid #1e293b" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition"
                style={
                  tab === t.id
                    ? { borderColor: "#3b82f6", color: "#93c5fd" }
                    : { borderColor: "transparent", color: "#475569" }
                }
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Konten ── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>
            {TABS.find((t) => t.id === tab)?.icon}{" "}
            {TABS.find((t) => t.id === tab)?.label}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            {tab === "pengguna"
              ? "Kelola akun pengguna, ubah role, dan aktifkan atau nonaktifkan akun."
              : "Pantau dan kelola semua laporan gejala yang masuk ke sistem."}
          </p>
        </div>

        {tab === "pengguna" && <TabPengguna adminId={adminAktif.id} />}
        {tab === "laporan" && <TabLaporan />}
      </div>
    </div>
  );
}
