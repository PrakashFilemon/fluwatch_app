/**
 * AnalisisAI — Panel analisis AI Agent berbasis data lokal.
 * Pengguna memilih radius, lalu AI menganalisis kasus terdekat dari DB.
 */
import { useState } from "react";
import { tanyaAI } from "../services/api";

const PERTANYAAN_SURVEILANS = [
  "Apakah ada wabah influenza di dekat saya?",
  "Berapa kasus influenza dalam radius 10km dari saya?",
  "Apa gejala yang paling banyak dilaporkan di area saya?",
  "Bagaimana tingkat risiko influenza di lokasi saya saat ini?",
];

const PERTANYAAN_KESEHATAN = [
  "Bagaimana cara mengobati influenza di rumah?",
  "Obat apa yang bisa dikonsumsi untuk influenza?",
  "Apa saja cara mencegah penularan influenza?",
  "Kapan saya harus ke dokter atau IGD?",
];

const RADIUS_PILIHAN = [5, 10, 20, 50];

function IkonRobot() {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-sm flex-shrink-0">
      🦠
    </div>
  );
}

function GelembungAI({ teks }) {
  return (
    <div className="flex gap-3 anim-fade-up">
      <IkonRobot />
      <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3 max-w-full text-sm text-gray-100 leading-relaxed">
        {teks.split("\n").map((baris, i) => (
          <p key={i} className={baris === "" ? "mt-2" : ""}>{baris}</p>
        ))}
      </div>
    </div>
  );
}

function IndikatorTik() {
  return (
    <div className="flex gap-3">
      <IkonRobot />
      <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AnalisisAI({ lokasi }) {
  const [pertanyaan, setPertanyaan] = useState("");
  const [hasil,      setHasil]      = useState(null);   // { jawaban, jumlah_kasus, radius_km }
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [radius,     setRadius]     = useState(10);
  const [riwayat,    setRiwayat]    = useState([]);     // riwayat tanya-jawab

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
    setRiwayat(r => [...r, { tipe: "pengguna", teks: q }]);

    try {
      const data = await tanyaAI({
        lat:        lokasi.lat,
        lng:        lokasi.lng,
        pertanyaan: q,
        radius_km:  radius,
        jam:        48,
      });

      setHasil(data);
      setRiwayat(r => [...r, {
        tipe:        "ai",
        teks:        data.jawaban,
        jumlah:      data.jumlah_kasus,
        radius_km:   data.radius_km,
      }]);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan pada layanan AI.");
      setRiwayat(r => [...r, {
        tipe: "ai",
        teks: `❌ Kesalahan: ${err.message}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-semibold">FluWatch AI Agent</span>
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
              Analis Data Medis
            </span>
          </div>
          {/* Pilihan radius */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>Radius:</span>
            <select
              value={radius}
              onChange={e => setRadius(+e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-1.5 py-1 text-gray-200 text-xs focus:outline-none"
            >
              {RADIUS_PILIHAN.map(r => (
                <option key={r} value={r}>{r} km</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Area percakapan */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">

        {/* Pesan sambutan */}
        {riwayat.length === 0 && (
          <GelembungAI teks={
            "Halo! Saya FluWatch AI, agen analis penyebaran influenza Anda.\n\n" +
            "Saya akan menjawab pertanyaan Anda berdasarkan data laporan nyata dari " +
            "database surveilans lokal — bukan hanya pengetahuan umum.\n\n" +
            "Pilih pertanyaan di bawah atau ketik pertanyaan Anda sendiri."
          } />
        )}

        {/* Riwayat percakapan */}
        {riwayat.map((item, i) => (
          item.tipe === "pengguna" ? (
            <div key={i} className="flex justify-end anim-fade-up">
              <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%] text-sm">
                {item.teks}
              </div>
            </div>
          ) : (
            <div key={i} className="space-y-2">
              <GelembungAI teks={item.teks} />
              {item.jumlah !== undefined && (
                <div className="flex gap-2 pl-11 text-xs">
                  <span className="bg-gray-800 border border-gray-700 px-2.5 py-1 rounded-full text-gray-400">
                    📍 {item.jumlah} kasus ditemukan
                  </span>
                  <span className="bg-gray-800 border border-gray-700 px-2.5 py-1 rounded-full text-gray-400">
                    🔍 Radius {item.radius_km} km
                  </span>
                </div>
              )}
            </div>
          )
        ))}

        {loading && <IndikatorTik />}

        {error && !loading && (
          <p className="text-xs text-red-400 bg-red-950/30 border border-red-800 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>

      {/* Pertanyaan cepat */}
      {riwayat.length === 0 && (
        <div className="px-4 pb-2 flex-shrink-0 space-y-2">
          <div>
            <p className="text-xs text-gray-500 mb-1.5">📍 Surveilans lokal:</p>
            <div className="flex flex-col gap-1">
              {PERTANYAAN_SURVEILANS.slice(0, 2).map(q => (
                <button
                  key={q}
                  onClick={() => kirim(q)}
                  className="text-left text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-2 rounded-lg transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1.5">💊 Pengobatan & Pencegahan:</p>
            <div className="flex flex-col gap-1">
              {PERTANYAAN_KESEHATAN.slice(0, 2).map(q => (
                <button
                  key={q}
                  onClick={() => kirim(q)}
                  className="text-left text-xs bg-gray-800 hover:bg-blue-900/30 border border-gray-700 hover:border-blue-700 text-gray-300 px-3 py-2 rounded-lg transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-700 flex-shrink-0">
        {!lokasi && (
          <p className="text-xs text-yellow-500 mb-2">
            ⚠️ Izinkan akses lokasi untuk analisis data lokal
          </p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={pertanyaan}
            onChange={e => setPertanyaan(e.target.value)}
            onKeyDown={e => e.key === "Enter" && kirim()}
            placeholder="Tanya tentang penyebaran flu di area Anda..."
            className="flex-1 bg-gray-800 border border-gray-700 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none transition"
          />
          <button
            onClick={() => kirim()}
            disabled={loading || !pertanyaan.trim()}
            className="bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 rounded-xl text-sm font-medium transition"
          >
            {loading ? "..." : "Tanya"}
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1.5 text-center">
          Jawaban didasarkan pada data surveilans lokal, bukan pengetahuan umum
        </p>
      </div>
    </div>
  );
}
