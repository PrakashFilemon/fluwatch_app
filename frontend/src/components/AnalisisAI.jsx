/**
 * AnalisisAI — Panel analisis AI Agent berbasis data lokal.
 * Pengguna memilih radius, lalu AI menganalisis kasus terdekat dari DB.
 */
import { useState } from "react";
import { tanyaAI } from "../services/api";

const PERTANYAAN_SURVEILANS = [
  "Apakah ada wabah influenza di dekat saya?",
  "Berapa kasus influenza dalam radius 10km dari saya?",
];

const PERTANYAAN_KESEHATAN = [
  "Bagaimana cara mengobati influenza di rumah?",
  "Obat apa yang bisa dikonsumsi untuk influenza?",
];

const RADIUS_PILIHAN = [5, 10, 20, 50];

function IkonRobot() {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
      style={{ background: "linear-gradient(135deg,#3A8E85,#006B5F)" }}
    >
      🦠
    </div>
  );
}

function GelembungAI({ teks }) {
  return (
    <div className="flex gap-3 anim-fade-up">
      <IkonRobot />
      <div
        className="rounded-2xl rounded-bl-sm px-4 py-3 max-w-full text-sm leading-relaxed"
        style={{
          background: "#f8fffe",
          border: "1px solid rgba(58,142,133,0.12)",
          color: "#374151",
        }}
      >
        {teks.split("\n").map((baris, i) => (
          <p key={i} className={baris === "" ? "mt-2" : ""}>
            {baris}
          </p>
        ))}
      </div>
    </div>
  );
}

function IndikatorTik() {
  return (
    <div className="flex gap-3">
      <IkonRobot />
      <div
        className="rounded-2xl rounded-bl-sm px-4 py-3"
        style={{ background: "#f0faf9", border: "1px solid rgba(58,142,133,0.15)" }}
      >
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ background: "#3A8E85", animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AnalisisAI({ lokasi }) {
  const [pertanyaan, setPertanyaan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState(10);
  const [riwayat, setRiwayat] = useState([]); // riwayat tanya-jawab

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

    // Tambah pertanyaan ke riwayat
    setRiwayat((r) => [...r, { tipe: "pengguna", teks: q }]);

    try {
      const data = await tanyaAI({
        lat: lokasi.lat,
        lng: lokasi.lng,
        pertanyaan: q,
        radius_km: radius,
        jam: 48,
      });

      setRiwayat((r) => [
        ...r,
        {
          tipe: "ai",
          teks: data.jawaban,
          jumlah: data.jumlah_kasus,
          radius_km: data.radius_km,
        },
      ]);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan pada layanan AI.");
      setRiwayat((r) => [
        ...r,
        {
          tipe: "ai",
          teks: `❌ Kesalahan: ${err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{
        background: "#ffffff",
        border: "1px solid rgba(58,142,133,0.15)",
        boxShadow: "0 2px 16px rgba(58,142,133,0.08)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{ background: "#f0faf9", borderBottom: "1px solid rgba(58,142,133,0.12)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-semibold" style={{ color: "#1a2e2c" }}>FluWatch AI Agent</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "rgba(58,142,133,0.10)", color: "#3A8E85" }}
            >
              Analis Data Medis
            </span>
          </div>
          {/* Pilihan radius */}
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "#64748b" }}>
            <span>Radius:</span>
            <select
              value={radius}
              onChange={(e) => setRadius(+e.target.value)}
              className="rounded px-1.5 py-1 text-xs focus:outline-none"
              style={{
                background: "#f8fffe",
                border: "1px solid rgba(58,142,133,0.25)",
                color: "#374151",
              }}
            >
              {RADIUS_PILIHAN.map((r) => (
                <option key={r} value={r}>
                  {r} km
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Area percakapan */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {/* Pesan sambutan */}
        {riwayat.length === 0 && (
          <GelembungAI
            teks={
              "Halo! Saya FluWatch AI, agen analis penyebaran influenza Anda.\n\n" +
              "Saya akan menjawab pertanyaan Anda berdasarkan data laporan nyata dari " +
              "database surveilans lokal — bukan hanya pengetahuan umum.\n\n" +
              "Pilih pertanyaan di bawah atau ketik pertanyaan Anda sendiri."
            }
          />
        )}

        {/* Riwayat percakapan */}
        {riwayat.map((item, i) =>
          item.tipe === "pengguna" ? (
            <div key={i} className="flex justify-end anim-fade-up">
              <div
                className="text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%] text-sm"
                style={{ background: "linear-gradient(135deg,#3A8E85,#006B5F)" }}
              >
                {item.teks}
              </div>
            </div>
          ) : (
            <div key={i} className="space-y-2">
              <GelembungAI teks={item.teks} />
              {item.jumlah !== undefined && (
                <div className="flex gap-2 pl-11 text-xs">
                  <span
                    className="px-2.5 py-1 rounded-full"
                    style={{ background: "#f0faf9", border: "1px solid rgba(58,142,133,0.15)", color: "#64748b" }}
                  >
                    📍 {item.jumlah} kasus ditemukan
                  </span>
                  <span
                    className="px-2.5 py-1 rounded-full"
                    style={{ background: "#f0faf9", border: "1px solid rgba(58,142,133,0.15)", color: "#64748b" }}
                  >
                    🔍 Radius {item.radius_km} km
                  </span>
                </div>
              )}
            </div>
          ),
        )}

        {loading && <IndikatorTik />}

        {error && !loading && (
          <p
            className="text-xs rounded-lg px-3 py-2"
            style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}
          >
            {error}
          </p>
        )}
      </div>

      {/* Pertanyaan cepat */}
      {riwayat.length === 0 && (
        <div className="px-4 pb-2 flex-shrink-0 space-y-2">
          <div>
            <p className="text-xs mb-1.5" style={{ color: "#64748b" }}>📍 Surveilans lokal:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {PERTANYAAN_SURVEILANS.map((q) => (
                <button
                  key={q}
                  onClick={() => kirim(q)}
                  className="text-left text-xs px-3 py-2 rounded-lg transition"
                  style={{
                    background: "rgba(58,142,133,0.06)",
                    border: "1px solid rgba(58,142,133,0.12)",
                    color: "#374151",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(58,142,133,0.12)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(58,142,133,0.06)"}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs mb-1.5" style={{ color: "#64748b" }}>
              💊 Pengobatan & Pencegahan:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {PERTANYAAN_KESEHATAN.map((q) => (
                <button
                  key={q}
                  onClick={() => kirim(q)}
                  className="text-left text-xs px-3 py-2 rounded-lg transition"
                  style={{
                    background: "rgba(58,142,133,0.06)",
                    border: "1px solid rgba(58,142,133,0.12)",
                    color: "#374151",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(58,142,133,0.12)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(58,142,133,0.06)"}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div
        className="px-4 pb-4 pt-2 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(58,142,133,0.12)" }}
      >
        {!lokasi && (
          <p className="text-xs text-yellow-600 mb-2">
            ⚠️ Izinkan akses lokasi untuk analisis data lokal
          </p>
        )}
        <div className="flex gap-2 w-full">
          <input
            type="text"
            value={pertanyaan}
            onChange={(e) => setPertanyaan(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && kirim()}
            placeholder="Tanya tentang penyebaran flu di area Anda..."
            className="flex-1 min-w-0 rounded-xl px-3 py-2.5 text-sm focus:outline-none transition"
            style={{
              background: "#f8fffe",
              border: "1px solid rgba(58,142,133,0.25)",
              color: "#374151",
            }}
            onFocus={e => e.target.style.borderColor = "#3A8E85"}
            onBlur={e => e.target.style.borderColor = "rgba(58,142,133,0.25)"}
          />
          <button
            onClick={() => kirim()}
            disabled={loading || !pertanyaan.trim()}
            className="text-white px-4 rounded-xl text-sm font-medium transition flex-shrink-0"
            style={{
              background: loading || !pertanyaan.trim() ? "rgba(58,142,133,0.15)" : "#3A8E85",
              color: loading || !pertanyaan.trim() ? "#94a3b8" : "#fff",
            }}
          >
            {loading ? "..." : "Tanya"}
          </button>
        </div>
        <p className="text-xs mt-1.5 text-center" style={{ color: "#94a3b8" }}>
          Jawaban didasarkan pada data surveilans lokal, bukan pengetahuan umum
        </p>
      </div>
    </div>
  );
}
