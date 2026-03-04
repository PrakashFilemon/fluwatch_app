/**
 * AnalisisAI — Dark Premium AI Agent panel.
 */
import { useState, useEffect, useRef } from "react";
import { tanyaAI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const PERTANYAAN_SURVEILANS = [
  "Apakah ada wabah influenza di dekat saya?",
  "Berapa kasus influenza dalam radius 10km dari saya?",
];

const PERTANYAAN_KESEHATAN = [
  "Bagaimana cara mengobati influenza di rumah?",
  "Obat apa yang bisa dikonsumsi untuk influenza?",
];

const RADIUS_PILIHAN = [5, 10, 20, 50];

const JAM_PILIHAN = [
  { label: "24 JAM", value: 24 },
  { label: "7 HARI", value: 168 },
  { label: "30 HARI", value: 720 },
];

const THINKING_STEPS = [
  { icon: "🔍", teks: "Memeriksa data area terdekat..." },
  { icon: "📊", teks: "Menganalisis laporan surveilans..." },
  { icon: "💭", teks: "Menyusun analisis untuk Anda..." },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat Pagi";
  if (h < 15) return "Selamat Siang";
  if (h < 18) return "Selamat Sore";
  return "Selamat Malam";
}

function getRiskLevel(jumlah) {
  if (jumlah === 0)
    return {
      label: "Tidak Ada Aktivitas",
      color: "#22c55e",
      bg: "rgba(34,197,94,0.14)",
    };
  if (jumlah <= 2)
    return {
      label: "Aktivitas Sporadis",
      color: "#84cc16",
      bg: "rgba(132,204,22,0.14)",
    };
  if (jumlah <= 10)
    return {
      label: "Kluster Lokal",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.14)",
    };
  if (jumlah <= 25)
    return {
      label: "Penyebaran Aktif",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.14)",
    };
  return {
    label: "Potensi Wabah",
    color: "#dc2626",
    bg: "rgba(220,38,38,0.14)",
  };
}

/* ── Sub-components ─────────────────────────────────────────── */

function AvatarAI() {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
      style={{
        background: "linear-gradient(135deg,#3A8E85,#006B5F)",
        boxShadow: "0 0 10px rgba(58,142,133,0.45)",
      }}
    >
      🦠
    </div>
  );
}

function RiskCard({ jumlah, radius_km, jam }) {
  const risk = getRiskLevel(jumlah);
  const jamLabel =
    jam >= 720 ? "30 hari" : jam >= 168 ? "7 hari" : `${jam} jam`;
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 mt-2"
      style={{ background: risk.bg, border: `1px solid ${risk.color}55` }}
    >
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse"
        style={{ background: risk.color, boxShadow: `0 0 8px ${risk.color}` }}
      />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-bold" style={{ color: risk.color }}>
          {risk.label}
        </span>
        <span
          className="text-xs ml-2"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          {jumlah} kasus · {radius_km} km · {jamLabel}
        </span>
      </div>
    </div>
  );
}

function ThinkingAnimation({ step }) {
  const current = THINKING_STEPS[step];
  return (
    <div className="flex gap-3">
      <AvatarAI />
      <div
        className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-3"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{ background: "#5BBDB4", animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <span className="text-xs" style={{ color: "#5BBDB4" }}>
          {current.icon} {current.teks}
        </span>
      </div>
    </div>
  );
}

function PesanAI({ teks, jumlah, radius_km, jam }) {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const words = teks.split(" ");
    let i = 0;
    setDisplayText("");
    setIsTyping(true);
    const iv = setInterval(() => {
      if (i < words.length) {
        setDisplayText((prev) => prev + (i > 0 ? " " : "") + words[i++]);
      } else {
        clearInterval(iv);
        setIsTyping(false);
      }
    }, 30);
    return () => clearInterval(iv);
  }, [teks]);

  const handleCopy = () => {
    navigator.clipboard.writeText(teks);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-3 anim-fade-up">
      <AvatarAI />
      <div className="flex-1 min-w-0 space-y-1">
        <div
          className="rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed relative group"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "#d1f5f2",
          }}
        >
          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded-lg"
            style={{
              background: copied
                ? "rgba(34,197,94,0.15)"
                : "rgba(255,255,255,0.10)",
              color: copied ? "#22c55e" : "rgba(255,255,255,0.60)",
              border: `1px solid ${copied ? "rgba(34,197,94,0.30)" : "rgba(255,255,255,0.15)"}`,
            }}
          >
            {copied ? "✓ Disalin" : "⧉ Salin"}
          </button>

          <div className="pr-16">
            {displayText.split("\n").map((baris, i) => (
              <p key={i} className={baris === "" ? "mt-2" : ""}>
                {baris}
              </p>
            ))}
            {isTyping && (
              <span
                className="inline-block w-0.5 h-3.5 ml-0.5 align-middle animate-pulse"
                style={{ background: "#5BBDB4" }}
              />
            )}
          </div>
        </div>

        {jumlah !== undefined && !isTyping && (
          <RiskCard jumlah={jumlah} radius_km={radius_km} jam={jam} />
        )}
      </div>
    </div>
  );
}

function WelcomeScreen({ onKirim, username }) {
  return (
    <div className="flex flex-col items-center justify-start py-6 px-4 h-full overflow-y-auto">
      {/* Avatar + greeting */}
      <div className="text-center mb-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3"
          style={{
            background: "linear-gradient(135deg,#3A8E85,#006B5F)",
            boxShadow: "0 0 24px rgba(58,142,133,0.50)",
          }}
        >
          🦠
        </div>
        <p className="text-base font-bold" style={{ color: "#e8f4f3" }}>
          {getGreeting()}, <span style={{ color: "#5BBDB4" }}>{username}</span>
        </p>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.40)" }}>
          Tanya apa saja tentang kondisi flu di sekitar Anda
        </p>
      </div>

      {/* Quick questions */}
      <div className="w-full space-y-4 max-w-sm">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: "#22c55e" }}
            />
            Surveilans Lokal
          </p>
          <div className="space-y-2">
            {PERTANYAAN_SURVEILANS.map((q) => (
              <button
                key={q}
                onClick={() => onKirim(q)}
                className="w-full text-left text-xs px-4 py-3 rounded-xl transition flex items-center justify-between gap-3"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.75)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(58,142,133,0.15)";
                  e.currentTarget.style.borderColor = "rgba(58,142,133,0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                }}
              >
                <span>{q}</span>
                <span style={{ color: "#5BBDB4", flexShrink: 0 }}>›</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: "#f59e0b" }}
            />
            Pengobatan &amp; Pencegahan
          </p>
          <div className="space-y-2">
            {PERTANYAAN_KESEHATAN.map((q) => (
              <button
                key={q}
                onClick={() => onKirim(q)}
                className="w-full text-left text-xs px-4 py-3 rounded-xl transition flex items-center justify-between gap-3"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.75)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(58,142,133,0.15)";
                  e.currentTarget.style.borderColor = "rgba(58,142,133,0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                }}
              >
                <span>{q}</span>
                <span style={{ color: "#5BBDB4", flexShrink: 0 }}>›</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export default function AnalisisAI({ lokasi }) {
  const { pengguna } = useAuth();
  const username = pengguna?.username || "Pengguna";

  const [pertanyaan, setPertanyaan] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState(10);
  const [jam, setJam] = useState(24);
  const [riwayat, setRiwayat] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [riwayat, loading]);

  useEffect(() => {
    if (!loading) return;
    setThinkingStep(0);
    const iv = setInterval(() => setThinkingStep((s) => (s + 1) % 3), 1500);
    return () => clearInterval(iv);
  }, [loading]);

  const kirim = async (teks) => {
    const q = (teks || pertanyaan).trim();
    if (!q || loading) return;
    if (!lokasi) {
      setError("Lokasi belum tersedia. Izinkan akses lokasi di browser Anda.");
      return;
    }
    setError(null);
    setLoading(true);
    setPertanyaan("");
    setRiwayat((r) => [...r, { tipe: "pengguna", teks: q }]);
    try {
      const data = await tanyaAI({
        lat: lokasi.lat,
        lng: lokasi.lng,
        pertanyaan: q,
        radius_km: radius,
        jam,
      });
      setRiwayat((r) => [
        ...r,
        {
          tipe: "ai",
          teks: data.jawaban,
          jumlah: data.jumlah_kasus,
          radius_km: data.radius_km,
          jam: data.jam,
        },
      ]);
    } catch (err) {
      setRiwayat((r) => [
        ...r,
        { tipe: "ai", teks: `❌ Kesalahan: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, #0c1e1c 0%, #0f2520 60%, #081a18 100%)",
        border: "1px solid rgba(58,142,133,0.20)",
        boxShadow: "0 4px 32px rgba(0,0,0,0.40)",
      }}
    >
      {/* ── HEADER ── */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{
          background: "rgba(0,0,0,0.30)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Baris 1: judul + clear */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e" }}
            />
            <span className="text-sm font-bold" style={{ color: "#e8f4f3" }}>
              FluWatch AI Agent
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full hidden sm:inline"
              style={{
                background: "rgba(58,142,133,0.20)",
                color: "#5BBDB4",
                border: "1px solid rgba(58,142,133,0.30)",
              }}
            >
              ● LIVE
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Radius dropdown */}
            <select
              value={radius}
              onChange={(e) => setRadius(+e.target.value)}
              className="rounded-lg px-2 py-1 text-xs focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.70)",
              }}
            >
              {RADIUS_PILIHAN.map((r) => (
                <option key={r} value={r} style={{ background: "#0c1e1c" }}>
                  {r} km
                </option>
              ))}
            </select>

            {/* Clear */}
            {riwayat.length > 0 && (
              <button
                onClick={() => setRiwayat([])}
                title="Hapus riwayat"
                className="p-1.5 rounded-lg transition"
                style={{
                  background: "rgba(239,68,68,0.10)",
                  border: "1px solid rgba(239,68,68,0.20)",
                  color: "#f87171",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(239,68,68,0.20)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(239,68,68,0.10)")
                }
              >
                🗑
              </button>
            )}
          </div>
        </div>

        {/* Baris 2: Tab pills waktu */}
        <div
          className="flex items-center gap-1 p-1 rounded-full w-fit"
          style={{ background: "rgba(0,0,0,0.35)" }}
        >
          {JAM_PILIHAN.map((j) => (
            <button
              key={j.value}
              onClick={() => setJam(j.value)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition"
              style={
                jam === j.value
                  ? {
                      background: "#3A8E85",
                      color: "white",
                      boxShadow: "0 0 10px rgba(58,142,133,0.50)",
                    }
                  : { color: "rgba(255,255,255,0.45)" }
              }
            >
              {j.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CHAT AREA ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {riwayat.length === 0 && !loading ? (
          <WelcomeScreen onKirim={kirim} username={username} />
        ) : (
          <div className="px-4 py-4 space-y-4">
            {riwayat.map((item, i) =>
              item.tipe === "pengguna" ? (
                <div key={i} className="flex justify-end anim-fade-up">
                  <div
                    className="text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%] text-sm leading-relaxed"
                    style={{
                      background: "linear-gradient(135deg,#3A8E85,#006B5F)",
                      boxShadow: "0 2px 12px rgba(58,142,133,0.35)",
                    }}
                  >
                    {item.teks}
                  </div>
                </div>
              ) : (
                <PesanAI
                  key={i}
                  teks={item.teks}
                  jumlah={item.jumlah}
                  radius_km={item.radius_km}
                  jam={item.jam}
                />
              ),
            )}

            {loading && <ThinkingAnimation step={thinkingStep} />}

            {error && !loading && (
              <p
                className="text-xs rounded-xl px-3 py-2"
                style={{
                  color: "#fca5a5",
                  background: "rgba(239,68,68,0.10)",
                  border: "1px solid rgba(239,68,68,0.25)",
                }}
              >
                {error}
              </p>
            )}

            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {/* ── INPUT BAR ── */}
      <div
        className="px-4 pb-4 pt-3 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        {!lokasi && (
          <p className="text-xs mb-2" style={{ color: "#fcd34d" }}>
            ⚠️ Izinkan akses lokasi untuk analisis data lokal
          </p>
        )}

        {/* Pill input */}
        <div
          className="flex items-center gap-2"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "9999px",
            padding: "6px 6px 6px 16px",
          }}
        >
          <input
            type="text"
            value={pertanyaan}
            onChange={(e) => setPertanyaan(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && kirim()}
            placeholder="Tuliskan pesan kesehatan Anda..."
            className="flex-1 min-w-0 text-sm bg-transparent focus:outline-none"
            style={{ color: "#e8f4f3" }}
          />

          <button
            onClick={() => kirim()}
            disabled={loading || !pertanyaan.trim()}
            className="flex-shrink-0 flex items-center justify-center rounded-full transition"
            style={{
              background:
                loading || !pertanyaan.trim()
                  ? "rgba(58,142,133,0.25)"
                  : "#3A8E85",
              width: "34px",
              height: "34px",
              color: "white",
              boxShadow:
                loading || !pertanyaan.trim()
                  ? "none"
                  : "0 0 12px rgba(58,142,133,0.55)",
            }}
          >
            {loading ? (
              <div
                style={{
                  width: "13px",
                  height: "13px",
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.25)",
                  borderTopColor: "white",
                  animation: "ai-spin 0.7s linear infinite",
                }}
              />
            ) : (
              <span style={{ fontSize: "13px" }}>➤</span>
            )}
          </button>
        </div>

        <p
          className="text-[10px] text-center mt-2"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          Jawaban didasarkan pada data surveilans lokal, bukan pengetahuan umum
        </p>
      </div>

      <style>{`@keyframes ai-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
