import { skorWarna, skorLabel, SEMUA_GEJALA } from "../shared/adminHelpers";
import { Btn } from "../shared/adminUI";

export default function ModalDetailLaporan({ laporan, onTutup, onHapus }) {
  if (!laporan) return null;
  const warna = skorWarna(laporan.skor_influenza);
  const gejalaDimiliki = SEMUA_GEJALA.filter((g) => laporan.gejala?.includes(g.key));
  const gejalaTidak    = SEMUA_GEJALA.filter((g) => !laporan.gejala?.includes(g.key));

  const keparahanSub =
    laporan.tingkat_keparahan >= 7 ? "Berat"
    : laporan.tingkat_keparahan >= 4 ? "Sedang"
    : "Ringan";

  const vaksinSub =
    laporan.sudah_vaksin === true  ? "✓ Sudah vaksin"
    : laporan.sudah_vaksin === false ? "✗ Belum vaksin"
    : "Vaksin tidak diketahui";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.50)" }}
    >
      <div
        className="w-full max-w-lg sm:max-w-2xl rounded-2xl overflow-hidden bg-white"
        style={{
          maxHeight: "90dvh",
          overflowY: "auto",
          border: "1px solid rgba(58,142,133,0.15)",
          boxShadow: "0 32px 64px rgba(58,142,133,0.15)",
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-start justify-between p-4 sm:p-6 border-b"
          style={{ borderColor: "rgba(58,142,133,0.12)", background: "#f0faf9" }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#3A8E85" }}>
              Detail Laporan
            </p>
            <h2 className="text-lg font-bold" style={{ color: "#1a2e2c" }}>
              📍 {laporan.nama_wilayah || "Wilayah Tidak Diketahui"}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
              {laporan.timestamp
                ? new Date(laporan.timestamp).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })
                : "—"}
            </p>
          </div>
          <button
            onClick={onTutup}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors flex-shrink-0"
            style={{ background: "rgba(58,142,133,0.10)", color: "#64748b", border: "1px solid rgba(58,142,133,0.15)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(58,142,133,0.20)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(58,142,133,0.10)")}
          >
            ✕
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">

          {/* ── Skor Influenza — card besar ── */}
          <div
            className="rounded-xl p-4 sm:p-5 border"
            style={{ background: warna.bg, borderColor: warna.border }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-wider mb-1"
                  style={{ color: warna.text }}
                >
                  Skor Influenza
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold" style={{ color: warna.text }}>
                    {laporan.skor_influenza}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: warna.text, opacity: 0.55 }}>
                    / 100
                  </span>
                </div>
              </div>
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full text-white mt-1"
                style={{ background: warna.badge }}
              >
                {skorLabel(laporan.skor_influenza)}
              </span>
            </div>
            {/* Progress bar */}
            <div
              className="h-2.5 rounded-full overflow-hidden"
              style={{ background: `${warna.badge}25` }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(laporan.skor_influenza, 100)}%`, background: warna.badge }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px]" style={{ color: warna.text, opacity: 0.55 }}>Rendah</span>
              <span className="text-[10px]" style={{ color: warna.text, opacity: 0.55 }}>Kritis</span>
            </div>
          </div>

          {/* ── 3 Stat Cards ── */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              {
                icon: "📊",
                label: "Keparahan",
                value: `${laporan.tingkat_keparahan}/10`,
                sub: keparahanSub,
              },
              {
                icon: "🗓️",
                label: "Durasi Sakit",
                value: laporan.durasi_hari ? `${laporan.durasi_hari} hari` : "—",
                sub: "Sejak gejala muncul",
              },
              {
                icon: "👤",
                label: "Usia",
                value: laporan.kelompok_usia ?? "—",
                sub: vaksinSub,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-3 sm:p-4 border"
                style={{ background: "#f8fffe", borderColor: "rgba(58,142,133,0.15)" }}
              >
                <p className="text-base mb-1">{s.icon}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#64748b" }}>
                  {s.label}
                </p>
                <p className="text-lg font-bold capitalize" style={{ color: "#1a2e2c" }}>
                  {s.value}
                </p>
                <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "#94a3b8" }}>
                  {s.sub}
                </p>
              </div>
            ))}
          </div>

          {/* ── Tingkat Keparahan — visualisasi bar ── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#64748b" }}>
              Tingkat Keparahan
            </p>
            <div className="flex gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-3 rounded transition-colors"
                  style={{
                    background: i < laporan.tingkat_keparahan ? warna.badge : "rgba(58,142,133,0.10)",
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px]" style={{ color: "#94a3b8" }}>Ringan (1)</span>
              <span className="text-[10px]" style={{ color: "#94a3b8" }}>Berat (10)</span>
            </div>
          </div>

          {/* ── Gejala yang dilaporkan ── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#64748b" }}>
              Gejala yang Dilaporkan
              <span className="ml-2 normal-case font-normal" style={{ color: "#94a3b8" }}>
                {gejalaDimiliki.length} dari {SEMUA_GEJALA.length} gejala
              </span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {gejalaDimiliki.map((g) => (
                <div
                  key={g.key}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.20)" }}
                >
                  <span className="text-base">{g.icon}</span>
                  <span className="text-sm font-semibold flex-1" style={{ color: "#15803d" }}>{g.label}</span>
                  <span className="text-xs font-bold" style={{ color: "#16a34a" }}>✓</span>
                </div>
              ))}
              {gejalaTidak.map((g) => (
                <div
                  key={g.key}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{ background: "#f8fffe", border: "1px solid rgba(58,142,133,0.10)" }}
                >
                  <span className="text-base opacity-30">{g.icon}</span>
                  <span className="text-sm" style={{ color: "#94a3b8" }}>{g.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Lokasi & Metadata ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* GPS */}
            <div
              className="rounded-xl p-4 space-y-3 border"
              style={{ background: "#f8fffe", borderColor: "rgba(58,142,133,0.15)" }}
            >
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#64748b" }}>
                📍 Lokasi GPS
              </p>
              <div className="space-y-1.5">
                {[
                  { label: "Latitude",  val: typeof laporan.lat === "number" ? laporan.lat.toFixed(6) : "—" },
                  { label: "Longitude", val: typeof laporan.lng === "number" ? laporan.lng.toFixed(6) : "—" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "#64748b" }}>{row.label}</span>
                    <span className="text-sm font-mono font-semibold" style={{ color: "#1a2e2c" }}>{row.val}</span>
                  </div>
                ))}
              </div>
              <a
                href={`https://www.google.com/maps?q=${laporan.lat},${laporan.lng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
                style={{ color: "#3A8E85" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#006B5F")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#3A8E85")}
              >
                Buka di Google Maps →
              </a>
            </div>

            {/* Metadata */}
            <div
              className="rounded-xl p-4 space-y-3 border"
              style={{ background: "#f8fffe", borderColor: "rgba(58,142,133,0.15)" }}
            >
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#64748b" }}>
                🗂️ Metadata
              </p>
              <div className="space-y-1.5">
                {[
                  {
                    label: "ID Laporan",
                    val: laporan.id ? `${laporan.id.slice(0, 16)}…` : "—",
                    mono: true,
                  },
                  {
                    label: "ID Pengguna",
                    val: laporan.user_id ? `${laporan.user_id.slice(0, 16)}…` : "Anonim",
                    mono: true,
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-2">
                    <span className="text-sm flex-shrink-0" style={{ color: "#64748b" }}>{row.label}</span>
                    <span
                      className={`text-xs truncate ${row.mono ? "font-mono" : ""}`}
                      style={{ color: "#94a3b8" }}
                    >
                      {row.val}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "#64748b" }}>Status Vaksin</span>
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color:
                        laporan.sudah_vaksin === true  ? "#16a34a"
                        : laporan.sudah_vaksin === false ? "#be123c"
                        : "#94a3b8",
                    }}
                  >
                    {laporan.sudah_vaksin === true ? "Sudah" : laporan.sudah_vaksin === false ? "Belum" : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Aksi ── */}
          <div
            className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-2 border-t"
            style={{ borderColor: "rgba(58,142,133,0.12)" }}
          >
            <Btn onClick={onTutup} variant="ghost" className="w-full sm:w-auto justify-center">
              Tutup
            </Btn>
            <Btn onClick={() => onHapus(laporan.id)} variant="danger" className="w-full sm:w-auto justify-center">
              Hapus Laporan Ini
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
